"use client";

import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchObservationGeoJson } from "../../lib/observations-api";
import { getPlaceLabel } from "../../lib/mapbox-place";
import {
  LATAM_BOUNDS_ARRAY,
  MIN_ZOOM,
  MAX_ZOOM,
  DATA_CENTER,
  DATA_ENTRY_ZOOM,
  DATA_MARKER_HIDE_ZOOM,
  type MapStyle,
} from "../../lib/mapbox-config";
import type {
  Bbox,
  LngLat,
  MapViewProps,
  ObservationFeatureCollection,
  ObservationGeoJsonResponse,
} from "../../types/map.types";
import { useMapbox } from "../../hooks/useMapbox";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { MapControls } from "./MapControls";

const OBS_SOURCE_ID = "observations-source";
const OBS_ACCURACY_SOURCE_ID = "observations-accuracy-source";
const OBS_ACCURACY_FILL_LAYER_ID = "observations-accuracy-fill";
const OBS_ACCURACY_STROKE_LAYER_ID = "observations-accuracy-stroke";
const OBS_CLUSTER_HALO_LAYER_ID = "observations-cluster-halo";
const OBS_CLUSTER_LAYER_ID = "observations-cluster";
const OBS_CLUSTER_COUNT_LAYER_ID = "observations-cluster-count";
const OBS_POINT_LAYER_ID = "observations-point-symbol";
const OBS_ICON_DRIVE_ID = "observations-pin-drive";
const OBS_ICON_INAT_ID = "observations-pin-inat";

const EMPTY_COLLECTION: ObservationFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};
const EMPTY_ACCURACY_COLLECTION = {
  type: "FeatureCollection",
  features: [],
};

type CachedViewportEntry = {
  data: ObservationFeatureCollection;
  meta: ObservationGeoJsonResponse["meta"];
  cachedAt: number;
};

// Redondeo más grueso (1 decimal) → más aciertos de caché en pan pequeños
const VIEWPORT_PADDING_DEGREES = 0.25;
const VIEWPORT_KEY_PRECISION = 1;
const VIEWPORT_CACHE_MAX = 35;
const VIEWPORT_CACHE_TTL_MS = 90_000;

// Easing quintic out: arranque rápido, frenado suave → sensación premium
const PREMIUM_EASING = (t: number): number =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
// Easing cúbico out: más suave para clusters y pan
const SOFT_PREMIUM_EASING = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const MAX_POINT_FOCUS_ZOOM = 16;
const POINT_RECENTER_DURATION_MS = 680;
const POINT_RECENTER_PIXEL_THRESHOLD = 88;
// Paso de zoom por botón: 0.75 da un salto más perceptible y satisfactorio
const BUTTON_ZOOM_STEP = 0.75;
// Duración del zoom por botón: 420ms es rápido pero no brusco
const BUTTON_ZOOM_DURATION_MS = 420;
const SAVE_STATE_DEBOUNCE_MS = 700;

const getPointFocusDuration = (currentZoom: number, targetZoom: number): number => {
  const zoomDelta = Math.abs(targetZoom - currentZoom);
  return Math.round(820 + Math.min(380, zoomDelta * 180));
};
const getClusterFocusDuration = (currentZoom: number, targetZoom: number): number => {
  const zoomDelta = Math.abs(targetZoom - currentZoom);
  return Math.round(1120 + Math.min(260, zoomDelta * 180));
};

const normalizeLngToReference = (lng: number, referenceLng: number): number => {
  let adjustedLng = lng;
  while (Math.abs(referenceLng - adjustedLng) > 180) {
    adjustedLng += referenceLng > adjustedLng ? 360 : -360;
  }
  return adjustedLng;
};

const getWrappedPointCoordinates = (
  feature: mapboxgl.MapboxGeoJSONFeature,
  referenceLng: number,
): [number, number] | null => {
  const geometry = feature.geometry;
  if (!geometry || geometry.type !== "Point") {
    return null;
  }

  const [lng, lat] = geometry.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") {
    return null;
  }
  return [normalizeLngToReference(lng, referenceLng), lat];
};

// IDs de capas propias en orden de dependencia (las capas que usan un source deben
// eliminarse ANTES que el source mismo).
const OWN_LAYER_IDS = [
  OBS_POINT_LAYER_ID,
  OBS_CLUSTER_COUNT_LAYER_ID,
  OBS_CLUSTER_LAYER_ID,
  OBS_CLUSTER_HALO_LAYER_ID,
  OBS_ACCURACY_STROKE_LAYER_ID,
  OBS_ACCURACY_FILL_LAYER_ID,
] as const;

// Verifica que el mapa y su estilo interno estén disponibles antes de operar.
// map.getSource / map.getLayer fallan con TypeError si el estilo fue destruido.
const isMapStyleReady = (map: mapboxgl.Map): boolean => {
  try {
    return !!map.getStyle();
  } catch {
    return false;
  }
};

// Elimina solo nuestras capas y fuente conocidas → O(1) en vez de iterar todo el estilo.
const removeObservationLayers = (map: mapboxgl.Map): void => {
  // Evitar error Cannot read properties of undefined si el mapa
  // fue destruido al cambiar de estilo (su estilo es undefined)
  try {
    if (!map.getStyle()) {
      return;
    }
  } catch {
    return;
  }

  try {
    for (const layerId of OWN_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    }

    if (map.getSource(OBS_SOURCE_ID)) {
      map.removeSource(OBS_SOURCE_ID);
    }
    if (map.getSource(OBS_ACCURACY_SOURCE_ID)) {
      map.removeSource(OBS_ACCURACY_SOURCE_ID);
    }
  } catch (error) {
    // Silenciamos cualquier error interno de mapbox durante la limpieza
    console.warn("No se pudieron limpiar las capas del mapa:", error);
  }
};

// ── SVG map-pin de Lucide ─────────────────────────────────────────────────────
// Pin Drive: azul con borde azul claro y sombra azul profundo.
const mapPinDriveSvg = (): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="64" viewBox="-2 -2 28 30" fill="none">
  <defs>
    <filter id="mpglow-drive" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#1e3a8a" flood-opacity="0.5"/>
    </filter>
    <linearGradient id="drive-body" x1="8" y1="2" x2="16" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="55%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="drive-shine" x1="8" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="drive-dot-bg" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="45%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <radialGradient id="drive-dot-shine" cx="35%" cy="28%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g filter="url(#mpglow-drive)">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#drive-body)" stroke="#bfdbfe" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#drive-shine)"/>
    <circle cx="12" cy="10" r="3.5" fill="#ffffff" opacity="0.96"/>
    <circle cx="12" cy="10" r="2.9" fill="none" stroke="#bfdbfe" stroke-width="0.4" opacity="0.8"/>
    <circle cx="12" cy="10" r="2.0" fill="url(#drive-dot-bg)"/>
    <circle cx="12" cy="10" r="2.0" fill="url(#drive-dot-shine)"/>
    <circle cx="11.3" cy="9.3" r="0.55" fill="#ffffff" opacity="0.7"/>
  </g>
</svg>
`;

// Pin iNaturalist: verde jade/salvia premium, punto limpio y elegante.
const mapPinInatSvg = (): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="64" viewBox="-2 -2 28 30" fill="none">
  <defs>
    <filter id="mpglow-inat" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#064e3b" flood-opacity="0.45"/>
    </filter>
    <linearGradient id="inat-body" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="40%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
    <linearGradient id="inat-shine" x1="7" y1="3" x2="13" y2="11" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g filter="url(#mpglow-inat)">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#inat-body)" stroke="#bbf7d0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#inat-shine)"/>
    <!-- Círculo blanco limpio -->
    <circle cx="12" cy="10" r="3.3" fill="#ffffff"/>
    <!-- Anillo de color entre blanco y punto -->
    <circle cx="12" cy="10" r="2.5" fill="#dcfce7"/>
    <!-- Punto central sólido y limpio -->
    <circle cx="12" cy="10" r="1.5" fill="#15803d"/>
  </g>
</svg>
`;

// Pre-computar las URLs de datos SVG una sola vez al cargar el módulo.
const SVG_DRIVE_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mapPinDriveSvg())}`;
const SVG_INAT_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mapPinInatSvg())}`;

// ── Marcador de entrada (vista de continentes) ────────────────────────────────
// Pin con tooltip premium controlado por JS (mouseenter/mouseleave).
// El tooltip es un elemento hermano del pin-wrap, NO un hijo,
// para evitar el rebote por re-trigger del hover.
const createEntryMarkerElement = (): HTMLElement => {
  const el = document.createElement("div");
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", "Ver observaciones en Colombia");
  el.style.cssText =
    "width:44px;height:52px;cursor:pointer;position:relative;display:flex;align-items:flex-end;justify-content:center";

  el.innerHTML = `
    <style>
      @keyframes obs-pin-pulse {
        0%   { transform:translateX(-50%) scale(1);   opacity:0.45; }
        65%  { transform:translateX(-50%) scale(2.6); opacity:0; }
        100% { transform:translateX(-50%) scale(2.6); opacity:0; }
      }
      @keyframes obs-pill-blink {
        0%,100% { opacity:1; }
        50%      { opacity:0.4; }
      }
      .obs-pin-dot {
        position:absolute; bottom:1px; left:50%;
        transform:translateX(-50%);
        width:6px; height:6px; border-radius:50%;
        background:rgba(37,99,235,0.38);
        animation:obs-pin-pulse 3s cubic-bezier(0.4,0,0.6,1) infinite;
      }
      .obs-pin-dot:nth-child(2){ animation-delay:1.2s; }
      .obs-pin-svg {
        position:relative; z-index:1;
        filter:drop-shadow(0 3px 9px rgba(37,99,235,0.48));
        transition:transform 280ms cubic-bezier(0.25,0.46,0.45,0.94),
                   filter 280ms ease;
      }
      .obs-pin-wrap:hover .obs-pin-svg {
        transform:scale(1.05) translateY(-1px);
        filter:drop-shadow(0 5px 14px rgba(37,99,235,0.52));
      }
      /* ── Tooltip ── */
      .obs-tt {
        position:fixed;
        z-index:9999;
        pointer-events:none;
        opacity:0;
        transform:translateY(6px) scale(0.96);
        transition:opacity 220ms cubic-bezier(0.25,0.46,0.45,0.94),
                   transform 220ms cubic-bezier(0.25,0.46,0.45,0.94);
        transform-origin:bottom center;
      }
      .obs-tt.obs-tt--visible {
        opacity:1;
        transform:translateY(0) scale(1);
      }
      .obs-tt-card {
        background:#ffffff;
        border:1.5px solid rgba(203,213,225,0.9);
        border-radius:16px;
        overflow:hidden;
        width:210px;
        box-shadow:
          0 2px 4px rgba(15,23,42,0.04),
          0 8px 24px rgba(15,23,42,0.10),
          0 24px 48px rgba(15,23,42,0.08);
      }
      .obs-tt-header {
        background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 60%,#e0e7ff 100%);
        padding:11px 13px 10px;
        display:flex;
        align-items:center;
        gap:10px;
        border-bottom:1.5px solid rgba(203,213,225,0.7);
      }
      .obs-tt-icon {
        width:34px; height:34px; flex-shrink:0;
        border-radius:10px;
        background:linear-gradient(135deg,#3b82f6,#2563eb);
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 8px rgba(37,99,235,0.4),
                   0 0 0 3px rgba(59,130,246,0.18);
      }
      .obs-tt-location {
        font-family:Poppins,system-ui,sans-serif;
        font-size:13px; font-weight:700;
        color:#0f172a; letter-spacing:-0.02em; line-height:1.2;
      }
      .obs-tt-sublabel {
        font-family:Poppins,system-ui,sans-serif;
        font-size:9.5px; font-weight:600;
        color:#64748b; letter-spacing:0.05em;
        text-transform:uppercase; margin-top:2px;
      }
      .obs-tt-body {
        padding:11px 13px 12px;
        display:flex; align-items:center;
        justify-content:space-between; gap:8px;
        background:#ffffff;
      }
      .obs-tt-count-label {
        font-family:Poppins,system-ui,sans-serif;
        font-size:9px; font-weight:700;
        color:#94a3b8; letter-spacing:0.07em;
        text-transform:uppercase; margin-bottom:3px;
      }
      .obs-tt-count-value {
        font-family:Poppins,system-ui,sans-serif;
        font-size:22px; font-weight:800;
        color:#1e40af; letter-spacing:-0.04em; line-height:1;
      }
      .obs-tt-badge {
        display:inline-flex; align-items:center; gap:5px;
        background:linear-gradient(135deg,#f0fdf4,#dcfce7);
        border:1.5px solid rgba(34,197,94,0.25);
        border-radius:999px;
        padding:5px 11px 5px 8px;
        font-family:Poppins,system-ui,sans-serif;
        font-size:10px; font-weight:700;
        color:#15803d; letter-spacing:0.01em;
        white-space:nowrap;
      }
      .obs-tt-badge-dot {
        width:7px; height:7px; border-radius:50%;
        background:#22c55e;
        box-shadow:0 0 0 2px rgba(34,197,94,0.3);
        animation:obs-pill-blink 2s ease-in-out infinite;
      }
      .obs-tt-arrow {
        position:absolute;
        bottom:-8px; left:50%;
        transform:translateX(-50%);
        width:16px; height:8px; overflow:visible;
      }
      .obs-tt-arrow::after {
        content:'';
        position:absolute;
        bottom:0; left:50%;
        transform:translateX(-50%) rotate(45deg);
        width:12px; height:12px;
        background:#ffffff;
        border-right:1.5px solid rgba(203,213,225,0.9);
        border-bottom:1.5px solid rgba(203,213,225,0.9);
        border-radius:0 0 3px 0;
      }
    </style>
    <div class="obs-pin-wrap" style="width:44px;height:52px;position:relative;display:flex;align-items:flex-end;justify-content:center;will-change:opacity,transform;transform-origin:center bottom;">
      <div class="obs-pin-dot"></div>
      <div class="obs-pin-dot"></div>
      <svg class="obs-pin-svg" width="36" height="44" viewBox="0 0 24 24" fill="none"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
              fill="#2563eb" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="12" cy="10" r="3" fill="#ffffff"/>
        <circle cx="12" cy="10" r="1.5" fill="#2563eb"/>
      </svg>
    </div>
  `;
  return el;
};

const loadIconFromUrl = (url: string): Promise<HTMLImageElement> =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No fue posible cargar el icóno: ${url}`));
    img.src = url;
  });

const ensurePointIcons = async (map: mapboxgl.Map): Promise<void> => {
  const pending: Promise<void>[] = [];

  if (!map.hasImage(OBS_ICON_DRIVE_ID)) {
    pending.push(
      loadIconFromUrl(SVG_DRIVE_URL).then((img) =>
        map.addImage(OBS_ICON_DRIVE_ID, img, { pixelRatio: 2 }),
      ),
    );
  }

  if (!map.hasImage(OBS_ICON_INAT_ID)) {
    pending.push(
      loadIconFromUrl(SVG_INAT_URL).then((img) =>
        map.addImage(OBS_ICON_INAT_ID, img, { pixelRatio: 2 }),
      ),
    );
  }

  // Cargar todos los íconos faltantes en paralelo
  await Promise.all(pending);
};

const getBoundsBbox = (map: mapboxgl.Map): Bbox => {
  const bounds = map.getBounds();
  if (!bounds) {
    return [...LATAM_BOUNDS_ARRAY] as Bbox;
  }

  return [
    bounds.getWest() - VIEWPORT_PADDING_DEGREES,
    bounds.getSouth() - VIEWPORT_PADDING_DEGREES,
    bounds.getEast() + VIEWPORT_PADDING_DEGREES,
    bounds.getNorth() + VIEWPORT_PADDING_DEGREES,
  ];
};

const getLimitByZoom = (zoom: number): number => {
  if (zoom < 4) {
    return 1800;
  }

  if (zoom < 6) {
    return 2600;
  }

  if (zoom < 8) {
    return 3600;
  }

  if (zoom < 10) {
    return 4800;
  }

  return 6200;
};

const buildViewportKey = (bbox: Bbox, limit: number): string => {
  const rounded = bbox.map((value) => value.toFixed(VIEWPORT_KEY_PRECISION));
  return `${rounded.join(",")}|${limit}`;
};

const pruneViewportCache = (cache: Map<string, CachedViewportEntry>, now: number): void => {
  for (const [key, entry] of cache.entries()) {
    if (now - entry.cachedAt > VIEWPORT_CACHE_TTL_MS) {
      cache.delete(key);
    }
  }

  while (cache.size > VIEWPORT_CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    cache.delete(oldestKey);
  }
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatObservedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatAccuracy = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "No reportada";
  }

  if (value < 10) {
    return `${value.toFixed(1)} m`;
  }

  return `${Math.round(value)} m`;
};

const toAccuracyRingCoordinates = (
  center: [number, number],
  radiusMeters: number,
  segments = 56,
): [number, number][] => {
  const [centerLng, centerLat] = center;
  const points: [number, number][] = [];
  const safeSegments = Math.max(12, segments);
  const latFactor = 111320;
  const lngFactor = Math.max(111320 * Math.cos((centerLat * Math.PI) / 180), 1e-8);

  for (let i = 0; i <= safeSegments; i += 1) {
    const angle = (2 * Math.PI * i) / safeSegments;
    const lat = centerLat + (radiusMeters * Math.sin(angle)) / latFactor;
    const lng = centerLng + (radiusMeters * Math.cos(angle)) / lngFactor;
    points.push([lng, lat]);
  }

  return points;
};

const buildAccuracyCollection = (
  center: [number, number],
  accuracyMeters: number,
): GeoJSON.FeatureCollection<GeoJSON.Polygon> => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        accuracy: accuracyMeters,
      },
      geometry: {
        type: "Polygon",
        coordinates: [toAccuracyRingCoordinates(center, accuracyMeters)],
      },
    },
  ],
});

const popupContentFromProperties = (properties: Record<string, unknown>): string => {
  const source = properties.source === "inaturalist" ? "iNaturalist" : "Drive";
  const scientificName =
    typeof properties.scientificName === "string" ? properties.scientificName : "Sin especie";
  const taxonomicGroup =
    typeof properties.taxonomicGroup === "string"
      ? properties.taxonomicGroup
      : "Grupo no disponible";
  const username =
    typeof properties.username === "string" ? properties.username : "Usuario no disponible";
  const observedAt =
    typeof properties.observedAt === "string"
      ? formatObservedAt(properties.observedAt)
      : "Fecha no disponible";
  const accuracy = formatAccuracy(properties.accuracy);

  return `
    <div class="popup-entrance" style="min-width:220px; font-family: Poppins, system-ui, sans-serif; color: #1f2937;">
      <div style="display:inline-block; margin-bottom:8px; padding:3px 8px; border-radius:999px; background:${
        source === "iNaturalist" ? "#dcfce7" : "#e0f2fe"
      }; color:${source === "iNaturalist" ? "#166534" : "#075985"}; font-size:11px; font-weight:600;">
        ${escapeHtml(source)}
      </div>
      <div style="font-size:14px; font-weight:700; line-height:1.2; margin-bottom:6px;">${escapeHtml(scientificName)}</div>
      <div style="font-size:12px; margin-bottom:4px;"><strong>Grupo:</strong> ${escapeHtml(taxonomicGroup)}</div>
      <div style="font-size:12px; margin-bottom:4px;"><strong>Usuario:</strong> ${escapeHtml(username)}</div>
      <div style="font-size:12px; margin-bottom:4px;"><strong>Precisión GPS:</strong> ${escapeHtml(accuracy)}</div>
      <div style="font-size:12px; margin-bottom:4px;"><strong>Fecha:</strong> ${escapeHtml(observedAt)}</div>
    </div>
  `;
};

const popupContentFromFeatures = (features: mapboxgl.MapboxGeoJSONFeature[]): string => {
  if (features.length === 1) {
    return popupContentFromProperties(features[0].properties as Record<string, unknown>);
  }

  const itemsHtml = features
    .map((f, i) => {
      const p = f.properties as Record<string, unknown>;
      const source = p.source === "inaturalist" ? "iNaturalist" : "Drive";
      const scientificName =
        typeof p.scientificName === "string" ? p.scientificName : "Sin especie";
      const taxonomicGroup = typeof p.taxonomicGroup === "string" ? p.taxonomicGroup : "";

      return `
      <div class="observation-item" data-index="${i}" style="padding: 10px 8px; margin: 0 -4px; border-radius: 8px; cursor: pointer; transition: transform 220ms cubic-bezier(0.22,1,0.36,1), background-color 220ms cubic-bezier(0.22,1,0.36,1); will-change: transform; border-bottom: 1px solid #f8fafc;">
        <div style="display:inline-block; margin-bottom:4px; padding:2px 6px; border-radius:9999px; background:${
          source === "iNaturalist" ? "#dcfce7" : "#e0f2fe"
        }; color:${source === "iNaturalist" ? "#166534" : "#075985"}; font-size:10px; font-weight:600;">
          ${escapeHtml(source)}
        </div>
        <div style="font-size:13px; font-weight:700; line-height:1.2; color: #1e293b;">${escapeHtml(scientificName)}</div>
        <div style="font-size:11px; color: #64748b;">${escapeHtml(taxonomicGroup)}</div>
      </div>
    `;
    })
    .join("");

  return `
    <div class="popup-entrance map-popup-root" style="min-width:240px; font-family: Poppins, system-ui, sans-serif; color: #1f2937;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; border: 1px solid #e2e8f0; display: inline-flex; align-items: center; justify-content: center;">
            ${features.length}
          </span>
          <div style="font-size:10px; font-weight:700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
            Observaciones aquí
          </div>
        </div>
        <button class="close-list-btn" style="background: #eff6ff; border: none; padding: 6px; border-radius: 8px; color: #3b82f6; cursor: pointer; display: flex; transition: transform 220ms cubic-bezier(0.22,1,0.36,1), background-color 220ms cubic-bezier(0.22,1,0.36,1);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="custom-scroll map-popup-scroll" style="max-height: 260px; overflow-y: auto; overflow-x: hidden; padding-right: 8px; margin-top: 4px;">
        ${itemsHtml}
      </div>
    </div>
  `;
};

const LOCAL_STORAGE_KEY = "soy_conservacion_map_state";

export function MapView({
  className,
  center: initialCenterProp,
  zoom: initialZoomProp,
  isUIHidden = false,
}: MapViewProps) {
  // Capa: siempre arranca en "terrain" al entrar por primera vez o abrir tab nuevo.
  // El usuario puede cambiarla durante la sesión pero no se persiste entre tabs.
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("terrain");

  // Posición: se restaura desde sessionStorage si el usuario refrescó el tab.
  // sessionStorage se borra al cerrar el tab → primera visita siempre ve la vista inicial.
  const [center] = useState<LngLat | undefined>(() => {
    if (typeof window === "undefined") return initialCenterProp;
    try {
      const stored = sessionStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as { center?: LngLat; zoom?: number };
        if (saved.center) return saved.center;
      }
    } catch {}
    return initialCenterProp;
  });

  const [zoom] = useState<number | undefined>(() => {
    if (typeof window === "undefined") return initialZoomProp;
    try {
      const stored = sessionStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as { center?: LngLat; zoom?: number };
        if (saved.zoom) return saved.zoom;
      }
    } catch {}
    return initialZoomProp;
  });
  const [zoomLimitNotice, setZoomLimitNotice] = useState(false);
  const [dataLoadNotice, setDataLoadNotice] = useState<string | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataLoadNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingStartedAtRef = useRef<number>(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const totalObservationsRef = useRef<number | null>(null);
  const onTotalUpdateRef = useRef<((total: number) => void) | null>(null);
  const inFlightCacheKeyRef = useRef<string | null>(null);
  const appliedCacheKeyRef = useRef<string | null>(null);
  const viewportCacheRef = useRef<Map<string, CachedViewportEntry>>(new Map());
  const queuedZoomRef = useRef<number | null>(null);
  const runningQueuedZoomRef = useRef(false);
  const saveStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref para mantener el popup activo y actualizar su contenido sin re-crearlo
  // en sub-navegación interna (lista → detalle), eliminando el flash visual.
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  // Ref del marcador de entrada (visible en zoom bajo, se oculta al acercarse)
  const entryMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [selection, setSelection] = useState<{
    features: mapboxgl.MapboxGeoJSONFeature[];
    coords: [number, number];
    selectedFeatureIndex?: number;
  } | null>(null);

  const { containerRef, map, ready, loadProgress } = useMapbox({
    center,
    zoom,
    style: currentStyle,
  });

  const applyDataToSource = useCallback(
    (mapInstance: mapboxgl.Map, data: ObservationFeatureCollection, cacheKey: string) => {
      if (!isMapStyleReady(mapInstance)) return;
      const source = mapInstance.getSource(OBS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!source) {
        return;
      }
      // Aplicar datos siempre, incluso durante zoom/pan.
      // Mapbox GL procesa el re-clustering en un worker thread separado,
      // sin bloquear el hilo principal ni el render del canvas.
      source.setData(data as GeoJSON.FeatureCollection);
      appliedCacheKeyRef.current = cacheKey;
    },
    [],
  );

  const showDataLoadNotice = useCallback((message: string) => {
    if (dataLoadNoticeTimerRef.current) {
      clearTimeout(dataLoadNoticeTimerRef.current);
    }
    setDataLoadNotice(message);
    dataLoadNoticeTimerRef.current = setTimeout(() => {
      setDataLoadNotice(null);
    }, 2400);
  }, []);

  const requestViewportPoints = useCallback(
    async (mapInstance: mapboxgl.Map) => {
      const bbox = getBoundsBbox(mapInstance);
      const limit = getLimitByZoom(mapInstance.getZoom());
      const cacheKey = buildViewportKey(bbox, limit);
      const now = Date.now();
      pruneViewportCache(viewportCacheRef.current, now);
      const cached = viewportCacheRef.current.get(cacheKey);

      if (cached) {
        // Evitar trabajo redundante si ya estamos mostrando exactamente este viewport
        if (appliedCacheKeyRef.current !== cacheKey) {
          applyDataToSource(mapInstance, cached.data, cacheKey);
        }
        hasLoadedOnceRef.current = true;
        return;
      }

      // Evita reiniciar la misma petición durante zoom/pan con eventos muy seguidos
      if (inFlightCacheKeyRef.current === cacheKey) {
        return;
      }

      activeRequestRef.current?.abort();
      const controller = new AbortController();
      activeRequestRef.current = controller;
      inFlightCacheKeyRef.current = cacheKey;

      try {
        let payload: Awaited<ReturnType<typeof fetchObservationGeoJson>> | null = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            payload = await fetchObservationGeoJson({
              bbox,
              limit,
              signal: controller.signal,
            });
            break;
          } catch {
            if (controller.signal.aborted) {
              throw new Error("aborted");
            }
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 220));
              continue;
            }
            throw new Error("fetch_failed");
          }
        }

        if (controller.signal.aborted) {
          return;
        }
        if (!payload) {
          console.warn("[map-data] No se recibió payload de la API");
          return;
        }

        console.info(
          `[map-data] Cargadas ${payload.data.features.length} observaciones para el viewport`,
        );
        applyDataToSource(mapInstance, payload.data, cacheKey);
        setDataLoadNotice(null);
        if (process.env.NODE_ENV !== "production" && payload.meta.timingsMs) {
          console.debug("[map-perf] viewport fetch", {
            limit,
            total: payload.meta.total,
            timingsMs: payload.meta.timingsMs,
            cacheKey,
          });
        }

        viewportCacheRef.current.set(cacheKey, {
          data: payload.data,
          meta: payload.meta,
          cachedAt: now,
        });
        // La póda ya se hizo antes del fetch; no es necesario volver a llamarla
        // con el mismo `now` porque no pueden haber entrado entradas nuevas mientras tanto.
        hasLoadedOnceRef.current = true;
        // Guardar el total global de observaciones para el tooltip del marcador de entrada
        if (totalObservationsRef.current === null || payload.meta.total > totalObservationsRef.current) {
          totalObservationsRef.current = payload.meta.total;
          onTotalUpdateRef.current?.(payload.meta.total);
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        showDataLoadNotice("Conexión inestable. Reintentaremos al mover el mapa.");
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
        if (inFlightCacheKeyRef.current === cacheKey) {
          inFlightCacheKeyRef.current = null;
        }
      }
    },
    [applyDataToSource, showDataLoadNotice],
  );

  useEffect(() => {
    if (!map || !ready) {
      return;
    }

    let disposed = false;

    // ── Variables para suprimir número fantasma durante zoom ──────────────────
    // Definidas en el scope del useEffect (no dentro del setTimeout) para que
    // el cleanup del return pueda acceder a ellas correctamente.
    let activeZooms = 0;
    let showTextTimer: ReturnType<typeof setTimeout> | null = null;

    const onZoomStart = () => {
      activeZooms += 1;
      if (showTextTimer) {
        clearTimeout(showTextTimer);
        showTextTimer = null;
      }
      try {
        map.setPaintProperty(OBS_CLUSTER_COUNT_LAYER_ID, "text-opacity", 0);
      } catch {
        /* ok */
      }
    };

    const onZoomEnd = () => {
      activeZooms = Math.max(0, activeZooms - 1);
      if (activeZooms > 0) return;
      if (showTextTimer) clearTimeout(showTextTimer);
      showTextTimer = setTimeout(() => {
        showTextTimer = null;
        try {
          map.setPaintProperty(OBS_CLUSTER_COUNT_LAYER_ID, "text-opacity", 1);
        } catch {
          /* ok */
        }
      }, 120);
    };

    const onPointClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const features = event.features;
      if (!features || features.length === 0) {
        return;
      }

      const feature = features[0];
      const pointCoords = getWrappedPointCoordinates(feature, event.lngLat.lng);
      if (!pointCoords) {
        return;
      }

      // Si hay varias observaciones en el mismo punto, mostramos la lista sin acercar de inmediato.
      if (features.length === 1) {
        const targetZoom = Math.max(map.getZoom(), MAX_POINT_FOCUS_ZOOM);
        map.easeTo({
          center: pointCoords,
          zoom: targetZoom,
          duration: getPointFocusDuration(map.getZoom(), targetZoom),
          easing: PREMIUM_EASING,
          essential: true,
        });
      } else {
        const viewportCenter = map.project(map.getCenter());
        const selectedPoint = map.project(pointCoords);
        const pointDistance = Math.hypot(
          selectedPoint.x - viewportCenter.x,
          selectedPoint.y - viewportCenter.y,
        );

        // Si el punto está lejos del centro, recentramos sin cambiar zoom para una sensación más cuidada.
        if (pointDistance > POINT_RECENTER_PIXEL_THRESHOLD) {
          map.easeTo({
            center: pointCoords,
            duration: POINT_RECENTER_DURATION_MS,
            easing: SOFT_PREMIUM_EASING,
            essential: true,
          });
        }
      }

      // Establecer selección. El useEffect se encargará de crear/mostrar el popup
      setSelection({
        features: features as mapboxgl.MapboxGeoJSONFeature[],
        coords: pointCoords,
      });
    };

    const onClusterClick = (event: mapboxgl.MapLayerMouseEvent) => {
      setSelection(null);
      // Buscar el feature de cluster en la capa de círculo (puede venir del click en el texto)
      const features = map.queryRenderedFeatures(event.point, {
        layers: [OBS_CLUSTER_LAYER_ID],
      });

      const feature = features[0];
      const clusterId = feature?.properties?.cluster_id;
      if (typeof clusterId !== "number") {
        return;
      }

      const source = map.getSource(OBS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      source?.getClusterExpansionZoom(clusterId, (error, nextZoom) => {
        if (error || typeof nextZoom !== "number") {
          return;
        }

        const clusterCoords = getWrappedPointCoordinates(feature, event.lngLat.lng);
        if (!clusterCoords) {
          return;
        }

        // Añadir +0.5 para asegurar que el zoom supera el umbral de ruptura del cluster.
        // Sin Math.max forzado: respetamos el zoom natural de expansión para que
        // los sub-clusters intermedios sean visibles antes de llegar a los pins.
        const targetZoom = nextZoom + 0.5;
        map.easeTo({
          center: clusterCoords,
          zoom: targetZoom,
          duration: getClusterFocusDuration(map.getZoom(), targetZoom),
          easing: SOFT_PREMIUM_EASING,
          essential: true,
        });
      });
    };

    const setPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const clearPointer = () => {
      map.getCanvas().style.cursor = "";
    };

    const scheduleViewportRefresh = () => {
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }

      // 200ms de debounce. Si el mapa aún se mueve al dispararse el timer
      // reintentamos una vez más tras 300ms.
      fetchTimerRef.current = setTimeout(() => {
        if (map.isMoving()) {
          fetchTimerRef.current = setTimeout(() => {
            void requestViewportPoints(map);
          }, 300);
          return;
        }
        void requestViewportPoints(map);
      }, 200);
    };

    const setupMapDataLayer = async () => {
      await ensurePointIcons(map);
      if (disposed) {
        return;
      }

      removeObservationLayers(map);
      // Al cambiar de estilo, Mapbox elimina source/layers custom.
      // Forzamos re-aplicación de data aunque el viewport key sea el mismo.
      appliedCacheKeyRef.current = null;

      // Usar setTimeout 0 para mover la carga de datos fuera del hilo principal de renderizado de Mapbox
      setTimeout(() => {
        if (disposed || !map.getStyle()) return;

        map.addSource(OBS_SOURCE_ID, {
          type: "geojson",
          data: EMPTY_COLLECTION,
          cluster: true,
          // clusterMaxZoom 12: Mapbox agrupa puntos hasta zoom 12.
          // En zoom 13+ los puntos se muestran individualmente como pins.
          // Esto garantiza que en zoom 8-12 siempre haya clusters visibles.
          clusterMaxZoom: 12,
          // Radio 50: agrupa puntos dentro de 50px → más clusters intermedios
          // al expandir progresivamente en vez de saltar directo a pins.
          clusterRadius: 50,
          // tolerance solo afecta geometrías de línea/polígono, no puntos.
          // Para un source de puntos puros no tiene efecto → lo omitimos.
          generateId: true,
        });

        map.addSource(OBS_ACCURACY_SOURCE_ID, {
          type: "geojson",
          data: EMPTY_ACCURACY_COLLECTION as GeoJSON.FeatureCollection,
        });

        map.addLayer({
          id: OBS_ACCURACY_FILL_LAYER_ID,
          type: "fill",
          source: OBS_ACCURACY_SOURCE_ID,
          paint: {
            "fill-color": "#22d3ee",
            "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.09, 10, 0.12, 16, 0.16],
          },
        });

        map.addLayer({
          id: OBS_ACCURACY_STROKE_LAYER_ID,
          type: "line",
          source: OBS_ACCURACY_SOURCE_ID,
          paint: {
            "line-color": "#0891b2",
            "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1, 10, 1.4, 16, 2],
            "line-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.42, 10, 0.56, 16, 0.7],
          },
        });

        // ── Anillo exterior del cluster (aura premium) ────────────────────────
        // minzoom 6: solo aparece cuando el marcador de entrada ya está oculto.
        map.addLayer({
          id: OBS_CLUSTER_HALO_LAYER_ID,
          type: "circle",
          source: OBS_SOURCE_ID,
          minzoom: 6,
          filter: ["has", "point_count"],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              28,
              10,
              34,
              50,
              40,
              200,
              46,
              500,
              52,
            ],
            "circle-color": "#3b82f6",
            "circle-opacity": 0.12,
            "circle-blur": 0.5,
          },
        });

        // ── Círculo principal del cluster ─────────────────────────────────────
        // minzoom 6: no compite visualmente con el marcador de entrada.
        map.addLayer({
          id: OBS_CLUSTER_LAYER_ID,
          type: "circle",
          source: OBS_SOURCE_ID,
          minzoom: 6,
          filter: ["has", "point_count"],
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              18,
              10,
              22,
              50,
              26,
              200,
              30,
              500,
              34,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              "#60a5fa",
              20,
              "#3b82f6",
              100,
              "#2563eb",
              500,
              "#1d4ed8",
            ],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
            "circle-stroke-opacity": 1,
          },
        });

        // ── Número del conteo encima del círculo ──────────────────────────────
        map.addLayer({
          id: OBS_CLUSTER_COUNT_LAYER_ID,
          type: "symbol",
          source: OBS_SOURCE_ID,
          minzoom: 6,
          filter: ["has", "point_count"],
          layout: {
            "text-field": [
              "case",
              [">=", ["get", "point_count"], 1000],
              ["concat", ["to-string", ["round", ["/", ["get", "point_count"], 1000]]], "k"],
              ["to-string", ["get", "point_count"]],
            ],
            "text-font": ["Arial Unicode MS Bold", "Open Sans Bold"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["get", "point_count"],
              2,
              11,
              50,
              12,
              200,
              13,
              500,
              14,
            ],
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            // Desactiva el fade interno de Mapbox para símbolos → elimina el número fantasma
            "symbol-avoid-edges": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "rgba(0,0,0,0.18)",
            "text-halo-width": 0.6,
            "text-opacity": 1,
          },
        });

        // ── Pins individuales (Drive = azul, iNaturalist = verde) ─────────────
        // Pins individuales — minzoom 6 para no aparecer en zoom bajo.
        map.addLayer({
          id: OBS_POINT_LAYER_ID,
          type: "symbol",
          source: OBS_SOURCE_ID,
          minzoom: 6,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": [
              "match",
              ["get", "source"],
              "inaturalist",
              OBS_ICON_INAT_ID,
              OBS_ICON_DRIVE_ID,
            ],
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              ["match", ["get", "source"], "inaturalist", 0.7, 0.66],
              9,
              ["match", ["get", "source"], "inaturalist", 0.88, 0.84],
              12,
              ["match", ["get", "source"], "inaturalist", 1.04, 1.0],
              16,
              ["match", ["get", "source"], "inaturalist", 1.14, 1.1],
            ],
            // "bottom" → el pico del pin toca exactamente la coordenada geográfica
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-padding": 0,
            // "viewport" → el pin siempre apunta hacia arriba, no se inclina con el mapa
            "icon-pitch-alignment": "viewport",
            "icon-rotation-alignment": "viewport",
          },
          paint: {
            "icon-opacity": 1,
          },
        });

        map.on("click", OBS_POINT_LAYER_ID, onPointClick);
        map.on("click", OBS_CLUSTER_LAYER_ID, onClusterClick);
        map.on("click", OBS_CLUSTER_COUNT_LAYER_ID, onClusterClick);
        map.on("click", OBS_CLUSTER_HALO_LAYER_ID, onClusterClick);
        map.on("mouseenter", OBS_POINT_LAYER_ID, setPointer);
        map.on("mouseleave", OBS_POINT_LAYER_ID, clearPointer);
        map.on("mouseenter", OBS_CLUSTER_LAYER_ID, setPointer);
        map.on("mouseleave", OBS_CLUSTER_LAYER_ID, clearPointer);
        map.on("mouseenter", OBS_CLUSTER_COUNT_LAYER_ID, setPointer);
        map.on("mouseleave", OBS_CLUSTER_COUNT_LAYER_ID, clearPointer);
        map.on("mouseenter", OBS_CLUSTER_HALO_LAYER_ID, setPointer);
        map.on("mouseleave", OBS_CLUSTER_HALO_LAYER_ID, clearPointer);
        map.on("moveend", scheduleViewportRefresh);
        map.on("zoomstart", onZoomStart);
        map.on("zoomend", onZoomEnd);

        void requestViewportPoints(map);
      }, 0);
    };

    void setupMapDataLayer();

    return () => {
      disposed = true;
      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }

      activeRequestRef.current?.abort();
      map.off("click", OBS_POINT_LAYER_ID, onPointClick);
      map.off("click", OBS_CLUSTER_LAYER_ID, onClusterClick);
      map.off("click", OBS_CLUSTER_COUNT_LAYER_ID, onClusterClick);
      map.off("click", OBS_CLUSTER_HALO_LAYER_ID, onClusterClick);
      map.off("mouseenter", OBS_POINT_LAYER_ID, setPointer);
      map.off("mouseleave", OBS_POINT_LAYER_ID, clearPointer);
      map.off("mouseenter", OBS_CLUSTER_LAYER_ID, setPointer);
      map.off("mouseleave", OBS_CLUSTER_LAYER_ID, clearPointer);
      map.off("mouseenter", OBS_CLUSTER_COUNT_LAYER_ID, setPointer);
      map.off("mouseleave", OBS_CLUSTER_COUNT_LAYER_ID, clearPointer);
      map.off("mouseenter", OBS_CLUSTER_HALO_LAYER_ID, setPointer);
      map.off("mouseleave", OBS_CLUSTER_HALO_LAYER_ID, clearPointer);
      map.off("moveend", scheduleViewportRefresh);
      map.off("zoomstart", onZoomStart);
      map.off("zoomend", onZoomEnd);
      if (showTextTimer) clearTimeout(showTextTimer);
      removeObservationLayers(map);
    };
  }, [map, ready, requestViewportPoints]);

  // ── Marcador de entrada ────────────────────────────────────────────────────
  // Visible en zoom bajo (vista de continentes). Al hacer click navega a la
  // zona de datos. Durante el flyTo el pin se desvanece suavemente.
  // Se oculta automáticamente cuando el zoom supera DATA_MARKER_HIDE_ZOOM.
  // Si el usuario hace zoom out de vuelta, el pin reaparece.
  useEffect(() => {
    if (!map || !ready) return;

    const markerEl = createEntryMarkerElement();

    let marker: mapboxgl.Marker | null = null;
    try {
      marker = new mapboxgl.Marker({ element: markerEl, anchor: "center" })
        .setLngLat([DATA_CENTER.lng, DATA_CENTER.lat])
        .addTo(map);
    } catch {
      // El mapa fue destruido antes de que el marcador pudiera montarse
      return;
    }

    entryMarkerRef.current = marker;

    // ── Tooltip: elemento en body para evitar clipping y rebote ──────────────
    const tooltip = document.createElement("div");
    tooltip.className = "obs-tt";
    tooltip.innerHTML = `
      <div class="obs-tt-card">
        <div class="obs-tt-header">
          <div class="obs-tt-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <div class="obs-tt-location obs-entry-tooltip-location-text">Colombia</div>
            <div class="obs-tt-sublabel">Zona de observaciones</div>
          </div>
        </div>
        <div class="obs-tt-body">
          <div>
            <div class="obs-tt-count-label">Total registros</div>
            <div class="obs-tt-count-value obs-entry-tooltip-count-text">—</div>
          </div>
          <div class="obs-tt-badge">
            <span class="obs-tt-badge-dot"></span>
            En vivo
          </div>
        </div>
        <div class="obs-tt-arrow"></div>
      </div>
    `;
    document.body.appendChild(tooltip);

    const locationEl = markerEl.querySelector<HTMLElement>(".obs-entry-tooltip-location-text");
    const countEl = tooltip.querySelector<HTMLElement>(".obs-entry-tooltip-count-text");

    // Posicionar el tooltip encima del pin usando getBoundingClientRect.
    // El tooltip tiene width fijo de 210px (definido en .obs-tt-card).
    // Lo hacemos visible-invisible para medir la altura real la primera vez.
    const TOOLTIP_WIDTH = 210;
    let tooltipHeight = 0;

    const positionTooltip = () => {
      const pinRect = markerEl.getBoundingClientRect();
      // Medir altura real si aún no la tenemos
      if (tooltipHeight === 0) {
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "1";
        tooltipHeight = tooltip.getBoundingClientRect().height;
        tooltip.style.visibility = "";
        tooltip.style.opacity = "";
      }
      const pinCenterX = pinRect.left + pinRect.width / 2;
      // El pin SVG tiene 44px de alto, la punta está en la base del markerEl
      const pinTopY = pinRect.top;
      tooltip.style.left = `${Math.round(pinCenterX - TOOLTIP_WIDTH / 2)}px`;
      tooltip.style.top = `${Math.round(pinTopY - tooltipHeight - 12)}px`;
    };

    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showTooltip = () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      positionTooltip();
      tooltip.classList.add("obs-tt--visible");
    };

    const hideTooltip = () => {
      hideTimer = setTimeout(() => {
        tooltip.classList.remove("obs-tt--visible");
      }, 80);
    };

    markerEl.addEventListener("mouseenter", showTooltip);
    markerEl.addEventListener("mouseleave", hideTooltip);
    tooltip.addEventListener("mouseenter", showTooltip);
    tooltip.addEventListener("mouseleave", hideTooltip);

    // Cargar nombre del lugar via Mapbox Geocoding (con caché interno)
    getPlaceLabel(DATA_CENTER.lng, DATA_CENTER.lat)
      .then((label) => {
        if (locationEl && label) locationEl.textContent = label;
      })
      .catch(() => {
        // Si falla el geocoding, dejamos "Colombia" como fallback
      });

    // Actualizar conteo: inmediatamente si ya hay datos, o en cuanto lleguen
    const updateCount = (total: number) => {
      if (!countEl) return;
      countEl.textContent = total.toLocaleString("es-CO");
    };

    // Si ya hay datos cargados, mostrar de inmediato
    if (totalObservationsRef.current !== null) {
      updateCount(totalObservationsRef.current);
    }
    // Registrar callback para cuando lleguen datos nuevos
    onTotalUpdateRef.current = updateCount;

    // Flag temporal: true durante el flyTo para evitar que syncMarkerVisibility
    // restaure el pin mientras el vuelo está en progreso.
    let flyInProgress = false;

    const innerWrap = markerEl.querySelector<HTMLElement>(".obs-pin-wrap");

    const FLY_DURATION_MS = 2200;
    const FADE_DURATION_MS = Math.round(FLY_DURATION_MS * 0.5);

    const onMarkerClick = () => {
      if (flyInProgress) return;
      flyInProgress = true;

      markerEl.style.pointerEvents = "none";

      if (innerWrap) {
        innerWrap.style.transition = `opacity ${FADE_DURATION_MS}ms cubic-bezier(0.4,0,1,1), transform ${FADE_DURATION_MS}ms cubic-bezier(0.4,0,1,1)`;
        innerWrap.style.opacity = "0";
        innerWrap.style.transform = "scale(0.7) translateY(-8px)";
      }

      map.flyTo({
        center: [DATA_CENTER.lng, DATA_CENTER.lat],
        zoom: DATA_ENTRY_ZOOM,
        duration: FLY_DURATION_MS,
        easing: SOFT_PREMIUM_EASING,
        essential: true,
      });

      // Resetear el flag al terminar el vuelo para permitir que el pin reaparezca
      // si el usuario hace zoom out de vuelta.
      setTimeout(() => {
        flyInProgress = false;
      }, FLY_DURATION_MS + 100);
    };

    markerEl.addEventListener("click", onMarkerClick);

    // Sincroniza visibilidad con el zoom.
    // Si el flyTo está en progreso, no restaurar el pin (evita reaparición durante el vuelo).
    const syncMarkerVisibility = () => {
      const shouldHide = map.getZoom() >= DATA_MARKER_HIDE_ZOOM;

      // Durante el flyTo, no restaurar el pin aunque el zoom baje momentáneamente
      if (flyInProgress && !shouldHide) return;

      // Ocultar el elemento raíz completamente para que no reciba eventos de mouse
      markerEl.style.pointerEvents = shouldHide ? "none" : "auto";
      markerEl.style.visibility = shouldHide ? "hidden" : "visible";

      if (shouldHide) {
        // Ocultar tooltip inmediatamente cuando el marcador desaparece
        if (hideTimer) clearTimeout(hideTimer);
        tooltip.classList.remove("obs-tt--visible");
      }
      if (innerWrap) {
        innerWrap.style.transition = "opacity 350ms ease, transform 350ms ease";
        innerWrap.style.opacity = shouldHide ? "0" : "1";
        innerWrap.style.transform = shouldHide ? "scale(0.88)" : "";
      }
    };

    syncMarkerVisibility();
    map.on("zoom", syncMarkerVisibility);

    return () => {
      markerEl.removeEventListener("mouseenter", showTooltip);
      markerEl.removeEventListener("mouseleave", hideTooltip);
      tooltip.removeEventListener("mouseenter", showTooltip);
      tooltip.removeEventListener("mouseleave", hideTooltip);
      if (hideTimer) clearTimeout(hideTimer);
      tooltip.remove();
      markerEl.removeEventListener("click", onMarkerClick);
      onTotalUpdateRef.current = null;
      map.off("zoom", syncMarkerVisibility);
      marker?.remove();
      entryMarkerRef.current = null;
    };
  }, [map, ready]);

  // Guardar estilo en localStorage deshabilitado — el mapa siempre arranca
  // desde la vista y capa inicial al recargar la página.

  // Guarda posición y zoom en sessionStorage para restaurarlos al refrescar el tab.
  // No guarda el estilo — siempre arranca en "terrain".
  useEffect(() => {
    if (!map || !ready) return;

    const savePosition = () => {
      try {
        sessionStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            center: map.getCenter(),
            zoom: map.getZoom(),
          }),
        );
      } catch {}
    };

    const scheduleSave = () => {
      if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
      saveStateTimerRef.current = setTimeout(savePosition, SAVE_STATE_DEBOUNCE_MS);
    };

    map.on("moveend", scheduleSave);
    return () => {
      map.off("moveend", scheduleSave);
      if (saveStateTimerRef.current) clearTimeout(saveStateTimerRef.current);
    };
  }, [map, ready]);

  useEffect(() => {
    if (!ready) {
      loadingStartedAtRef.current = Date.now();
      return;
    }

    const elapsed = Date.now() - loadingStartedAtRef.current;
    const minVisibleMs = 620;
    const fadeOutMs = 280;
    const waitMs = Math.max(minVisibleMs - elapsed, 0) + fadeOutMs;

    if (loadingOverlayTimerRef.current) {
      clearTimeout(loadingOverlayTimerRef.current);
    }

    loadingOverlayTimerRef.current = setTimeout(() => {
      setShowLoadingOverlay(false);
    }, waitMs);

    return () => {
      if (loadingOverlayTimerRef.current) {
        clearTimeout(loadingOverlayTimerRef.current);
      }
    };
  }, [ready]);

  // Efecto principal: gestiona el CICLO DE VIDA del popup.
  // Solo se re-ejecuta si cambia la referencia de `features` (nuevo punto en el mapa).
  // Los cambios de sub-navegación interna (selectedFeatureIndex) no destruyen el popup,
  // eliminando el flash visual en la transición lista → detalle.
  useEffect(() => {
    if (!map || !ready || !selection) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    const { features, coords } = selection;

    // Contenido inicial (vista de lista o detalle único)
    const initialContent = popupContentFromFeatures(features);

    const popup = new mapboxgl.Popup({
      closeButton: true,
      maxWidth: "320px",
      className: "custom-mapbox-popup",
      offset: [0, -10],
    })
      .setLngLat(coords)
      .setHTML(initialContent)
      .addTo(map);

    popupRef.current = popup;
    let isDisposingPopup = false;

    popup.on("close", () => {
      if (isDisposingPopup) return;
      setSelection(null);
    });

    const popupElement = popup.getElement();

    const handlePopupClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;

      const item = target.closest(".observation-item");
      if (item) {
        const index = parseInt(item.getAttribute("data-index") || "0", 10);
        const selectedFeature = features[index];
        const selectedCoords = selectedFeature
          ? getWrappedPointCoordinates(selectedFeature, map.getCenter().lng)
          : null;

        if (selectedCoords) {
          const targetZoom = Math.max(map.getZoom(), MAX_POINT_FOCUS_ZOOM);
          map.easeTo({
            center: selectedCoords,
            zoom: targetZoom,
            duration: getPointFocusDuration(map.getZoom(), targetZoom),
            easing: PREMIUM_EASING,
            essential: true,
          });
        }

        setSelection({
          features,
          coords: selectedCoords ?? coords,
          selectedFeatureIndex: index,
        });
        return;
      }

      const closeBtn = target.closest(".close-list-btn");
      if (closeBtn) {
        const currentSel = selection;
        if (typeof currentSel?.selectedFeatureIndex === "number") {
          setSelection({ features, coords, selectedFeatureIndex: undefined });
        } else {
          popup.remove();
        }
      }
    };

    popupElement?.addEventListener("click", handlePopupClick, true);

    return () => {
      isDisposingPopup = true;
      popupElement?.removeEventListener("click", handlePopupClick, true);
      popup.remove();
      popupRef.current = null;
    };
    // NOTA: Solo `features` como identidad de selección.
    // Un cambio de `selectedFeatureIndex` no destruye/crea el popup (evita flash).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, ready, selection?.features]);

  // Efecto secundario: actualiza contenido y posición del popup sin recrearlo.
  // Se ejecuta para TODOS los cambios de `selection`, incluyendo selectedFeatureIndex.
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup || !selection) return;

    const { features, coords, selectedFeatureIndex } = selection;
    let content = "";
    if (typeof selectedFeatureIndex === "number" && features[selectedFeatureIndex]) {
      content = popupContentFromProperties(
        features[selectedFeatureIndex].properties as Record<string, unknown>,
      );
    } else {
      content = popupContentFromFeatures(features);
    }
    // setLngLat + setHTML son operaciones DOM baratas, sin flash.
    popup.setLngLat(coords).setHTML(content);
  }, [selection]);

  useEffect(() => {
    if (!map || !ready || !isMapStyleReady(map)) {
      return;
    }

    let source: mapboxgl.GeoJSONSource | undefined;
    try {
      source = map.getSource(OBS_ACCURACY_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    } catch {
      return;
    }
    if (!source) {
      return;
    }

    if (!selection) {
      source.setData(EMPTY_ACCURACY_COLLECTION as GeoJSON.FeatureCollection);
      return;
    }

    const { features, selectedFeatureIndex, coords } = selection;
    const selectedFeature =
      typeof selectedFeatureIndex === "number"
        ? (features[selectedFeatureIndex] ?? null)
        : features.length === 1
          ? features[0]
          : null;

    const accuracyValue = selectedFeature?.properties?.accuracy;
    if (
      typeof accuracyValue !== "number" ||
      !Number.isFinite(accuracyValue) ||
      accuracyValue <= 0
    ) {
      source.setData(EMPTY_ACCURACY_COLLECTION as GeoJSON.FeatureCollection);
      return;
    }

    // Limitar radios anómalos para mantener una visualización útil.
    const accuracyMeters = Math.min(accuracyValue, 3000);
    source.setData(buildAccuracyCollection(coords, accuracyMeters) as GeoJSON.FeatureCollection);
  }, [map, ready, selection]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }

      if (fetchTimerRef.current) {
        clearTimeout(fetchTimerRef.current);
      }

      if (loadingOverlayTimerRef.current) {
        clearTimeout(loadingOverlayTimerRef.current);
      }
      if (dataLoadNoticeTimerRef.current) {
        clearTimeout(dataLoadNoticeTimerRef.current);
      }
      if (saveStateTimerRef.current) {
        clearTimeout(saveStateTimerRef.current);
      }

      activeRequestRef.current?.abort();
    };
  }, []);

  const zoomIn = useCallback(() => {
    if (!map) return;
    const nextZoom = Math.min(MAX_ZOOM, map.getZoom() + BUTTON_ZOOM_STEP);
    if (map.isMoving() || map.isZooming()) {
      queuedZoomRef.current = nextZoom;
      return;
    }
    map.easeTo({
      zoom: nextZoom,
      duration: BUTTON_ZOOM_DURATION_MS,
      easing: PREMIUM_EASING,
      essential: true,
    });
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;

    const nextZoom = map.getZoom() - BUTTON_ZOOM_STEP;
    if ((map.isMoving() || map.isZooming()) && nextZoom >= MIN_ZOOM + 0.01) {
      queuedZoomRef.current = nextZoom;
      return;
    }

    if (nextZoom < MIN_ZOOM + 0.01) {
      setZoomLimitNotice(true);

      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }

      noticeTimerRef.current = setTimeout(() => {
        setZoomLimitNotice(false);
      }, 2000);

      map.easeTo({
        zoom: MIN_ZOOM,
        duration: 620,
        easing: PREMIUM_EASING,
        essential: true,
      });
      return;
    }

    map.easeTo({
      zoom: nextZoom,
      duration: BUTTON_ZOOM_DURATION_MS,
      easing: PREMIUM_EASING,
      essential: true,
    });
  }, [map]);

  useEffect(() => {
    if (!map || !ready) {
      return;
    }

    const runQueuedZoom = () => {
      if (runningQueuedZoomRef.current) {
        return;
      }
      const queuedZoom = queuedZoomRef.current;
      if (queuedZoom === null) {
        return;
      }
      if (map.isMoving() || map.isZooming()) {
        return;
      }

      queuedZoomRef.current = null;
      runningQueuedZoomRef.current = true;
      map.easeTo({
        zoom: queuedZoom,
        duration: BUTTON_ZOOM_DURATION_MS,
        easing: PREMIUM_EASING,
        essential: true,
      });
      window.setTimeout(() => {
        runningQueuedZoomRef.current = false;
      }, BUTTON_ZOOM_DURATION_MS + 40);
    };

    map.on("moveend", runQueuedZoom);
    return () => {
      map.off("moveend", runQueuedZoom);
    };
  }, [map, ready]);

  return (
    <div
      className={`fixed inset-0 ${className ?? ""}`}
      style={{
        background: "linear-gradient(145deg, #e8f4f0 0%, #e6f0f8 40%, #edf4f0 70%, #e9f2f7 100%)",
      }}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_92%,rgba(16,185,129,0.08),transparent_35%),radial-gradient(circle_at_95%_8%,rgba(14,165,233,0.08),transparent_35%)]" />

      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        currentStyle={currentStyle}
        onStyleChange={setCurrentStyle}
        isUIHidden={isUIHidden}
      />

      <MapLoadingOverlay
        ready={ready}
        visible={!ready || showLoadingOverlay}
        progress={loadProgress}
      />

      {zoomLimitNotice && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500 cubic-bezier(0.4,0,0.2,1)">
          <div className="flex items-center gap-3 rounded-[18px] border border-blue-500/50 bg-white/95 px-[18px] py-[10px] shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl ring-1 ring-blue-500/15">
            <span className="text-[14px] font-semibold text-zinc-800 tracking-tight">
              Has alcanzado el límite máximo de alejamiento
            </span>
          </div>
        </div>
      )}

      {dataLoadNotice && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-sky-200/70 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 shadow-[0_6px_16px_rgba(15,23,42,0.1)]">
            {dataLoadNotice}
          </div>
        </div>
      )}
    </div>
  );
}

// format-sync
