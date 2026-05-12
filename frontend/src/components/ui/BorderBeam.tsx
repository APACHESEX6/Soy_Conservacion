"use client";

/**
 * BorderBeam — Animated conic-gradient border with a traveling light beam.
 *
 * Uses CSS @property + conic-gradient + mask-composite for GPU-accelerated
 * animation that runs on the compositor thread (60fps guaranteed).
 *
 * The beam is a bright focal point that rotates around the element perimeter,
 * leaving a subtle shimmer trail behind it.
 */

type BorderBeamProps = {
  /** Corner radius in px — must match the parent's border-radius */
  radius?: number;
  /** Border thickness in px */
  borderWidth?: number;
  /** Rotation speed in seconds */
  duration?: number;
  /** Rotate counter-clockwise */
  reverse?: boolean;
  /** Primary beam color (the bright focal point) */
  beamColor?: string;
  /** Secondary trail color (the shimmer tail) */
  trailColor?: string;
  /** Base border tint when beam is not passing */
  baseColor?: string;
};

export function BorderBeam({
  radius = 16,
  borderWidth = 1.5,
  duration = 2.4,
  reverse = false,
  beamColor = "rgba(99,102,241,0.95)",
  trailColor = "rgba(99,102,241,0.60)",
  baseColor = "rgba(99,102,241,0.35)",
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className="border-beam"
      style={
        {
          "--beam-radius": `${radius}px`,
          "--beam-width": `${borderWidth}px`,
          "--beam-duration": `${duration}s`,
          "--beam-direction": reverse ? "reverse" : "normal",
          "--beam-color": beamColor,
          "--beam-trail": trailColor,
          "--beam-base": baseColor,
        } as React.CSSProperties
      }
    />
  );
}
