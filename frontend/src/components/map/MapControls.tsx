"use client";

import { ChevronDown, Layers3, Moon, Mountain, Satellite, ZoomIn, ZoomOut } from "lucide-react";
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
  const currentLabel = {
    terrain: "Terreno",
    satellite: "Satélite",
    dark: "Diseño Oscuro",
    light: "Diseño Claro",
  }[currentStyle];
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
        className={`absolute bottom-4 z-20 font-sans transition-all duration-600 ease-premium ${
          isUIHidden ? "left-4" : "left-sidebar-full-offset"
        }`}
      >
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setLayersOpen((current) => !current)}
            className="group inline-flex h-12 items-center gap-2 rounded-2xl border border-white/70 bg-white/95 px-3.5 font-sans shadow-premium-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium-md-hover"
            aria-label="Capas"
            title="Capas"
            aria-expanded={layersOpen}
            aria-haspopup="menu"
            aria-controls="layers-menu"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/15 transition-transform duration-200 group-hover:scale-105">
              <Layers3 className="h-4 w-4" />
            </span>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold tracking-tight text-zinc-800">Capas</span>
              <span className="text-xs text-zinc-500">{currentLabel}</span>
            </span>
            <span className="ml-0.5 flex h-6 items-center rounded-full border border-zinc-200/80 bg-zinc-950/5 px-1.5">
              <ChevronDown
                className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${layersOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>

          <div
            id="layers-menu"
            className={`absolute bottom-full mb-3 left-0 w-64 origin-bottom-left overflow-hidden rounded-3xl border border-white/70 bg-white/98 font-sans shadow-premium-xl-hover transition-all duration-200 ${
              layersOpen
                ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
                : "translate-y-2 scale-95 opacity-0 pointer-events-none"
            }`}
            role="menu"
          >
            <div className="border-b border-black/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-premium text-zinc-500">
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
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-sans transition-all duration-200 ${
                  currentStyle === "terrain"
                    ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    currentStyle === "terrain"
                      ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Mountain className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-bold">Terreno</span>
                  <span className="text-2xs text-zinc-500">Mapa físico detallado</span>
                </div>
                {currentStyle === "terrain" && (
                  <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs-minus font-semibold text-white">
                    Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onStyleChange("satellite");
                  setLayersOpen(false);
                }}
                className={`mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-sans transition-all duration-200 ${
                  currentStyle === "satellite"
                    ? "bg-sky-50 text-sky-900 ring-1 ring-sky-500/20"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    currentStyle === "satellite"
                      ? "bg-sky-500 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)]"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Satellite className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-bold">Satélite</span>
                  <span className="text-2xs text-zinc-500">Imágenes reales de alta resolución</span>
                </div>
                {currentStyle === "satellite" && (
                  <span className="rounded-full bg-sky-500 px-2.5 py-1 text-xs-minus font-semibold text-white">
                    Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onStyleChange("dark");
                  setLayersOpen(false);
                }}
                className={`mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-sans transition-all duration-200 ${
                  currentStyle === "dark"
                    ? "bg-zinc-900 text-zinc-100 ring-1 ring-white/20"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    currentStyle === "dark"
                      ? "bg-zinc-800 text-white shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <Moon className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-bold">Diseño Oscuro</span>
                  <span className="text-2xs text-zinc-500">Mapa con alto contraste oscuro</span>
                </div>
                {currentStyle === "dark" && (
                  <span className="rounded-full bg-zinc-700 px-2.5 py-1 text-xs-minus font-semibold text-white">
                    Activo
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onStyleChange("light");
                  setLayersOpen(false);
                }}
                className={`mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-sans transition-all duration-200 ${
                  currentStyle === "light"
                    ? "bg-slate-50 text-slate-900 ring-1 ring-slate-500/20"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    currentStyle === "light"
                      ? "bg-slate-400 text-white shadow-[0_4px_12px_rgba(148,163,184,0.3)]"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-sun"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M22 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-bold">Diseño Claro</span>
                  <span className="text-2xs text-zinc-500">
                    Mapa con estética minimalista clara
                  </span>
                </div>
                {currentStyle === "light" && (
                  <span className="rounded-full bg-slate-400 px-2.5 py-1 text-xs-minus font-semibold text-white">
                    Activo
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/95 font-sans shadow-premium-md">
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
