import { env } from "../config/env";
import type {
  Bbox,
  ObservationFeatureCollection,
  ObservationGeoJsonResponse,
  ObservationPointProperties,
} from "../types/map.types";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidSource = (value: unknown): value is ObservationPointProperties["source"] =>
  value === "drive" || value === "inaturalist";

const isObservationProperties = (value: unknown): value is ObservationPointProperties => {
  if (!isObject(value)) {
    return false;
  }

  return (
    isValidSource(value.source) &&
    typeof value.externalId === "string" &&
    typeof value.observedAt === "string" &&
    typeof value.username === "string" &&
    typeof value.scientificName === "string" &&
    typeof value.taxonomicGroup === "string" &&
    (value.accuracy === null || typeof value.accuracy === "number")
  );
};

// Validación rápida: comprueba la forma de la coleccción y el primer feature.
// Validar cada feature de un array de miles de items bloquea el hilo principal O(n).
// El servidor es la fuente de verdad; sampleamos solo el primero.
const isObservationFeatureCollection = (value: unknown): value is ObservationFeatureCollection => {
  if (!isObject(value) || value.type !== "FeatureCollection" || !Array.isArray(value.features)) {
    return false;
  }

  const first = value.features[0];
  if (first === undefined) {
    // Coleccción vacía: válida
    return true;
  }

  if (!isObject(first) || first.type !== "Feature") {
    return false;
  }

  const geo = first.geometry as Record<string, unknown> | null;
  if (
    !isObject(geo) ||
    geo.type !== "Point" ||
    !Array.isArray(geo.coordinates) ||
    geo.coordinates.length !== 2
  ) {
    return false;
  }

  return isObservationProperties(first.properties);
};

const isResponse = (value: unknown): value is ObservationGeoJsonResponse => {
  if (!isObject(value) || value.ok !== true || !isObject(value.meta)) {
    return false;
  }

  const meta = value.meta as Record<string, unknown>;
  const source = meta.source;
  const validSource = source === "all" || source === "drive" || source === "inaturalist";

  return (
    isObservationFeatureCollection(value.data) &&
    validSource &&
    typeof meta.limit === "number" &&
    (meta.requestedLimit === undefined || typeof meta.requestedLimit === "number") &&
    typeof meta.total === "number" &&
    typeof meta.drive === "number" &&
    typeof meta.inaturalist === "number" &&
    (meta.timestamp === undefined || typeof meta.timestamp === "string")
  );
};

export const fetchObservationGeoJson = async (options?: {
  bbox?: Bbox;
  limit?: number;
  signal?: AbortSignal;
}): Promise<ObservationGeoJsonResponse> => {
  const params = new URLSearchParams({
    source: "all",
    limit: String(options?.limit ?? 3000),
  });

  if (options?.bbox) {
    params.set("bbox", options.bbox.join(","));
  }

  const endpoint = `${API_BASE_URL}/api/observaciones/geojson?${params.toString()}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: options?.signal,
    // Permitir que el browser use el caché HTTP cuando el servidor envíe Cache-Control.
    // Antes 'no-store' forzaba un viaje a la red en cada petición.
    cache: "default",
  });

  if (!response.ok) {
    throw new Error(`No fue posible cargar observaciones: HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isResponse(payload)) {
    throw new Error("La respuesta del backend no tiene el formato esperado");
  }

  return payload;
};
