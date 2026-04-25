"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapViewProps } from "../types/map.types";
import { MIN_ZOOM, type MapStyle } from "../lib/mapbox-config";
import { useMapbox } from "../hooks/useMapbox";
import { MapControls } from "./MapControls";

export function MapView({ className, center, zoom }: MapViewProps) {
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("terrain");
  const [zoomLimitNotice, setZoomLimitNotice] = useState(false);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { containerRef, map, ready } = useMapbox({ center, zoom, style: currentStyle });

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const zoomIn = useCallback(() => {
    if (!map) return;
    map.zoomTo(map.getZoom() + 1, { duration: 250 });
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;

    const nextZoom = map.getZoom() - 1;

    if (nextZoom < MIN_ZOOM + 0.01) {
      setZoomLimitNotice(true);

      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }

      noticeTimerRef.current = setTimeout(() => {
        setZoomLimitNotice(false);
      }, 1700);

      map.zoomTo(MIN_ZOOM, { duration: 200 });
      return;
    }

    map.zoomTo(map.getZoom() - 1, { duration: 250 });
  }, [map]);

  return (
    <div className={`fixed inset-0 ${className ?? ""}`}>
      {/* MAPA */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* CAPA VISUAL SUTIL */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_92%,rgba(16,185,129,0.08),transparent_35%),radial-gradient(circle_at_95%_8%,rgba(14,165,233,0.08),transparent_35%)]" />

      {/* CONTROLES */}
      <MapControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        currentStyle={currentStyle}
        onStyleChange={setCurrentStyle}
      />

      {/* LOADING */}
      {!ready && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-700 shadow-[0_10px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-950/80 dark:text-zinc-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Cargando mapa…
          </div>
        </div>
      )}

      {zoomLimitNotice && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-amber-200/60 bg-amber-50/95 px-4 py-2 text-sm font-medium text-amber-700 shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            No se puede minimizar más el mapa.
          </div>
        </div>
      )}
    </div>
  );
}
