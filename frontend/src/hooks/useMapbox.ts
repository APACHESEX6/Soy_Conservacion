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
} from "../lib/mapbox-config";
import type { MapStyle } from "../lib/mapbox-config";
import type { LngLat } from "../types/map.types";

export function useMapbox(opts?: { center?: LngLat; zoom?: number; style?: MapStyle }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const center = useMemo(() => opts?.center ?? DEFAULT_CENTER, [opts?.center]);
  const zoom = opts?.zoom ?? DEFAULT_ZOOM;
  const style = opts?.style ?? "terrain";

  const [ready, setReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = getMapboxToken();

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[style] ?? MAP_STYLE,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: false,
      maxBounds: LATAM_BOUNDS_ARRAY,
      minZoom: MIN_ZOOM,
      projection: "mercator", // <-- Esto fuerza vista plana
    });
    mapRef.current = map;
    setMapInstance(map);

    // Deshabilitar rotación para que no aparezca la brújula
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Resize map when container resizes
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    // ...existing code...
    const onLoad = () => setReady(true);
    map.on("load", onLoad);

    return () => {
      resizeObserver.disconnect();
      map.off("load", onLoad);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
      setReady(false);
    };
  }, [center.lat, center.lng, style, zoom]);

  return {
    containerRef,
    map: mapInstance,
    ready,
  };
}
