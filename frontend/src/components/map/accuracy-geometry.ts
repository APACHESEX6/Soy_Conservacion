/**
 * accuracy-geometry.ts
 *
 * Utilidades puras para construir la geometría del anillo de precisión GPS
 * que se superpone sobre el mapa cuando se selecciona una observación.
 *
 * Separado de MapView para mantener la lógica geométrica aislada y testeable.
 */

/**
 * Genera los vértices de un polígono circular aproximado centrado en `center`
 * con radio `radiusMeters`, usando proyección equirectangular local.
 *
 * @param center       - [lng, lat] del centro del anillo.
 * @param radiusMeters - Radio en metros.
 * @param segments     - Número de segmentos del polígono (mínimo 12).
 */
const toAccuracyRingCoordinates = (
  center: [number, number],
  radiusMeters: number,
  segments = 56,
): [number, number][] => {
  const [centerLng, centerLat] = center;
  const points: [number, number][] = [];
  const safeSegments = Math.max(12, segments);

  // Factores de conversión metros → grados en latitud y longitud
  const latFactor = 111_320;
  const lngFactor = Math.max(111_320 * Math.cos((centerLat * Math.PI) / 180), 1e-8);

  for (let i = 0; i <= safeSegments; i += 1) {
    const angle = (2 * Math.PI * i) / safeSegments;
    const lat = centerLat + (radiusMeters * Math.sin(angle)) / latFactor;
    const lng = centerLng + (radiusMeters * Math.cos(angle)) / lngFactor;
    points.push([lng, lat]);
  }

  return points;
};

/**
 * Construye un GeoJSON FeatureCollection con un único polígono circular
 * que representa el radio de precisión GPS de una observación.
 *
 * @param center        - [lng, lat] del centro.
 * @param accuracyMeters - Radio de precisión en metros.
 */
export const buildAccuracyCollection = (
  center: [number, number],
  accuracyMeters: number,
): GeoJSON.FeatureCollection<GeoJSON.Polygon> => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { accuracy: accuracyMeters },
      geometry: {
        type: "Polygon",
        coordinates: [toAccuracyRingCoordinates(center, accuracyMeters)],
      },
    },
  ],
});
