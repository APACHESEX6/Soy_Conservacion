"use client";

/**
 * OrbitRing — Cometa de luz que orbita el borde del componente padre.
 *
 * Una sola capa CSS (::before) con conic-gradient + mask-composite
 * produce el arco nítido. El glow del pico lo da filter:drop-shadow
 * en el wrapper, que opera sobre el arco ya recortado y se expande
 * hacia afuera sin pintar dentro del chip.
 *
 * GPU-accelerated via @property — 60fps, CSS-only, sin JS en el loop.
 */

import { memo } from "react";

type OrbitRingProps = {
  /** Border-radius en px — debe coincidir con el border-radius del padre */
  radius?: number;
  /** Grosor del arco en px */
  borderWidth?: number;
  /** Duración de una vuelta completa en segundos */
  duration?: number;
  /** Sentido antihorario */
  reverse?: boolean;
};

export const OrbitRing = memo(function OrbitRing({
  radius = 16,
  borderWidth = 1.5,
  duration = 3,
  reverse = false,
}: OrbitRingProps) {
  return (
    <div
      aria-hidden="true"
      className="orbit-ring"
      style={
        {
          "--orbit-radius": `${radius}px`,
          "--orbit-width": `${borderWidth}px`,
          "--orbit-duration": `${duration}s`,
          "--orbit-direction": reverse ? "reverse" : "normal",
        } as React.CSSProperties
      }
    />
  );
});
