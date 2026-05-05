"use client";

import { Earth } from "lucide-react";
import type { CSSProperties } from "react";
import { memo, useMemo, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MapLoadingOverlayProps = {
  ready: boolean;
  visible: boolean;
  progress: number;
};

type LoadingPhaseKey = "bootstrap" | "assets" | "polish" | "done";

// ─── Helpers (fuera del componente — no se recrean en cada render) ────────────

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

// ─── Sub-componente del spinner — completamente estático después del montaje ──
//
// memo() garantiza que el spinner NO re-renderiza cuando cambia `progress`.
// El spinner solo necesita los offsets iniciales (calculados una vez con useMemo)
// y las clases CSS de dirección. Todo lo demás son animaciones CSS puras en GPU.

type SpinnerProps = {
  motion: {
    a: { dir: number; offset: number };
    d: { dir: number; offset: number };
    b: { dir: number; offset: number };
    c: { dir: number; offset: number };
  };
};

const Spinner = memo(function Spinner({ motion }: SpinnerProps) {
  return (
    <div className="map-loading-ring-container">
      <svg className="map-loading-svg" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <defs>
          {/*
           * Sin filtros SVG — el feGaussianBlur desenfoca el trazo mismo.
           * El glow se maneja desde CSS con drop-shadow de radio pequeño.
           */}

          {/* A — indigo eléctrico */}
          <linearGradient id="mla-grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="30%" stopColor="#818cf8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#c7d2fe" stopOpacity="1" />
          </linearGradient>

          {/* D — violet brillante */}
          <linearGradient id="mla-grad-d" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
            <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ede9fe" stopOpacity="1" />
          </linearGradient>

          {/* B — cyan eléctrico */}
          <linearGradient id="mla-grad-b" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0" />
            <stop offset="30%" stopColor="#22d3ee" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
          </linearGradient>

          {/* C — azul real, claramente distinto del indigo/violet */}
          <linearGradient id="mla-grad-c" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
            <stop offset="35%" stopColor="#3b82f6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Anillo A — r=38, 90°, 4.8s — #6366f1 indigo */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#6366f1"
          strokeOpacity="0.95"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="59.69 179.07"
          strokeDashoffset={motion.a.dir * motion.a.offset}
          className={motion.a.dir > 0 ? "mla-arc-cw mla-arc-a" : "mla-arc-ccw mla-arc-a"}
        />
        {/* Anillo D — r=34, 80°, 3.1s — #818cf8 indigo medio */}
        <circle
          cx="50"
          cy="50"
          r="34"
          stroke="#818cf8"
          strokeOpacity="0.9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="47.47 166.16"
          strokeDashoffset={motion.d.dir * motion.d.offset}
          className={motion.d.dir > 0 ? "mla-arc-cw mla-arc-d" : "mla-arc-ccw mla-arc-d"}
        />
        {/* Anillo B — r=30, 70°, 2.3s — #38bdf8 sky */}
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="#38bdf8"
          strokeOpacity="0.9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="36.65 151.85"
          strokeDashoffset={motion.b.dir * motion.b.offset}
          className={motion.b.dir > 0 ? "mla-arc-cw mla-arc-b" : "mla-arc-ccw mla-arc-b"}
        />
        {/* Anillo C — r=22, 40°, 1.6s — #67e8f9 cyan */}
        <circle
          cx="50"
          cy="50"
          r="22"
          stroke="#67e8f9"
          strokeOpacity="0.9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="15.36 122.87"
          strokeDashoffset={motion.c.dir * motion.c.offset}
          className={motion.c.dir > 0 ? "mla-arc-cw mla-arc-c" : "mla-arc-ccw mla-arc-c"}
        />
      </svg>

      <div className="mla-icon">
        <Earth className="h-4 w-4" strokeWidth={1.5} />
      </div>
    </div>
  );
});

// ─── Componente principal ─────────────────────────────────────────────────────

export function MapLoadingOverlay({ ready, visible, progress }: MapLoadingOverlayProps) {
  // Redondear progress una sola vez — evita recalcular phaseKey/phaseTitle
  // en cada tick del RAF si el valor redondeado no cambió.
  const safeProgress = Math.max(4, Math.min(100, Math.round(progress)));
  const phaseKey = getLoadingPhaseKey(safeProgress);
  const phaseTitle = PHASE_TITLE[phaseKey];

  // Estilo estable para la barra de progreso.
  const progressStyle = useMemo(
    () =>
      ({
        "--map-progress": `${safeProgress}%`,
      }) as CSSProperties,
    [safeProgress],
  );

  /*
   * Patrón fijo alternado: ↻ ↺ ↻ ↺
   * Anillos adyacentes siempre en sentidos opuestos.
   * Usamos useState para inicializar los valores aleatorios una sola vez
   * durante el montaje del componente. Esto cumple con las reglas de pureza
   * de React 19 ya que el render inicial es determinista y el valor
   * aleatorio se persiste en el estado.
   */
  const [motion] = useState(() => ({
    a: { dir: 1, offset: Number((Math.random() * 238.76).toFixed(2)) },
    d: { dir: -1, offset: Number((Math.random() * 213.63).toFixed(2)) },
    b: { dir: 1, offset: Number((Math.random() * 188.5).toFixed(2)) },
    c: { dir: -1, offset: Number((Math.random() * 138.23).toFixed(2)) },
  }));

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
        className="map-loading-shell relative w-full max-w-72 overflow-hidden rounded-6-5 px-5 py-5"
        data-phase={phaseKey}
      >
        <div className="map-loading-shell__glow absolute inset-x-10 top-0 h-24 rounded-full" />
        <div className="relative flex flex-col items-center gap-3.5 text-center">
          {/* Spinner aislado — no re-renderiza cuando cambia progress */}
          <Spinner motion={motion} />

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
