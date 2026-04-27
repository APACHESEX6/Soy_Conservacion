"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { MapViewProps } from "../../types/map.types";
import { MIN_ZOOM, type MapStyle } from "../../lib/mapbox-config";
import { useMapbox } from "../../hooks/useMapbox";
import { MapControls } from "./MapControls";

export function MapView({ className, center, zoom, isUIHidden }: MapViewProps & { isUIHidden?: boolean }) {
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
      }, 2000);

      map.zoomTo(MIN_ZOOM, { duration: 200 });
      return;
    }

    map.zoomTo(map.getZoom() - 1, { duration: 250 });
  }, [map]);

  return (
    <div className={`relative w-full h-full ${className ?? ""}`}>
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
        isUIHidden={isUIHidden}
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
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500 cubic-bezier(0.4,0,0.2,1)">
          <div className="flex items-center gap-3 rounded-[18px] border border-blue-500/50 bg-white/95 px-[18px] py-[10px] shadow-[0_12px_40px_rgba(15,23,42,0.1)] backdrop-blur-xl ring-1 ring-blue-500/15">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 ring-1 ring-emerald-500/15">
              <Info className="h-[22px] w-[22px] text-blue-600" strokeWidth={2.25} />
            </div>
            <span className="text-[14px] font-semibold text-zinc-800 tracking-tight">
              Has alcanzado el límite máximo de alejamiento
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
