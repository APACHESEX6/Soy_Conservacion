import type { LngLat } from "../types/map.types";

export type MapStyle = "terrain" | "satellite";

export const MAP_STYLES: Record<MapStyle, string> = {
  terrain: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export const MAP_STYLE = MAP_STYLES.terrain;

// Centro visual óptimo para mostrar Colombia centrada con Centroamérica visible arriba
export const DEFAULT_CENTER: LngLat = {
  lng: -74.0, // Colombia más centrada horizontalmente
  lat: 7.0, // Más al norte para ver Centroamérica en la parte superior
};

// Centro geográfico real de los datos de observaciones (Valle del Cauca, Colombia)
export const DATA_CENTER: LngLat = {
  lng: -75.83,
  lat: 4.32,
};

// Zoom al que se navega al hacer click en el marcador de entrada.
// Zoom 8 muestra claramente los clusters sin romperlos todavía.
export const DATA_ENTRY_ZOOM = 8;

// Por encima de este zoom el marcador de entrada se oculta (ya se ven los clusters)
export const DATA_MARKER_HIDE_ZOOM = 6;

export const DEFAULT_ZOOM = 3.5;
export const MIN_ZOOM = 3;
// zoom 18: tiles suficientemente detallados para observaciones de campo.
// zoom 19 pesa ~4x más que zoom 18 sin aportar información útil adicional.
export const MAX_ZOOM = 18;

// Límites geográficos de América (Norteamérica, Centroamérica y Sudamérica)
// Formato: [west, south, east, north]
// Límites geográficos de Latinoamérica (excluyendo EE.UU.)
export const LATAM_BOUNDS = {
  north: 32, // Frontera sur de EE. UU.
  south: -56, // Tierra del Fuego
  west: -120, // Aproximadamente Baja California
  east: -34, // Atlántico (Brasil)
} as const;

// Convertir a formato de Mapbox: [west, south, east, north]
export const LATAM_BOUNDS_ARRAY: [number, number, number, number] = [
  LATAM_BOUNDS.west,
  LATAM_BOUNDS.south,
  LATAM_BOUNDS.east,
  LATAM_BOUNDS.north,
];
