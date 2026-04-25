import type { LngLat } from "../types/map.types";

export type MapStyle = "terrain" | "satellite";

export const MAP_STYLES: Record<MapStyle, string> = {
  terrain: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export const MAP_STYLE = MAP_STYLES.terrain;

// Centro visual óptimo para mostrar Colombia, Ecuador, Perú, Venezuela y Brasil
export const DEFAULT_CENTER: LngLat = {
  lng: -66.5, // Aproximadamente entre Venezuela y Brasil
  lat: -2.5,  // Ecuador/Colombia/Perú
};

export const DEFAULT_ZOOM = 3;
export const MIN_ZOOM = 3;

// Límites geográficos de América (Norteamérica, Centroamérica y Sudamérica)
// Formato: [west, south, east, north]
// Límites geográficos de Latinoamérica (excluyendo EE.UU.)
export const LATAM_BOUNDS = {
  north: 32,      // Frontera sur de EE. UU.
  south: -56,     // Tierra del Fuego
  west: -120,     // Aproximadamente Baja California
  east: -34,      // Atlántico (Brasil)
} as const;

// Convertir a formato de Mapbox: [west, south, east, north]
export const LATAM_BOUNDS_ARRAY: [number, number, number, number] = [
  LATAM_BOUNDS.west,
  LATAM_BOUNDS.south,
  LATAM_BOUNDS.east,
  LATAM_BOUNDS.north,
];