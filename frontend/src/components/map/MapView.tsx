"use client";

import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMapbox } from "../../hooks/useMapbox";
import {
  DATA_CENTER,
  DATA_ENTRY_ZOOM,
  DATA_MARKER_HIDE_ZOOM,
  LATAM_BOUNDS_ARRAY,
  MAX_ZOOM,
  type MapStyle,
  MIN_ZOOM,
} from "../../lib/mapbox-config";
import { getPlaceLabel } from "../../lib/mapbox-place";
import { fetchObservationGeoJson } from "../../lib/observations-api";
import { getObservationYear, getYearPalette } from "../../lib/year-visualization";
import type {
  Bbox,
  LngLat,
  MapViewProps,
  ObservationFeatureCollection,
  ObservationGeoJsonResponse,
} from "../../types/map.types";
import { buildAccuracyCollection } from "./accuracy-geometry";
import { CooperativeGestureHint } from "./CooperativeGestureHint";
import { MapControls } from "./MapControls";
import { MapLoadingOverlay } from "./MapLoadingOverlay";
import { buildPopupFromSelection, type PopupSelection } from "./popup-builders";

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
const YEAR_ICON_PREFIX = "observations-year-pin";

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

// PopupSelection se importa desde ./popup-builders

// Redondeo a 2 decimales (~1.1km en el ecuador) — balance óptimo entre
// aciertos de caché en pan pequeño y fetches frescos en desplazamientos reales.
// 1 decimal (~111km) era demasiado grueso: causaba cache hits falsos en zoom 8-12
// donde un pan de pocos km ya muestra observaciones distintas.
const VIEWPORT_PADDING_DEGREES = 0.25;
const VIEWPORT_KEY_PRECISION = 2;
const VIEWPORT_CACHE_MAX = 35;
const VIEWPORT_CACHE_TTL_MS = 90_000;

// Easing quintic out: arranque rápido, frenado suave → sensación premium
const PREMIUM_EASING = (t: number): number =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) ** 5 / 2;
// Easing cúbico out: más suave para clusters y pan
const SOFT_PREMIUM_EASING = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

const MAX_POINT_FOCUS_ZOOM = 18;
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
  feature: GeoJSON.Feature,
  referenceLng: number,
): [number, number] | null => {
  const geometry = feature.geometry;
  if (!geometry || geometry.type !== "Point") {
    return null;
  }

  const [lng, lat] = (geometry as GeoJSON.Point).coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") {
    return null;
  }
  return [normalizeLngToReference(lng, referenceLng), lat];
};

// ── Modo años: decorar features con el año de observación ────────────────────
const getYearIconId = (year: number): string => `${YEAR_ICON_PREFIX}-${year}`;

const decorateObservationCollectionWithYears = (
  data: ObservationFeatureCollection,
): ObservationFeatureCollection => ({
  ...data,
  features: data.features.map((feature) => {
    const year = getObservationYear(feature.properties.observedAt);
    if (year === null) return feature;
    return { ...feature, properties: { ...feature.properties, year } };
  }),
});

const buildYearPinSvg = (year: number): string => {
  const palette = getYearPalette(year);
  const suffix = year.toString(36);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="64" viewBox="-2 -2 28 30" fill="none">
  <defs>
    <filter id="year-glow-${suffix}" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.4" flood-color="${palette.dark}" flood-opacity="0.46"/>
    </filter>
    <linearGradient id="year-body-${suffix}" x1="8" y1="2" x2="16" y2="24" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${palette.light}"/>
      <stop offset="55%" stop-color="${palette.fill}"/>
      <stop offset="100%" stop-color="${palette.dark}"/>
    </linearGradient>
    <linearGradient id="year-shine-${suffix}" x1="8" y1="2" x2="12" y2="12" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g filter="url(#year-glow-${suffix})">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#year-body-${suffix})" stroke="#ffffff" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="url(#year-shine-${suffix})"/>
    <circle cx="12" cy="10" r="3.3" fill="#ffffff" opacity="0.96"/>
    <circle cx="12" cy="10" r="2.4" fill="${palette.fill}"/>
    <circle cx="11.3" cy="9.3" r="0.55" fill="#ffffff" opacity="0.72"/>
  </g>
</svg>`;
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
const isMapStyleReady = (map: mapboxgl.Map | null) => {
  if (!map) return false;
  try {
    const style = map.getStyle();
    // Requerimos que el estilo esté cargado y que tenga la propiedad 'glyphs'
    // para poder renderizar capas de tipo 'symbol' (textos) sin errores.
    return map.isStyleLoaded() && Boolean(style) && Boolean(style.glyphs);
  } catch {
    return false;
  }
};

const isMapDomReady = (map: mapboxgl.Map | null): map is mapboxgl.Map => {
  if (!map || typeof HTMLElement === "undefined") return false;
  try {
    const maybeRemoved = map as mapboxgl.Map & { _removed?: boolean };
    if (maybeRemoved._removed) return false;

    const container = map.getContainer();
    const canvasContainer = map.getCanvasContainer();
    return (
      container instanceof HTMLElement &&
      canvasContainer instanceof HTMLElement &&
      container.isConnected &&
      canvasContainer.isConnected
    );
  } catch {
    return false;
  }
};

const isPopupDomReady = (
  popup: mapboxgl.Popup | null,
  map: mapboxgl.Map | null,
): popup is mapboxgl.Popup => {
  if (!popup || !isMapDomReady(map) || !popup.isOpen()) return false;
  const element = popup.getElement();
  return element instanceof HTMLElement && element.isConnected;
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
  } catch (_error) {
    // Intentionally ignore errors when removing accuracy source
  }
};

// ── SVG map-pin de Lucide ─────────────────────────────────────────────────────
// Pin Drive: Azul eléctrico vibrante con borde azul profundo (mismo estilo que iNat verde).
const mapPinDriveSvg = (): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="64" viewBox="-2 -2 28 30" fill="none">
  <defs>
    <filter id="mpglow-drive" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#0369a1" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#mpglow-drive)">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="#0ea5e9" stroke="#0369a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
    <circle cx="12" cy="10" r="1.6" fill="#0369a1"/>
  </g>
</svg>
`;

// Pin iNaturalist: Verde esmeralda con borde bosque profundo (Elite Duo-Tone).
const mapPinInatSvg = (): string => `
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="64" viewBox="-2 -2 28 30" fill="none">
  <defs>
    <filter id="mpglow-inat" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#064e3b" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g filter="url(#mpglow-inat)">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
      fill="#10b981" stroke="#064e3b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
    <circle cx="12" cy="10" r="1.6" fill="#064e3b"/>
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
      @keyframes obs-pin-ring {
        0%   { transform:translateX(-50%) scale(1);   opacity:0.45; }
        65%  { transform:translateX(-50%) scale(2.8); opacity:0;    }
        100% { transform:translateX(-50%) scale(2.8); opacity:0;    }
      }
      .obs-pin-dot {
        position:absolute; bottom:0; left:50%;
        transform:translateX(-50%);
        width:5px; height:5px; border-radius:50%;
        background:rgba(16,185,129,0.4);
        animation:obs-pin-ring 3s cubic-bezier(0.4,0,0.6,1) infinite;
      }
      .obs-pin-dot:nth-child(2){ animation-delay:1.5s; }
      .obs-pin-svg {
        position:relative; z-index:1;
        filter:none;
        transition:transform 280ms cubic-bezier(0.22,1,0.36,1), filter 280ms ease;
      }
      .obs-pin-wrap:hover .obs-pin-svg {
        transform:scale(1.07) translateY(-2px);
        filter:none;
      }

      /* ── Tooltip ── */
      .obs-tt {
        position:fixed; z-index:9999; pointer-events:none;
        opacity:0; transform:translateY(10px) scale(0.95);
        transition: opacity 320ms cubic-bezier(0.22,1,0.36,1),
                    transform 320ms cubic-bezier(0.22,1,0.36,1);
        transform-origin:bottom center;
        will-change:transform,opacity;
      }
      .obs-tt.obs-tt--visible { opacity:1; transform:translateY(0) scale(1); }

      /* ── Card — white glassmorphism premium ── */
      .obs-tt-card {
        position:relative; width:300px;
        border-radius:24px; overflow:hidden;
        background:linear-gradient(
          155deg,
          rgba(255,255,255,0.98) 0%,
          rgba(252,253,255,0.96) 50%,
          rgba(248,250,255,0.94) 100%
        );
        border:1px solid rgba(255,255,255,1);
        box-shadow:
          0 0 0 0.5px rgba(99,102,241,0.1),
          0 2px 4px    rgba(15,23,42,0.04),
          0 8px 24px  -4px rgba(15,23,42,0.10),
          0 24px 56px -8px rgba(15,23,42,0.14),
          0 48px 80px -16px rgba(99,102,241,0.12),
          inset 0 1px 0 rgba(255,255,255,1),
          inset 0 -1px 0 rgba(15,23,42,0.02);
        backdrop-filter:blur(24px) saturate(180%) brightness(1.02);
        -webkit-backdrop-filter:blur(24px) saturate(180%) brightness(1.02);
        /* Aislar el stacking context para que las animaciones internas
           no se recalculen durante la transición del tooltip padre */
        isolation:isolate;
      }

      /* ── Header ── */
      .obs-tt-header {
        padding:18px 18px 16px;
        display:flex; align-items:center; gap:14px;
        position:relative; z-index:1;
        border-bottom:1px solid rgba(99,102,241,0.08);
        /* Aislar del transform del tooltip padre para evitar rebote */
        transform:translateZ(0);
        backface-visibility:hidden;
      }

      /* ── Ícono ── */
      .obs-tt-icon {
        width:46px; height:46px; flex-shrink:0;
        border-radius:18px;
        background:linear-gradient(145deg, #818cf8 0%, #4f46e5 100%);
        display:flex; align-items:center; justify-content:center;
        box-shadow:
          0 2px 6px  rgba(99,102,241,0.3),
          0 8px 24px rgba(99,102,241,0.25);
      }

      /* ── Ubicación ── */
      .obs-tt-location {
        font-family:Poppins,system-ui,sans-serif;
        display:flex; flex-direction:column; gap:2px;
        min-width:0; flex:1;
      }
      .obs-tt-location-label {
        font-size:9.5px; font-weight:700;
        letter-spacing:0.18em; text-transform:uppercase;
        background:linear-gradient(
          90deg,
          rgba(15,23,42,0.32) 0%,
          rgba(15,23,42,0.48) 38%,
          rgba(99,102,241,0.72) 50%,
          rgba(15,23,42,0.48) 62%,
          rgba(15,23,42,0.32) 100%
        );
        background-size:200% auto;
        -webkit-background-clip:text; background-clip:text;
        -webkit-text-fill-color:transparent;
        animation:popup-shimmer 8s linear infinite;
      }
      .obs-tt-location-country {
        font-size:17px; font-weight:800;
        color:#0f172a; line-height:1.15; letter-spacing:-0.025em;
      }
      .obs-tt-location-city {
        font-size:12px; font-weight:400;
        color:#94a3b8; line-height:1.3;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }

      /* ── Divisor con gradiente ── */
      .obs-tt-divider {
        height:1px; margin:0;
        background:linear-gradient(90deg,
          transparent 0%,
          rgba(99,102,241,0.15) 30%,
          rgba(99,102,241,0.15) 70%,
          transparent 100%
        );
      }

      /* ── Body ── */
      .obs-tt-body {
        padding:16px 18px 18px;
        display:flex; align-items:flex-end;
        justify-content:space-between; gap:12px;
        position:relative; z-index:1;
      }

      .obs-tt-stat { display:flex; flex-direction:column; gap:5px; }

      .obs-tt-count-label {
        font-family:Poppins,system-ui,sans-serif;
        font-size:11px; font-weight:700;
        letter-spacing:0.14em; text-transform:uppercase;
        background:linear-gradient(
          90deg,
          rgba(15,23,42,0.32) 0%,
          rgba(15,23,42,0.48) 38%,
          rgba(99,102,241,0.72) 50%,
          rgba(15,23,42,0.48) 62%,
          rgba(15,23,42,0.32) 100%
        );
        background-size:200% auto;
        -webkit-background-clip:text; background-clip:text;
        -webkit-text-fill-color:transparent;
        animation:popup-shimmer 8s linear infinite;
        animation-delay:-1s;
      }
      .obs-tt-count-value {
        font-family:Poppins,system-ui,sans-serif;
        font-size:42px; font-weight:900;
        letter-spacing:-0.04em; line-height:1;
        background:linear-gradient(
          90deg,
          #1e293b 0%,
          #334155 25%,
          #6366f1 50%,
          #334155 75%,
          #1e293b 100%
        );
        background-size:200% auto;
        -webkit-background-clip:text; background-clip:text;
        -webkit-text-fill-color:transparent;
        animation:
          obs-number-in 400ms ease both,
          popup-num-shimmer 8s linear infinite;
        animation-delay:0s, -4s;
      }

      /* ── Badge EN VIVO — glassmorphism con punto pulsante ── */
      .obs-tt-badge {
        display:inline-flex; align-items:center; gap:8px;
        padding:8px 14px; border-radius:99px;
        /* Glassmorphism sutil */
        background:rgba(255,255,255,0.6);
        border:1px solid rgba(255,255,255,0.9);
        box-shadow:
          0 1px 3px rgba(15,23,42,0.08),
          0 4px 12px rgba(15,23,42,0.06),
          inset 0 1px 0 rgba(255,255,255,1);
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
        font-family:Poppins,system-ui,sans-serif;
        font-size:10px; font-weight:800;
        letter-spacing:0.12em; text-transform:uppercase;
        color:#1e293b; white-space:nowrap; flex-shrink:0;
        margin-bottom:4px;
      }
      .obs-tt-badge-dot {
        width:7px; height:7px; border-radius:50%;
        background:#10b981;
        flex-shrink:0;
        box-shadow:
          0 0 0 2px rgba(16,185,129,0.25),
          0 0 8px rgba(16,185,129,0.5);
        animation:obs-live-ring 2.2s ease-out infinite;
      }
      @keyframes obs-live-ring {
        0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.6), 0 0 8px rgba(16,185,129,0.5); }
        70%  { box-shadow: 0 0 0 5px rgba(16,185,129,0),   0 0 8px rgba(16,185,129,0.3); }
        100% { box-shadow: 0 0 0 0   rgba(16,185,129,0),   0 0 8px rgba(16,185,129,0.5); }
      }

      /* ── Flecha ── */
      .obs-tt-arrow {
        position:absolute; bottom:-9px; left:50%;
        transform:translateX(-50%) rotate(45deg);
        width:16px; height:16px;
        background:rgba(248,250,255,0.94);
        border-right:1px solid rgba(255,255,255,0.85);
        border-bottom:1px solid rgba(255,255,255,0.85);
        box-shadow:3px 3px 8px rgba(15,23,42,0.07);
        border-radius:0 0 4px 0; z-index:-1;
      }
    </style>

    <div class="obs-pin-wrap" style="width:44px;height:52px;position:relative;display:flex;align-items:flex-end;justify-content:center;will-change:transform;transform-origin:center bottom;">
      <div class="obs-pin-dot"></div>
      <div class="obs-pin-dot"></div>
      <svg class="obs-pin-svg" width="36" height="44" viewBox="0 0 24 24" fill="none">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
              fill="#1d4ed8" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="10" r="3.2" fill="#ffffff"/>
        <circle cx="12" cy="10" r="1.6" fill="#1d4ed8"/>
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

const ensurePointIcons = async (
  map: mapboxgl.Map,
  data: ObservationFeatureCollection,
  isYearMode: boolean,
): Promise<void> => {
  const pending: Promise<void>[] = [];

  if (isYearMode) {
    // Cargar un ícono de color único por cada año presente en los datos
    const yearSet = new Set<number>();
    for (const feature of data.features) {
      const year =
        (feature.properties.year as number | undefined) ??
        getObservationYear(feature.properties.observedAt);
      if (year !== null) yearSet.add(year);
    }
    for (const year of yearSet) {
      const iconId = getYearIconId(year);
      if (!map.hasImage(iconId)) {
        pending.push(
          loadIconFromUrl(
            `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildYearPinSvg(year))}`,
          ).then((img) => map.addImage(iconId, img, { pixelRatio: 2 })),
        );
      }
    }
  } else {
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
  }

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

const buildViewportKey = (
  bbox: Bbox,
  limit: number,
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
  source: string | undefined,
  selectedGroup: string | null | undefined,
): string => {
  const rounded = bbox.map((value) => value.toFixed(VIEWPORT_KEY_PRECISION));
  return `${rounded.join(",")}|${limit}|${dateFrom ?? "none"}|${dateTo ?? "none"}|${source ?? "all"}|${selectedGroup ?? "none"}`;
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

// Helpers de formato y builders de popup → ver ./popup-builders.ts
// Geometría de precisión GPS → ver ./accuracy-geometry.ts

const LOCAL_STORAGE_KEY = "soy_conservacion_map_state";

export function MapView({
  className,
  center: initialCenterProp,
  zoom: initialZoomProp,
  isUIHidden = false,
  isFilterOpen = false,
  selectedGroup,
  source = "all",
  dateFrom = null,
  dateTo = null,
  isYearMode = false,
  onStyleChange,
}: MapViewProps) {
  // Capa: siempre arranca en "terrain" al entrar por primera vez o abrir tab nuevo.
  // El usuario puede cambiarla durante la sesión pero no se persiste entre tabs.
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("terrain");

  const handleStyleChange = useCallback(
    (style: MapStyle) => {
      setCurrentStyle(style);
      onStyleChange?.(style);
    },
    [onStyleChange],
  );

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
    } catch {
      // Intentionally ignore localStorage errors
    }
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
    } catch {
      // Intentionally ignore localStorage errors
    }
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
  const [selection, setSelection] = useState<PopupSelection | null>(null);
  const latestSelectionRef = useRef<PopupSelection | null>(null);
  const renderedPopupSelectionRef = useRef<PopupSelection | null>(null);
  const popupLocationRequestRef = useRef(0);

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
      const cacheKey = buildViewportKey(bbox, limit, dateFrom, dateTo, source, selectedGroup);
      const now = Date.now();
      pruneViewportCache(viewportCacheRef.current, now);
      const cached = viewportCacheRef.current.get(cacheKey);

      if (cached) {
        // Decorar con años y cargar íconos si es modo years
        const preparedData = isYearMode
          ? decorateObservationCollectionWithYears(cached.data)
          : cached.data;
        await ensurePointIcons(mapInstance, preparedData, isYearMode);
        // Evitar trabajo redundante si ya estamos mostrando exactamente este viewport
        if (appliedCacheKeyRef.current !== cacheKey) {
          applyDataToSource(mapInstance, preparedData, cacheKey);
        }
        // Actualizar el total incluso si viene de caché para mantener sincronía en la UI
        totalObservationsRef.current = cached.meta.total;
        onTotalUpdateRef.current?.(cached.meta.total);
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
              source,
              dateFrom,
              dateTo,
              ...(selectedGroup ? { group: selectedGroup } : {}),
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
          return;
        }

        const preparedData = isYearMode
          ? decorateObservationCollectionWithYears(payload.data)
          : payload.data;

        await ensurePointIcons(mapInstance, preparedData, isYearMode);
        applyDataToSource(mapInstance, preparedData, cacheKey);
        setDataLoadNotice(null);

        viewportCacheRef.current.set(cacheKey, {
          data: preparedData,
          meta: payload.meta,
          cachedAt: now,
        });
        hasLoadedOnceRef.current = true;
        totalObservationsRef.current = payload.meta.total;
        onTotalUpdateRef.current?.(payload.meta.total);
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
    [applyDataToSource, isYearMode, dateFrom, dateTo, showDataLoadNotice, selectedGroup, source],
  );

  const runQueuedZoom = useCallback(() => {
    if (!map || runningQueuedZoomRef.current) {
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
  }, [map]);

  const scheduleSavePosition = useCallback(() => {
    if (!map || !ready) {
      return;
    }
    if (saveStateTimerRef.current) {
      clearTimeout(saveStateTimerRef.current);
    }
    saveStateTimerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            center: map.getCenter(),
            zoom: map.getZoom(),
          }),
        );
      } catch {
        // Intentionally ignore state persistence errors
      }
    }, SAVE_STATE_DEBOUNCE_MS);
  }, [map, ready]);

  useEffect(() => {
    if (!map || !ready) {
      return;
    }

    let disposed = false;

    // ── Suprimir número fantasma durante zoom ─────────────────────────────────
    // Usamos un flag + RAF en lugar de setPaintProperty en cada zoomstart/zoomend.
    // setPaintProperty es síncrono y costoso — llamarlo en cada tick de scroll
    // (que puede ser 10-20 veces/segundo) causa jank visible.
    // Con el flag, la llamada GL ocurre como máximo una vez por frame de animación.
    let isZooming = false;
    let textHidden = false;
    let showTextTimer: ReturnType<typeof setTimeout> | null = null;
    let hideRafId: number | null = null;

    const applyTextOpacity = (opacity: number) => {
      try {
        map.setPaintProperty(OBS_CLUSTER_COUNT_LAYER_ID, "text-opacity", opacity);
      } catch {
        /* ok — el layer puede no existir aún */
      }
    };

    const onZoomStart = () => {
      isZooming = true;
      if (showTextTimer) {
        clearTimeout(showTextTimer);
        showTextTimer = null;
      }
      // Ocultar el texto solo una vez por secuencia de zoom, no en cada tick
      if (!textHidden) {
        if (hideRafId !== null) cancelAnimationFrame(hideRafId);
        hideRafId = requestAnimationFrame(() => {
          hideRafId = null;
          if (isZooming) {
            textHidden = true;
            applyTextOpacity(0);
          }
        });
      }
    };

    const onZoomEnd = () => {
      isZooming = false;
      if (showTextTimer) clearTimeout(showTextTimer);
      // Restaurar el texto con un pequeño delay para que el cluster
      // termine de re-renderizarse antes de mostrar el número
      showTextTimer = setTimeout(() => {
        showTextTimer = null;
        if (!isZooming) {
          textHidden = false;
          applyTextOpacity(1);
        }
      }, 150);
    };

    const onPointClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const features = event.features;
      if (!features || features.length === 0) {
        return;
      }

      const feature = features[0];
      if (!feature) return;
      const pointCoords = getWrappedPointCoordinates(feature, event.lngLat.lng);
      if (!pointCoords) {
        return;
      }

      // Si hay varias observaciones en el mismo punto, mostramos la lista
      // sin mover el mapa — el auto-pan del popup se encarga de ajustar si
      // el contenedor se sale de los bordes.
      if (features.length === 1) {
        const targetZoom = Math.max(map.getZoom(), MAX_POINT_FOCUS_ZOOM);
        map.easeTo({
          center: pointCoords,
          zoom: targetZoom,
          duration: getPointFocusDuration(map.getZoom(), targetZoom),
          easing: PREMIUM_EASING,
          essential: true,
        });
      }

      // Establecer selección. El useEffect se encargará de crear/mostrar el popup
      setSelection({
        features: features as GeoJSON.Feature[],
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
      if (!feature) return;
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

    const handleMapMoveEnd = () => {
      scheduleViewportRefresh();
      scheduleSavePosition();
      runQueuedZoom();
    };

    const setupMapDataLayer = async () => {
      await ensurePointIcons(map, EMPTY_COLLECTION, isYearMode);
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
            "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
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

        // ── Pins individuales (Drive = azul, iNaturalist = verde, años = color) ──
        // Pins individuales — minzoom 6 para no aparecer en zoom bajo.
        map.addLayer({
          id: OBS_POINT_LAYER_ID,
          type: "symbol",
          source: OBS_SOURCE_ID,
          minzoom: 6,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": isYearMode
              ? [
                  "case",
                  ["has", "year"],
                  ["concat", YEAR_ICON_PREFIX, "-", ["to-string", ["get", "year"]]],
                  ["match", ["get", "source"], "inaturalist", OBS_ICON_INAT_ID, OBS_ICON_DRIVE_ID],
                ]
              : ["match", ["get", "source"], "inaturalist", OBS_ICON_INAT_ID, OBS_ICON_DRIVE_ID],
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
        map.on("moveend", handleMapMoveEnd);
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
      map.off("moveend", handleMapMoveEnd);
      map.off("zoomstart", onZoomStart);
      map.off("zoomend", onZoomEnd);
      if (showTextTimer) clearTimeout(showTextTimer);
      if (hideRafId !== null) cancelAnimationFrame(hideRafId);
      removeObservationLayers(map);
    };
  }, [map, ready, requestViewportPoints, runQueuedZoom, scheduleSavePosition, isYearMode]);

  // ── Ctrl + drag → pan ────────────────────────────────────────────────────
  // Por diseño de Mapbox, Ctrl+drag no está mapeado a ninguna acción en
  // Windows/Linux (en Mac lo usa para rotar). Lo implementamos manualmente:
  // cuando el usuario mantiene Ctrl y arrastra, hacemos pan con panBy.
  // El handler vive en el canvas nativo para no interferir con los layers GL.
  useEffect(() => {
    if (!map || !ready) return;

    const canvas = map.getCanvas();
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.button !== 0) return; // solo botón izquierdo
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
      // Evitar que Mapbox interprete este mousedown como inicio de boxZoom o rotate
      e.stopPropagation();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // panBy acepta píxeles de desplazamiento — negativo porque el mapa
      // se mueve en dirección opuesta al arrastre del cursor
      map.panBy([-dx, -dy], { duration: 0 });
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      canvas.style.cursor = "";
    };

    // Registrar en el canvas con capture:true para interceptar antes de Mapbox
    canvas.addEventListener("mousedown", onMouseDown, { capture: true });
    // mousemove y mouseup en window para capturar aunque el cursor salga del canvas
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown, { capture: true });
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [map, ready]);

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="obs-tt-location">
            <div class="obs-tt-location-label">Ubicación</div>
            <div class="obs-tt-location-country">Colombia</div>
            <div class="obs-tt-location-city obs-entry-tooltip-location-text">Cargando...</div>
          </div>
        </div>
        <div class="obs-tt-divider"></div>
        <div class="obs-tt-body">
          <div class="obs-tt-stat">
            <div class="obs-tt-count-label">Observaciones</div>
            <div class="obs-tt-count-value obs-entry-tooltip-count-text">—</div>
          </div>
          <div class="obs-tt-badge">
            <span class="obs-tt-badge-dot" style="background:#10b981;"></span>
            EN VIVO
          </div>
        </div>
        <div class="obs-tt-arrow"></div>
      </div>
    `;
    document.body.appendChild(tooltip);

    const countEl = tooltip.querySelector<HTMLElement>(".obs-entry-tooltip-count-text");

    // Posicionar el tooltip encima del pin usando getBoundingClientRect.
    const TOOLTIP_WIDTH = 320;
    let tooltipHeight = 0;

    // Throttle de 16ms (1 frame a 60fps) para evitar layout thrashing
    let lastPositionTime = 0;
    let pendingPosition = false;

    const positionTooltip = () => {
      const now = performance.now();
      if (now - lastPositionTime < 16) {
        // Si ya hay un frame pendiente, no programar otro
        if (!pendingPosition) {
          pendingPosition = true;
          requestAnimationFrame(() => {
            pendingPosition = false;
            positionTooltip();
          });
        }
        return;
      }
      lastPositionTime = now;

      const pinRect = markerEl.getBoundingClientRect();
      // Medir altura real si aún no la tenemos (solo una vez)
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
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      positionTooltip();
      tooltip.classList.add("obs-tt--visible");
    };

    const hideTooltip = () => {
      hideTimer = setTimeout(() => {
        tooltip.classList.remove("obs-tt--visible");
      }, 80);
    };

    const hideTooltipImmediately = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      tooltip.classList.remove("obs-tt--visible");
    };

    const refreshTooltipPosition = () => {
      if (tooltip.classList.contains("obs-tt--visible")) {
        positionTooltip();
      }
    };

    markerEl.addEventListener("mouseenter", showTooltip);
    markerEl.addEventListener("mouseleave", hideTooltip);
    tooltip.addEventListener("mouseenter", showTooltip);
    tooltip.addEventListener("mouseleave", hideTooltip);

    // Evitar que Ctrl+scroll sobre el tooltip haga zoom de página en el navegador.
    // El evento se cancela aquí y se reenvía al mapa para que Mapbox lo procese.
    const handleTooltipWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Reenviar el evento al canvas del mapa para que Mapbox haga el zoom
      const mapCanvas = map.getCanvas();
      if (mapCanvas) {
        mapCanvas.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            shiftKey: e.shiftKey,
            clientX: e.clientX,
            clientY: e.clientY,
          }),
        );
      }
    };
    tooltip.addEventListener("wheel", handleTooltipWheel, { passive: false });

    // Cargar nombre del lugar via Mapbox Geocoding (con caché interna)
    // Usar requestIdleCallback para no bloquear el hilo principal durante la carga inicial
    const scheduleGeocoding = (cb: () => void) => {
      if (typeof window.requestIdleCallback !== "undefined") {
        const id = window.requestIdleCallback(cb, { timeout: 2000 });
        return () => window.cancelIdleCallback(id);
      }
      // Fallback para browsers sin requestIdleCallback
      const id = window.setTimeout(cb, 50);
      return () => clearTimeout(id);
    };

    const cancelGeocoding = scheduleGeocoding(() => {
      getPlaceLabel(DATA_CENTER.lng, DATA_CENTER.lat)
        .then((label) => {
          const locEl = tooltip.querySelector(".obs-entry-tooltip-location-text");
          const countryEl = tooltip.querySelector(".obs-tt-location-country");
          if (label) {
            const parts = label.split(",").map((p) => p.trim());
            const country = parts[0] || "Colombia";
            const details = parts.slice(1).join(", ");

            if (countryEl) countryEl.textContent = country;
            if (locEl) locEl.textContent = details || "Zona de observaciones";
          }
        })
        .catch((_err) => {
          const locEl = tooltip.querySelector(".obs-entry-tooltip-location-text");
          if (locEl) locEl.textContent = "Zona de Observaciones";
        });
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

      // Ocultar tooltip y marcador completo de inmediato — evita ghosting
      // durante el flyTo porque Mapbox sigue moviendo el elemento DOM con el mapa.
      hideTooltipImmediately();
      markerEl.style.pointerEvents = "none";
      markerEl.style.visibility = "hidden";

      // Animar solo el innerWrap para el efecto de salida premium
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
        hideTooltipImmediately();
      }
      if (innerWrap) {
        innerWrap.style.transition = "opacity 350ms ease, transform 350ms ease";
        innerWrap.style.opacity = shouldHide ? "0" : "1";
        innerWrap.style.transform = shouldHide ? "scale(0.88)" : "";
      }
    };

    // Throttled refresh para evitar layout thrashing en movimientos rápidos.
    // Se pausa durante el flyTo para evitar que el tooltip reaparezca mientras
    // el marcador está oculto y el mapa está animando.
    let moveRafId: number | null = null;
    const throttledRefresh = () => {
      if (flyInProgress) return;
      if (moveRafId !== null) return;
      moveRafId = requestAnimationFrame(() => {
        moveRafId = null;
        refreshTooltipPosition();
      });
    };

    syncMarkerVisibility();
    map.on("zoom", syncMarkerVisibility);
    // Usar throttled refresh para move y zoom - evita múltiples layouts por frame
    map.on("move", throttledRefresh);
    map.on("zoom", throttledRefresh);
    // ResizeObserver es más eficiente que resize event para elementos específicos
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(throttledRefresh);
      resizeObserver.observe(markerEl);
    } else {
      map.on("resize", throttledRefresh);
    }

    return () => {
      markerEl.removeEventListener("mouseenter", showTooltip);
      markerEl.removeEventListener("mouseleave", hideTooltip);
      tooltip.removeEventListener("mouseenter", showTooltip);
      tooltip.removeEventListener("mouseleave", hideTooltip);
      tooltip.removeEventListener("wheel", handleTooltipWheel);
      hideTooltipImmediately();
      tooltip.remove();
      markerEl.removeEventListener("click", onMarkerClick);
      onTotalUpdateRef.current = null;
      cancelGeocoding(); // Cancelar geocoding pendiente
      map.off("zoom", syncMarkerVisibility);
      map.off("move", throttledRefresh);
      map.off("zoom", throttledRefresh);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        map.off("resize", throttledRefresh);
      }
      if (moveRafId !== null) {
        cancelAnimationFrame(moveRafId);
      }
      marker?.remove();
      entryMarkerRef.current = null;
    };
  }, [map, ready]);

  // El mapa ocupa fixed inset-0 siempre. La sidebar y topbar flotan encima
  // con z-index mayor. No usamos setPadding para no mover el mapa al toggle UI.

  // Guardar estilo en localStorage deshabilitado — el mapa siempre arranca
  // desde la vista y capa inicial al recargar la página.

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

  // Ciclo de vida del popup: se crea una sola vez por agrupación de features.
  // La navegación interna lista → detalle solo actualiza HTML/posición abajo.
  useEffect(() => {
    if (!map || !ready || !selection || !isMapDomReady(map)) {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      latestSelectionRef.current = null;
      renderedPopupSelectionRef.current = null;
      return;
    }

    latestSelectionRef.current = selection;

    let isDisposingPopup = false;

    // ── Pre-cache de elementos UI para evitar DOM Thrashing ─────────────────
    const sidebarEl = document.querySelector<HTMLElement>("[data-sidebar]");
    const filterPanelEl = document.querySelector<HTMLElement>("[data-filter-panel]");
    const topbarEl = document.querySelector<HTMLElement>("[data-topbar]");
    const searchEl = document.querySelector<HTMLElement>("[data-searchbar-float]");
    const mapContainer = map.getContainer();
    const mapRect = mapContainer.getBoundingClientRect();

    // ── Cálculo de Offsets Útiles ────────────────────────────────────────────
    const sidebarWidth = sidebarEl?.offsetWidth ?? 95;
    const filterPanelWidth = filterPanelEl?.offsetWidth ?? 360;

    const leftUIOffset = isUIHidden
      ? 0
      : isFilterOpen
        ? sidebarWidth + filterPanelWidth
        : sidebarWidth;

    let topOffset = 16;
    if (isUIHidden) {
      if (searchEl && searchEl.offsetHeight > 0) {
        topOffset = searchEl.getBoundingClientRect().bottom - mapRect.top + 8;
      } else {
        topOffset = 72;
      }
    } else {
      if (topbarEl && topbarEl.offsetHeight > 0) {
        topOffset = topbarEl.getBoundingClientRect().bottom - mapRect.top + 8;
      } else {
        topOffset = 70;
      }
    }
    topOffset = Math.max(16, topOffset);

    // ── Calcular anchor según la zona del viewport donde está el punto ────────
    // Dividimos el área útil en 4 cuadrantes dinámicos para que el popup siempre
    // se oriente hacia el centro del espacio disponible, maximizando la visibilidad.
    const computeAnchor = (): mapboxgl.Anchor => {
      const mapW = mapContainer.clientWidth;
      const mapH = mapContainer.clientHeight;
      const pt = map.project(selection.coords);

      const usableW = Math.max(1, mapW - leftUIOffset);
      const usableH = Math.max(1, mapH - topOffset);

      // Coordenadas normalizadas [-0.5, 0.5] relativas al centro del área útil
      const dx = (pt.x - leftUIOffset) / usableW - 0.5;
      const dy = (pt.y - topOffset) / usableH - 0.5;

      // Sensibilidad profesional: el popup elige la dirección opuesta al borde más cercano.
      // Usamos un factor de corrección para el ratio de aspecto del popup (tall/narrow).
      const popupAspectCorr = 0.85;

      if (Math.abs(dx) * popupAspectCorr > Math.abs(dy)) {
        return dx > 0 ? "right" : "left";
      }
      return dy > 0 ? "bottom" : "top";
    };

    // ── Calcular desplazamiento necesario para que el popup quepa ─────────────
    const computePanOffset = (anchor: mapboxgl.Anchor): { dx: number; dy: number } => {
      const POPUP_W = 360;
      const POPUP_H = 560;
      const PADDING = 16;
      const pt = map.project(selection.coords);
      const cx = pt.x;
      const cy = pt.y;

      let left: number, top: number;
      if (anchor === "bottom") {
        left = cx - POPUP_W / 2;
        top = cy - 56 - POPUP_H;
      } else if (anchor === "top") {
        left = cx - POPUP_W / 2;
        top = cy + 8;
      } else if (anchor === "right") {
        left = cx - 56 - POPUP_W;
        top = cy - POPUP_H / 2;
      } else {
        left = cx + 56;
        top = cy - POPUP_H / 2;
      }

      const right = left + POPUP_W;
      const bottom = top + POPUP_H;
      const mapW = mapContainer.clientWidth;
      const mapH = mapContainer.clientHeight;

      let dx = 0;
      let dy = 0;
      // El límite izquierdo real es el offset de la UI (sidebar + filtros cuando visible)
      // más el padding visual. Esto evita que el popup quede detrás de la sidebar.
      const leftBoundary = leftUIOffset + PADDING;
      if (left < leftBoundary) dx = left - leftBoundary;
      else if (right > mapW - PADDING) dx = right - mapW + PADDING;
      if (top < topOffset) dy = top - topOffset;
      else if (bottom > mapH - PADDING) dy = bottom - mapH + PADDING;

      return { dx, dy };
    };

    const anchor = computeAnchor();
    const { dx, dy } = computePanOffset(anchor);

    // Si hay desplazamiento necesario, mover el mapa con easeTo rápido
    // y crear el popup cuando termine — sin rebote porque el popup no existe aún.
    const createPopup = () => {
      if (isDisposingPopup) return;

      const popup = new mapboxgl.Popup({
        closeButton: false,
        maxWidth: "none",
        className: "custom-mapbox-popup",
        anchor,
        offset: {
          top: [0, 8] as [number, number],
          "top-left": [0, 8] as [number, number],
          "top-right": [0, 8] as [number, number],
          bottom: [0, -56] as [number, number],
          "bottom-left": [0, -56] as [number, number],
          "bottom-right": [0, -56] as [number, number],
          left: [56, 0] as [number, number],
          right: [-56, 0] as [number, number],
        },
      })
        .setLngLat(selection.coords)
        .setHTML(buildPopupFromSelection(selection))
        .addTo(map);

      popupRef.current = popup;
      renderedPopupSelectionRef.current = selection;

      // Ocultar → revelar limpio para que la animación CSS no haga flash
      const autoPanTimer = { current: null as ReturnType<typeof setTimeout> | null };
      const popupElImmediate = popup.getElement();
      if (popupElImmediate) popupElImmediate.style.visibility = "hidden";

      autoPanTimer.current = setTimeout(() => {
        requestAnimationFrame(() => {
          if (popupRef.current !== popup || !isMapDomReady(map)) {
            const el = popup.getElement();
            if (el) el.style.visibility = "";
            return;
          }
          const popupEl = popup.getElement();
          if (popupEl) popupEl.style.visibility = "";
        });
      }, 0);

      // Geocoding
      const applyGeocodingLabel = (label: string | null) => {
        if (popupRef.current !== popup) return;
        const el = popup.getElement();
        if (!el) return;
        const countrySpan = el.querySelector(".popup-loc-country");
        const detailSpan = el.querySelector(".popup-loc-detail");
        if (label) {
          const parts = label.split(",").map((p) => p.trim());
          if (countrySpan) countrySpan.textContent = parts[0] || "Colombia";
          if (detailSpan)
            detailSpan.textContent = parts.slice(1).join(", ") || "Zona de observaciones";
        } else {
          if (countrySpan) countrySpan.textContent = "Colombia";
          if (detailSpan) detailSpan.textContent = "Zona de observaciones";
        }
      };

      getPlaceLabel(selection.coords[0], selection.coords[1])
        .then((label) => {
          applyGeocodingLabel(label);
          requestAnimationFrame(() => applyGeocodingLabel(label));
        })
        .catch(() => {
          applyGeocodingLabel("Colombia");
        });

      popup.on("close", () => {
        if (!isDisposingPopup && popupRef.current === popup) {
          popupRef.current = null;
          setSelection(null);
        }
      });

      const element = popup.getElement();
      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target instanceof Element ? e.target : null;
        const currentSelection = latestSelectionRef.current;
        if (!target || !currentSelection) return;
        const { features, coords } = currentSelection;

        const closeBtn = target.closest(".close-list-btn");
        if (closeBtn) {
          if (typeof currentSelection.selectedFeatureIndex === "number") {
            setSelection({ features, coords, selectedFeatureIndex: undefined });
          } else {
            popup.remove();
          }
          return;
        }

        const item = target.closest(".observation-item");
        if (!item) return;
        const index = Number.parseInt(item.getAttribute("data-index") || "", 10);
        if (!Number.isInteger(index) || index < 0 || index >= features.length) return;
        const selectedFeature = features[index];
        if (!selectedFeature) return;
        const selectedCoords = getWrappedPointCoordinates(selectedFeature, map.getCenter().lng);
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
        setSelection({ features, coords: selectedCoords ?? coords, selectedFeatureIndex: index });
      };

      element?.addEventListener("click", handleClick, true);

      const handlePopupWheel = (e: WheelEvent) => {
        e.stopPropagation();
      };
      element?.addEventListener("wheel", handlePopupWheel, { passive: false, capture: true });

      return () => {
        isDisposingPopup = true;
        if (autoPanTimer.current) clearTimeout(autoPanTimer.current);
        element?.removeEventListener("click", handleClick, true);
        element?.removeEventListener("wheel", handlePopupWheel, { capture: true });
        if (popupRef.current === popup) popupRef.current = null;
        if (renderedPopupSelectionRef.current === selection)
          renderedPopupSelectionRef.current = null;
        popup.remove();
      };
    };

    // Si hay desplazamiento necesario, mover el mapa con easeTo rápido
    // y crear el popup cuando termine. Sin rebote porque el popup no existe aún.
    if (dx !== 0 || dy !== 0) {
      const center = map.getCenter();
      const centerPx = map.project(center);
      const newCenter = map.unproject([centerPx.x + dx, centerPx.y + dy]);
      let cleanup: (() => void) | undefined;
      map.once("moveend", () => {
        cleanup = createPopup() ?? undefined;
      });
      map.easeTo({ center: newCenter, duration: 200, easing: SOFT_PREMIUM_EASING });
      return () => {
        isDisposingPopup = true;
        cleanup?.();
      };
    }

    return createPopup() ?? undefined;
  }, [map, ready, selection, isUIHidden, isFilterOpen]);

  // ── Cerrar popup al hacer zoom ───────────────────────────────────────────
  // Usamos un flag ref en lugar de setSelection(null) directo en zoomstart.
  // setSelection dispara un re-render de React — con scroll spam puede ser
  // 10-20 re-renders/segundo, causando jank. El flag evita re-renders redundantes:
  // solo llama setSelection si el popup realmente está abierto.
  useEffect(() => {
    if (!map || !ready || !selection) return;

    let closed = false;
    const closeOnZoom = () => {
      if (closed) return;
      closed = true;
      setSelection(null);
    };

    map.on("zoomstart", closeOnZoom);

    return () => {
      map.off("zoomstart", closeOnZoom);
    };
  }, [map, ready, selection]);

  // Actualización barata del contenido: evita destruir el popup al abrir un detalle
  // dentro de la misma agrupación, que era la fuente del efecto fantasma.
  useEffect(() => {
    latestSelectionRef.current = selection;
    const requestId = ++popupLocationRequestRef.current;
    const popup = popupRef.current;

    if (!popup || !selection) {
      return;
    }

    if (renderedPopupSelectionRef.current === selection) {
      return;
    }

    if (!isPopupDomReady(popup, map)) {
      if (popupRef.current === popup) {
        popupRef.current = null;
      }
      renderedPopupSelectionRef.current = null;
      return;
    }

    try {
      popup.setLngLat(selection.coords).setHTML(buildPopupFromSelection(selection));
      renderedPopupSelectionRef.current = selection;
    } catch (error) {
      if (popupRef.current === popup) {
        popupRef.current = null;
      }
      renderedPopupSelectionRef.current = null;
      popup.remove();
      if (process.env.NODE_ENV !== "production") {
        // biome-ignore lint/suspicious/noConsole: Error de recuperación de popup en desarrollo
        console.warn("[map-popup] Se descartó un popup desmontado antes de actualizarlo:", error);
      }
      return;
    }

    const el = popup.getElement();
    if (!el) {
      return;
    }

    const countrySpan = el.querySelector(".popup-loc-country");
    const detailSpan = el.querySelector(".popup-loc-detail");
    if (!countrySpan && !detailSpan) {
      return;
    }

    getPlaceLabel(selection.coords[0], selection.coords[1])
      .then((label) => {
        if (popupLocationRequestRef.current === requestId && popupRef.current === popup) {
          if (label) {
            const parts = label.split(",").map((p) => p.trim());
            if (countrySpan) countrySpan.textContent = parts[0] || "Colombia";
            if (detailSpan)
              detailSpan.textContent = parts.slice(1).join(", ") || "Zona de observaciones";
          } else {
            if (countrySpan) countrySpan.textContent = "Colombia";
            if (detailSpan) detailSpan.textContent = "Zona de observaciones";
          }
        }
      })
      .catch(() => {
        if (popupLocationRequestRef.current === requestId && popupRef.current === popup) {
          if (countrySpan) countrySpan.textContent = "Colombia";
          if (detailSpan) detailSpan.textContent = "Zona de observaciones";
        }
      });
  }, [map, selection]);

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

  // Bloquear Ctrl+scroll a nivel de documento SOLO fuera del canvas del mapa,
  // para evitar que el navegador haga zoom de página en elementos como el tooltip
  // del marcador de entrada (position:fixed, portales, etc.).
  // IMPORTANTE: no bloquear si el target está dentro del canvas de Mapbox,
  // porque eso impediría que scrollZoom reciba el evento de zoom.
  useEffect(() => {
    const handleDocWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const target = e.target as HTMLElement | null;
      // Si el evento viene del canvas de Mapbox o de su contenedor, dejarlo pasar
      if (target?.closest(".mapboxgl-canvas-container, .mapboxgl-canvas")) return;

      e.preventDefault();
    };
    // capture:true → intercepta antes de que cualquier otro handler lo vea
    document.addEventListener("wheel", handleDocWheel, { passive: false, capture: true });
    return () => {
      document.removeEventListener("wheel", handleDocWheel, { capture: true });
    };
  }, []);

  // Referencia para trackear y cancelar animaciones de zoom activas
  const zoomAnimationRef = useRef<{ stop: () => void } | null>(null);

  const zoomIn = useCallback(() => {
    if (!map) return;
    const nextZoom = Math.min(MAX_ZOOM, map.getZoom() + BUTTON_ZOOM_STEP);

    // Cancelar animación previa si existe
    if (zoomAnimationRef.current) {
      zoomAnimationRef.current.stop();
      zoomAnimationRef.current = null;
    }

    if (map.isMoving() || map.isZooming()) {
      queuedZoomRef.current = nextZoom;
      return;
    }

    // Crear controlador de cancelación para esta animación
    let cancelled = false;
    zoomAnimationRef.current = {
      stop: () => {
        cancelled = true;
        map.stop();
      },
    };

    map.easeTo({
      zoom: nextZoom,
      duration: BUTTON_ZOOM_DURATION_MS,
      easing: PREMIUM_EASING,
      essential: true,
    });

    // Limpiar referencia al terminar
    window.setTimeout(() => {
      if (!cancelled) {
        zoomAnimationRef.current = null;
      }
    }, BUTTON_ZOOM_DURATION_MS);
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;

    const nextZoom = map.getZoom() - BUTTON_ZOOM_STEP;

    // Cancelar animación previa si existe
    if (zoomAnimationRef.current) {
      zoomAnimationRef.current.stop();
      zoomAnimationRef.current = null;
    }

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

      let cancelled = false;
      zoomAnimationRef.current = {
        stop: () => {
          cancelled = true;
          map.stop();
        },
      };

      map.easeTo({
        zoom: MIN_ZOOM,
        duration: 620,
        easing: PREMIUM_EASING,
        essential: true,
      });

      window.setTimeout(() => {
        if (!cancelled) {
          zoomAnimationRef.current = null;
        }
      }, 620);
      return;
    }

    let cancelled = false;
    zoomAnimationRef.current = {
      stop: () => {
        cancelled = true;
        map.stop();
      },
    };

    map.easeTo({
      zoom: nextZoom,
      duration: BUTTON_ZOOM_DURATION_MS,
      easing: PREMIUM_EASING,
      essential: true,
    });

    window.setTimeout(() => {
      if (!cancelled) {
        zoomAnimationRef.current = null;
      }
    }, BUTTON_ZOOM_DURATION_MS);
  }, [map]);

  // ── Limpiar caché cuando cambian filtros que alteran el resultado ────────────
  // currentStyle, dateFrom, dateTo, selectedGroup, source → cualquier cambio
  // invalida el viewport cache para forzar un fetch fresco con los nuevos parámetros.
  // biome-ignore lint/correctness/useExhaustiveDependencies: las dependencias extra son intencionales — son los filtros que invalidan la caché
  useEffect(() => {
    viewportCacheRef.current.clear();
    hasLoadedOnceRef.current = false;
    appliedCacheKeyRef.current = null;

    if (!map || !ready) return;

    const t = window.setTimeout(() => {
      void requestViewportPoints(map);
    }, 0);

    return () => window.clearTimeout(t);
  }, [currentStyle, dateFrom, dateTo, selectedGroup, source, map, ready, requestViewportPoints]);

  return (
    <div
      className={`fixed inset-0 ${className ?? ""}`}
      style={{
        background: "linear-gradient(145deg, #e8f4f0 0%, #e6f0f8 40%, #edf4f0 70%, #e9f2f7 100%)",
      }}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <CooperativeGestureHint mapContainerRef={containerRef} />

      <div className="pointer-events-none absolute inset-0 bg-map-vignette" />

      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        currentStyle={currentStyle}
        onStyleChange={handleStyleChange}
        isUIHidden={isUIHidden}
      />

      <MapLoadingOverlay
        ready={ready}
        visible={!ready || showLoadingOverlay}
        progress={loadProgress}
      />

      {zoomLimitNotice && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-premium">
          <div className="flex items-center gap-3 rounded-4-5 border border-blue-500/50 bg-white/95 px-4.5 py-2.5 shadow-premium-lg backdrop-blur-xl ring-1 ring-blue-500/15">
            <span className="text-sm-plus font-semibold text-zinc-800 tracking-tight">
              Has alcanzado el límite máximo de alejamiento
            </span>
          </div>
        </div>
      )}

      {dataLoadNotice && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-sky-200/70 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 shadow-premium-sm">
            {dataLoadNotice}
          </div>
        </div>
      )}
    </div>
  );
}

// format-sync
