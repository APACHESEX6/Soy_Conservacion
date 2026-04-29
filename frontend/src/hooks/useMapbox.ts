"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { getMapboxToken } from "../lib/env";

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE,
  LATAM_BOUNDS_ARRAY,
  MAP_STYLES,
  MIN_ZOOM,
  MAX_ZOOM,
  type MapStyle,
} from "../lib/mapbox-config";
import type { LngLat } from "../types/map.types";

const PROGRESS_UPDATE_INTERVAL_MS = 80;
const MIN_PROGRESS_STEP = 2;
// Timeout de seguridad: si el evento idle nunca llega (error silencioso, race condition
// entre cambios de estilo), el RAF loop se cancela para evitar quema de CPU indefinida.
const PROGRESS_SAFETY_TIMEOUT_MS = 9_000;

export function useMapbox(opts?: { center?: LngLat; zoom?: number; style?: MapStyle }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Usar lat/lng primitivos como deps evita que un objeto literal inline del padre
  // invalide el memo en cada render aunque los valores no hayan cambiado.
  const center = useMemo(
    () => opts?.center ?? DEFAULT_CENTER,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [opts?.center?.lng, opts?.center?.lat],
  );
  const zoom = opts?.zoom ?? DEFAULT_ZOOM;
  const style = opts?.style ?? "terrain";

  const [ready, setReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const currentStyleRef = useRef<string>(MAP_STYLES[style] ?? MAP_STYLE);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const newStyleUrl = MAP_STYLES[style] ?? MAP_STYLE;

    if (currentStyleRef.current === newStyleUrl) return;

    currentStyleRef.current = newStyleUrl;

    // REINICIO TOTAL DEL ESTADO DE CARGA
    setReady(false);
    setLoadProgress(8);

    let pendingResources = 0;
    let loadedResources = 0;
    let progressRafId: number | null = null;
    let monitorRafId: number | null = null;
    let safetyTimerId: ReturnType<typeof setTimeout> | null = null;
    let styleLoadSeen = false;
    let mapBecameIdle = false;
    let progressFinalized = false;
    let queuedProgress = 12;
    let lastProgressCommit = 0;
    let lastMonitorRun = 0;

    const scheduleProgress = (next: number) => {
      queuedProgress = next;
      if (progressRafId !== null) {
        return;
      }
      progressRafId = window.requestAnimationFrame(() => {
        progressRafId = null;
        const now = performance.now();
        setLoadProgress((current) => {
          const target = Math.max(current, Math.min(queuedProgress, 100));
          const delta = target - current;
          if (target < 100 && now - lastProgressCommit < PROGRESS_UPDATE_INTERVAL_MS) {
            return current;
          }
          if (target < 100 && delta < MIN_PROGRESS_STEP) {
            return current;
          }
          lastProgressCommit = now;
          return target;
        });
      });
    };

    const updateProgress = () => {
      if (progressFinalized) {
        return;
      }
      if (!styleLoadSeen) {
        scheduleProgress(12);
        return;
      }

      const styleLoaded = map.isStyleLoaded();
      const tilesLoaded = map.areTilesLoaded();
      const ratio = pendingResources <= 0 ? 0 : Math.min(1, loadedResources / pendingResources);

      // Misma curva visual que en carga inicial para que el feedback sea consistente.
      let next = styleLoaded ? 58 : 12;
      next = Math.max(next, Math.round((styleLoaded ? 58 : 12) + ratio * (styleLoaded ? 38 : 32)));

      if (tilesLoaded) {
        next = Math.max(next, 99);
      } else if (styleLoaded) {
        next = Math.max(next, 72);
      }
      if (mapBecameIdle) {
        next = 100;
      }

      scheduleProgress(next);
    };

    const onDataLoading = () => {
      pendingResources += 1;
      updateProgress();
    };

    const onData = () => {
      if (pendingResources > 0) {
        loadedResources = Math.min(pendingResources, loadedResources + 1);
      }
      updateProgress();
    };

    const onStyleLoad = () => {
      styleLoadSeen = true;
      updateProgress();
    };

    const monitorProgress = () => {
      const now = performance.now();
      if (now - lastMonitorRun > 100) {
        updateProgress();
        lastMonitorRun = now;
      }
      if (!mapBecameIdle) {
        monitorRafId = window.requestAnimationFrame(monitorProgress);
      }
    };

    const finalizeStyleProgress = () => {
      if (progressFinalized) return;
      mapBecameIdle = true;
      progressFinalized = true;
      if (progressRafId !== null) {
        window.cancelAnimationFrame(progressRafId);
        progressRafId = null;
      }
      if (monitorRafId !== null) {
        window.cancelAnimationFrame(monitorRafId);
        monitorRafId = null;
      }
      if (safetyTimerId !== null) {
        clearTimeout(safetyTimerId);
        safetyTimerId = null;
      }
      setLoadProgress(100);
      setReady(true);
      map.off("dataloading", onDataLoading);
      map.off("data", onData);
      map.off("style.load", onStyleLoad);
      map.off("idle", onStyleIdle);
      map.off("error", onStyleError);
    };

    const onStyleIdle = () => {
      // Evita cerrar el loading con un idle previo al nuevo estilo.
      if (!styleLoadSeen) return;
      updateProgress();
      finalizeStyleProgress();
    };

    const onStyleError = () => {
      // Evita lock infinito del loader si hay error de red temporal.
      finalizeStyleProgress();
    };

    map.on("dataloading", onDataLoading);
    map.on("data", onData);
    map.on("style.load", onStyleLoad);
    map.on("idle", onStyleIdle);
    map.on("error", onStyleError);
    monitorRafId = window.requestAnimationFrame(monitorProgress);

    // Válvula de seguridad: si idle nunca llega, forzamos fin del loading tras 9s.
    safetyTimerId = setTimeout(finalizeStyleProgress, PROGRESS_SAFETY_TIMEOUT_MS);

    // Evitamos el diff incremental entre estilos con sprites distintos.
    // En ese caso Mapbox termina reconstruyendo igual y lanza un warning ruidoso.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setStyle(newStyleUrl, { diff: false } as any);

    return () => {
      if (progressRafId !== null) window.cancelAnimationFrame(progressRafId);
      if (monitorRafId !== null) window.cancelAnimationFrame(monitorRafId);
      if (safetyTimerId !== null) clearTimeout(safetyTimerId);
      map.off("dataloading", onDataLoading);
      map.off("data", onData);
      map.off("style.load", onStyleLoad);
      map.off("idle", onStyleIdle);
      map.off("error", onStyleError);
    };
  }, [style]);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = getMapboxToken();
    setLoadProgress(8);

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[style] ?? MAP_STYLE,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
      maxBounds: LATAM_BOUNDS_ARRAY,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      projection: "mercator",
      // fadeDuration 0: tiles nuevos aparecen instantáneamente → sin cortes al hacer zoom
      fadeDuration: 0,
      // false: sin colisiones entre fuentes → menos CPU en cada frame
      crossSourceCollisions: false,
      // Evita cargar fuentes remotas para caracteres CJK
      localIdeographFontFamily: "",
      // false: mejor FPS en GPUs integradas
      antialias: false,
      preserveDrawingBuffer: false,
      trackResize: true,
      // false: el estilo de terreno de Mapbox no expira frecuentemente.
      // Evita re-requests innecesarias de tiles que ya están en caché del browser.
      refreshExpiredTiles: false,
    });
    mapRef.current = map;
    // setMapInstance se llama dentro de onIdle para que React 18 pueda
    // batchear map + ready en un solo render, evitando un render prematuro
    // mientras el canvas WebGL aún está inicializándose.

    // Deshabilitar rotación para que no aparezca la brújula
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Pan suave con inercia nativa de Mapbox
    map.dragPan.enable();

    // Scroll zoom más suave: wheelZoomRate controla cuánto zoom por tick de rueda.
    // El valor por defecto (1/450) es demasiado sensible en trackpads modernos.
    // 1/600 da una sensación más controlada y premium sin perder respuesta.
    map.scrollZoom.enable();
    map.scrollZoom.setWheelZoomRate(1 / 600);
    map.scrollZoom.setZoomRate(1 / 100);

    let pendingResources = 0;
    let loadedResources = 0;
    let progressRafId: number | null = null;
    let monitorRafId: number | null = null;
    let safetyTimerId: ReturnType<typeof setTimeout> | null = null;
    let queuedProgress = 12;
    let mapBecameIdle = false;
    let progressFinalized = false;
    let destroyed = false;
    let lastProgressCommit = 0;
    let lastMonitorRun = 0;

    const scheduleProgress = (next: number) => {
      queuedProgress = next;
      if (progressRafId !== null) {
        return;
      }

      progressRafId = window.requestAnimationFrame(() => {
        progressRafId = null;
        const now = performance.now();
        setLoadProgress((current) => {
          const target = Math.max(current, Math.min(queuedProgress, 100));
          const delta = target - current;
          if (target < 100 && now - lastProgressCommit < PROGRESS_UPDATE_INTERVAL_MS) {
            return current;
          }
          if (target < 100 && delta < MIN_PROGRESS_STEP) {
            return current;
          }
          lastProgressCommit = now;
          return target;
        });
      });
    };

    const updateProgress = () => {
      if (progressFinalized) {
        return;
      }

      const styleLoaded = map.isStyleLoaded();
      const tilesLoaded = map.areTilesLoaded();
      const ratio = pendingResources <= 0 ? 0 : Math.min(1, loadedResources / pendingResources);

      // Curva de progreso por fases reales:
      // 12-58: carga de estilo/base
      // 58-96: recursos (tiles/sources) observados por eventos de data
      // 96-99: tiles reportados como listos
      // 100: evento idle (mapa estable)
      let next = styleLoaded ? 58 : 12;
      next = Math.max(next, Math.round((styleLoaded ? 58 : 12) + ratio * (styleLoaded ? 38 : 32)));

      if (tilesLoaded) {
        next = Math.max(next, 99);
      } else if (styleLoaded) {
        next = Math.max(next, 72);
      }

      if (mapBecameIdle) {
        next = 100;
      }

      scheduleProgress(next);
    };

    const onDataLoading = () => {
      pendingResources += 1;
      updateProgress();
    };

    const onData = () => {
      if (pendingResources > 0) {
        loadedResources = Math.min(pendingResources, loadedResources + 1);
      }
      updateProgress();
    };

    const onLoad = () => {
      // El estilo base está listo, pero aún pueden faltar tiles/sources.
      updateProgress();
    };

    const finalizeInitProgress = () => {
      if (progressFinalized) return;
      // Guard: si el efecto ya fue limpiado (destroyed), no actualizar estado
      // con un mapa que ya fue destruido. Esto evita el error de appendChild
      // cuando React Strict Mode desmonta y remonta el componente, o cuando
      // el safetyTimerId se dispara después del cleanup.
      if (destroyed) return;
      mapBecameIdle = true;
      progressFinalized = true;
      if (progressRafId !== null) {
        window.cancelAnimationFrame(progressRafId);
        progressRafId = null;
      }
      if (monitorRafId !== null) {
        window.cancelAnimationFrame(monitorRafId);
        monitorRafId = null;
      }
      if (safetyTimerId !== null) {
        clearTimeout(safetyTimerId);
        safetyTimerId = null;
      }
      map.off("dataloading", onDataLoading);
      map.off("data", onData);
      // Batch: React 18 agrupa estos tres setState en un solo render.
      setMapInstance(map);
      setLoadProgress(100);
      setReady(true);
    };

    const onIdle = () => {
      updateProgress();
      finalizeInitProgress();
    };

    const monitorProgress = () => {
      const now = performance.now();
      if (now - lastMonitorRun > 100) {
        updateProgress();
        lastMonitorRun = now;
      }
      if (!mapBecameIdle) {
        monitorRafId = window.requestAnimationFrame(monitorProgress);
      }
    };

    map.on("dataloading", onDataLoading);
    map.on("data", onData);
    map.on("style.load", onLoad);
    map.on("idle", onIdle);
    monitorRafId = window.requestAnimationFrame(monitorProgress);

    // Válvula de seguridad: si idle nunca llega, forzamos fin del loading tras 9s.
    safetyTimerId = setTimeout(finalizeInitProgress, PROGRESS_SAFETY_TIMEOUT_MS);

    return () => {
      destroyed = true;
      if (progressRafId !== null) window.cancelAnimationFrame(progressRafId);
      if (monitorRafId !== null) window.cancelAnimationFrame(monitorRafId);
      if (safetyTimerId !== null) clearTimeout(safetyTimerId);
      map.off("dataloading", onDataLoading);
      map.off("data", onData);
      map.off("style.load", onLoad);
      map.off("idle", onIdle);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      setReady(false);
      setLoadProgress(0);
    };
    // NOTA: `zoom` intencionalmente excluido de las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  return {
    containerRef,
    map: mapInstance,
    ready,
    loadProgress,
  };
}
