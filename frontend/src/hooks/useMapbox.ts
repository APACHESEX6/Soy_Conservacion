"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { env } from "../config/env";

// ── GPU Tier Detection ─────────────────────────────────────────────────────
// Detecta capacidades GPU para ajustar calidad rendering adaptativamente
type GPUTier = "high" | "medium" | "low";

const detectGPUTier = (): GPUTier => {
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  // Detectar si es dispositivo de gama baja por características
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;

  if (isMobile) {
    if ((memory && memory <= 4) || (hardwareConcurrency && hardwareConcurrency <= 4)) {
      return "low";
    }
    if ((memory && memory <= 6) || (hardwareConcurrency && hardwareConcurrency <= 6)) {
      return "medium";
    }
    return "medium"; // Móviles modernos default a medium
  }

  // Desktop: más permisivo
  if ((memory && memory <= 4) || (hardwareConcurrency && hardwareConcurrency <= 2)) {
    return "low";
  }

  return "high";
};

const GPU_TIER = detectGPUTier();

// Configuraciones adaptativas por tier GPU
const GPU_CONFIG = {
  high: {
    fadeDuration: 0,
    antialias: false,
    trackResize: true,
  },
  medium: {
    fadeDuration: 0,
    antialias: false, // Antialias off para mejor performance
    trackResize: true,
  },
  low: {
    fadeDuration: 0,
    antialias: false,
    trackResize: false, // Desactivar tracking de resize para ahorrar cálculos
  },
} as const;

const CURRENT_GPU_CONFIG = GPU_CONFIG[GPU_TIER];

// Log en desarrollo para debugging - solo una vez por sesión
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const logKey = "__mapbox_gpu_logged__";
  const win = window as unknown as Record<string, unknown>;
  if (!win[logKey]) {
    win[logKey] = true;
    console.info(`[mapbox] GPU Tier: ${GPU_TIER}`, CURRENT_GPU_CONFIG);
  }
}

// Singleton PerformanceObserver para evitar duplicados
let globalPerfObserver: PerformanceObserver | null = null;

import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  LATAM_BOUNDS_ARRAY,
  MAP_STYLE,
  MAP_STYLES,
  MAX_ZOOM,
  type MapStyle,
  MIN_ZOOM,
} from "../lib/mapbox-config";
import type { LngLat } from "../types/map.types";

const PROGRESS_UPDATE_INTERVAL_MS = 160;
const MIN_PROGRESS_STEP = 4;
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
    [opts?.center?.lng, opts?.center?.lat, opts?.center],
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
    // biome-ignore lint/suspicious/noExplicitAny: Mapbox setStyle diff type is complex
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

    // ── Limpiar contenedor para evitar "The map container element should be empty"
    // Esto puede ocurrir por contenido residual de hot reload o desmontaje previo incompleto
    const container = containerRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_TOKEN;
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
      // GPU Adaptive: antialias desactivado en todos los tiers para máxima fluidez
      antialias: CURRENT_GPU_CONFIG.antialias,
      preserveDrawingBuffer: false,
      trackResize: CURRENT_GPU_CONFIG.trackResize,
      // false: el estilo de terreno de Mapbox no expira frecuentemente.
      // Evita re-requests innecesarias de tiles que ya están en caché del browser.
      refreshExpiredTiles: false,
      // IMPORTANTE: Desactivamos cooperativeGestures de Mapbox para evitar su mensaje
      // por defecto en inglés. Implementamos nuestra propia versión en español con
      // mejor diseño en CooperativeGestureHint.tsx
      cooperativeGestures: false,
    });
    mapRef.current = map;
    // setMapInstance se llama dentro de onIdle para que React 18 pueda
    // batchear map + ready en un solo render, evitando un render prematuro
    // mientras el canvas WebGL aún está inicializándose.

    // Deshabilitar rotación para que no aparezca la brújula
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Pan suave con inercia nativa de Mapbox (optimizada internamente)
    // La inercia por defecto está activada; la sensibilidad se ajusta
    // indirectamente a través de la configuración del mapa.
    map.dragPan.enable();

    // Scroll zoom más suave: wheelZoomRate controla cuánto zoom por tick de rueda.
    // El valor por defecto (1/450) es demasiado sensible en trackpads modernos.
    // 1/600 da una sensación más controlada y premium sin perder respuesta.
    map.scrollZoom.enable();
    map.scrollZoom.setWheelZoomRate(1 / 600);
    map.scrollZoom.setZoomRate(1 / 100);
    // Habilitar zoom suave continuo para trackpads (inercia en zoom)
    map.scrollZoom.enable({ around: "center" });

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

    // ── Performance Observer: Long Tasks Detection ────────────────────────────
    // Detecta tareas que bloquean el hilo principal >50ms (causa de jank)
    // Singleton: solo crear una instancia global para toda la aplicación
    if (
      typeof PerformanceObserver !== "undefined" &&
      process.env.NODE_ENV !== "production" &&
      !globalPerfObserver
    ) {
      try {
        globalPerfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Solo loguear tareas >200ms para reducido ruido en consola
            if (entry.duration > 200) {
              console.warn(`[mapbox-perf] Long task detected: ${entry.duration.toFixed(1)}ms`, {
                startTime: Math.round(entry.startTime),
              });
            }
          }
        });
        globalPerfObserver.observe({ entryTypes: ["longtask"] } as PerformanceObserverInit);
      } catch {
        // PerformanceObserver no soportado o longtask no disponible
      }
    }

    // ── WebGL Context Loss Recovery (CRÍTICO para móviles) ────────────────────
    // En dispositivos con poca RAM, el browser puede matar el contexto WebGL.
    // Sin este manejo, el mapa queda en negro permanentemente.
    const canvas = map.getCanvas();

    const handleContextLost = (e: Event) => {
      e.preventDefault(); // Prevenir comportamiento por defecto del browser
      if (process.env.NODE_ENV !== "production") {
        console.warn("[mapbox] WebGL context lost - intentando recuperación");
      }
      // Forzar recreación del mapa tras breve delay
      setTimeout(() => {
        if (!destroyed && mapRef.current) {
          mapRef.current.triggerRepaint();
        }
      }, 100);
    };

    const handleContextRestored = () => {
      if (process.env.NODE_ENV !== "production") {
        console.info("[mapbox] WebGL context restored");
      }
      // Notificar a componentes padre que el mapa está listo nuevamente
      setReady(true);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      destroyed = true;
      if (progressRafId !== null) window.cancelAnimationFrame(progressRafId);
      if (monitorRafId !== null) window.cancelAnimationFrame(monitorRafId);
      if (safetyTimerId !== null) clearTimeout(safetyTimerId);
      // No desconectar globalPerfObserver - es singleton para toda la app
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
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
  }, [center.lat, center.lng, style, zoom]);

  return {
    containerRef,
    map: mapInstance,
    ready,
    loadProgress,
  };
}
