"use client";

import { ChevronDown, Layers3, Mountain, Satellite, ZoomIn, ZoomOut } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import type { MapStyle } from "../../lib/mapbox-config";

export const MapControls = memo(function MapControls({
  onZoomIn,
  onZoomOut,
  currentStyle,
  onStyleChange,
  isUIHidden = false,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  isUIHidden?: boolean;
}) {
  const [layersOpen, setLayersOpen] = useState(false);
  const currentLabel = currentStyle === "terrain" ? "Terreno" : "Satélite";
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!layersOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setLayersOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLayersOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [layersOpen]);

  return (
    <>
      <div
        className={`absolute bottom-4 z-20 font-[Poppins] transition-all duration-600 cubic-bezier-[0.4,0,0.2,1] ${
          isUIHidden ? "left-4" : "left-[111px]"
        }`}
      >
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setLayersOpen((current) => !current)}
            className="group inline-flex h-12 items-center gap-2 rounded-2xl border border-white/70 bg-white/95 px-3.5 font-[Poppins] shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
            aria-label="Capas"
            title="Capas"
            aria-expanded={layersOpen}
            aria-haspopup="menu"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/15 transition-transform duration-200 group-hover:scale-105">
              <Layers3 className="h-4 w-4" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold tracking-tight text-zinc-800">Capas</span>
              <span className="text-[11px] text-zinc-500">{currentLabel}</span>
            </span>
            <span className="ml-0.5 flex h-6 items-center rounded-full border border-zinc-200/80 bg-zinc-950/5 px-1.5">
              <ChevronDown
                className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${layersOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          <div
            className={`absolute bottom-[calc(100%+12px)] left-0 w-64 origin-bottom-left overflow-hidden rounded-3xl border border-white/70 bg-white/98 font-[Poppins] shadow-[0_16px_48px_rgba(15,23,42,0.18)] transition-all duration-200 ${
              layersOpen
                ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
                : "translate-y-2 scale-[0.98] opacity-0 pointer-events-none"
            }`}
            role="menu"
          >
            <div className="border-b border-black/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Selector de capas
              </p>
            </div>

            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  onStyleChange("terrain");
                  setLayersOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-[Poppins] transition-all duration-200 ${
                  currentStyle === "terrain"
                    ? "border border-emerald-100 bg-linear-to-br from-emerald-50 to-emerald-50/30 text-emerald-700 shadow-sm"
                    : "text-zinc-700 hover:bg-zinc-950/5"
                }`}
                role="menuitem"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10">
                  <Mountain className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">Terreno</span>
                  <span className="block text-xs text-zinc-500">Relieve y vegetación</span>
                </span>
                {currentStyle === "terrain" ? (
                  <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Activa
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => {
                  onStyleChange("satellite");
                  setLayersOpen(false);
                }}
                className={`mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-[Poppins] transition-all duration-200 ${
                  currentStyle === "satellite"
                    ? "border border-sky-100 bg-linear-to-br from-sky-50 to-sky-50/30 text-sky-700 shadow-sm"
                    : "text-zinc-700 hover:bg-zinc-950/5"
                }`}
                role="menuitem"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10">
                  <Satellite className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">Satélite</span>
                  <span className="block text-xs text-zinc-500">Vista real con etiquetas</span>
                </span>
                {currentStyle === "satellite" ? (
                  <span className="rounded-full bg-sky-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Activa
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/95 font-[Poppins] shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
        <button
          type="button"
          onClick={onZoomIn}
          className="grid h-11 w-11 place-items-center text-zinc-700 transition-all duration-200 hover:bg-zinc-950/5 hover:text-zinc-900"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="h-px w-full bg-black/10" />
        <button
          type="button"
          onClick={onZoomOut}
          className="grid h-11 w-11 place-items-center text-zinc-700 transition-all duration-200 hover:bg-zinc-950/5 hover:text-zinc-900"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );
});

// format-sync
