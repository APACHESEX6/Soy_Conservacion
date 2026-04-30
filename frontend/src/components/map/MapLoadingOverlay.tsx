"use client";

import { Earth } from "lucide-react";
import type { CSSProperties } from "react";

type MapLoadingOverlayProps = {
  ready: boolean;
  visible: boolean;
  progress: number;
};

type LoadingPhaseKey = "bootstrap" | "assets" | "polish" | "done";

const getLoadingPhaseKey = (progress: number): LoadingPhaseKey => {
  if (progress < 28) return "bootstrap";
  if (progress < 68) return "assets";
  if (progress < 100) return "polish";
  return "done";
};

const PHASE_TITLE: Record<LoadingPhaseKey, string> = {
  bootstrap: "Cargando mapa",
  assets: "Cargando mapa",
  polish: "Cargando mapa",
  done: "Listo",
};

// ─── Geometría ────────────────────────────────────────────────────────────
const CX = 44;
const CY = 44;
const toRad = (deg: number) => (deg * Math.PI) / 180;

const buildArc = (r: number, arcDeg: number, offsetDeg: number): string => {
  const x1 = CX + r * Math.sin(toRad(offsetDeg));
  const y1 = CY - r * Math.cos(toRad(offsetDeg));
  const x2 = CX + r * Math.sin(toRad(offsetDeg + arcDeg));
  const y2 = CY - r * Math.cos(toRad(offsetDeg + arcDeg));
  const large = arcDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
};

/*
 * 3 arcos con geometría, velocidad y fase de brillo distintas.
 * Ninguno comparte tamaño ni posición inicial.
 *
 * Interior  r=20 — arco corto  75°, arranca en   0°, antihorario 4.2s
 * Media     r=29 — arco largo 140°, arranca en  55°, horario     2.8s
 * Exterior  r=38 — arco medio 100°, arranca en 200°, antihorario 6.5s
 */
const ARC_INNER = buildArc(20, 75, 0);
const ARC_MID = buildArc(29, 140, 55);
const ARC_OUTER = buildArc(38, 100, 200);

// Grosor uniforme para los 3 arcos
const STROKE_WIDTH = "2.4";

export function MapLoadingOverlay({ ready, visible, progress }: MapLoadingOverlayProps) {
  const safeProgress = Math.max(4, Math.min(100, Math.round(progress)));
  const phaseKey = getLoadingPhaseKey(safeProgress);
  const phaseTitle = PHASE_TITLE[phaseKey];
  const progressStyle = { "--map-progress": `${safeProgress}%` } as CSSProperties;

  return (
    <div
      aria-live="polite"
      aria-busy={!ready}
      aria-hidden={!visible}
      role="status"
      className={`pointer-events-none absolute inset-0 z-50 flex items-center justify-center px-6 transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="map-loading-overlay absolute inset-0" data-phase={phaseKey} />

      <div
        className="map-loading-shell relative w-full max-w-74 overflow-hidden rounded-[26px] px-5 py-5"
        data-phase={phaseKey}
      >
        <div className="map-loading-shell__glow absolute inset-x-10 top-0 h-24 rounded-full" />
        <div className="relative flex flex-col items-center gap-3.5 text-center">
          <div className="map-loading-ring-container">
            <div className="map-loading-ring-halo" />

            {/*
             * Rotación via CSS animation en el SVG — nunca se congela al refrescar.
             * SMIL animateTransform tiene un bug en Chrome/Safari donde se pausa
             * si la página se recarga rápido o el tab pierde foco.
             * CSS animation siempre se reinicia correctamente con el documento.
             *
             * transform-origin: 44px 44px → centro exacto del viewBox 88×88.
             * Grosor uniforme STROKE_WIDTH en los 3 arcos.
             *
             * Direcciones:
             *   Exterior  → antihorario (←)  7s
             *   Media     → horario     (→)  3s
             *   Interior  → antihorario (←)  5s
             */}

            {/* Exterior — r=38, antihorario 7s */}
            <svg
              className="map-loading-layer map-loading-layer--outer"
              viewBox="0 0 88 88"
              fill="none"
              aria-hidden="true"
            >
              <path
                d={ARC_OUTER}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                className="map-loading-arc map-loading-arc--outer"
              />
            </svg>

            {/* Media — r=29, horario 3s */}
            <svg
              className="map-loading-layer map-loading-layer--mid"
              viewBox="0 0 88 88"
              fill="none"
              aria-hidden="true"
            >
              <path
                d={ARC_MID}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                className="map-loading-arc map-loading-arc--mid"
              />
            </svg>

            {/* Interior — r=20, antihorario 5s */}
            <svg
              className="map-loading-layer map-loading-layer--inner"
              viewBox="0 0 88 88"
              fill="none"
              aria-hidden="true"
            >
              <path
                d={ARC_INNER}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                className="map-loading-arc map-loading-arc--inner"
              />
            </svg>

            {/* Núcleo glassmorphism */}
            <div className="map-loading-core-glass">
              <Earth className="h-5 w-5" strokeWidth={1.5} />
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <p className="map-loading-phase">{phaseTitle}</p>
            <span className="map-loading-percent">{safeProgress}%</span>
          </div>

          <div className="flex w-full flex-col">
            <div
              className="map-loading-progress"
              role="progressbar"
              aria-label="Carga del mapa"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={safeProgress}
              aria-valuetext={`${phaseTitle}, ${safeProgress}% completado`}
              style={progressStyle}
            >
              <div className="map-loading-progress__fill" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
