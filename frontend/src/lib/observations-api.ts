import { getApiBaseUrl } from "../lib/env";
import type {
  Bbox,
  ObservationDateBoundsResponse,
  ObservationFeatureCollection,
  ObservationGeoJsonResponse,
  ObservationPointProperties,
  TaxonomicGroup,
} from "../types/map.types";

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
    typeof meta.timestamp === "string"
  );
};

const isTaxonomicGroup = (value: unknown): value is TaxonomicGroup => {
  if (!isObject(value)) {
    return false;
  }
  return (
    typeof value.idGrupo === "number" &&
    typeof value.nombre === "string" &&
    typeof value.total === "number" &&
    typeof value.drive === "number" &&
    typeof value.inaturalist === "number"
  );
};

const isGroupsResponse = (
  value: unknown,
): value is { ok: true; data: TaxonomicGroup[]; total: number; timestamp: string } => {
  if (!isObject(value) || value.ok !== true || !Array.isArray(value.data)) {
    return false;
  }
  return (
    value.data.every(isTaxonomicGroup) &&
    typeof value.total === "number" &&
    typeof value.timestamp === "string"
  );
};

export const fetchObservationGeoJson = async (options?: {
  bbox?: Bbox;
  limit?: number;
  group?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  signal?: AbortSignal;
  source?: "all" | "drive" | "inaturalist";
}): Promise<ObservationGeoJsonResponse> => {
  const params = new URLSearchParams({
    source: options?.source ?? "all",
    limit: String(options?.limit ?? 3000),
  });

  if (options?.bbox) {
    params.set("bbox", options.bbox.join(","));
  }

  if (options?.group) {
    params.set("group", options.group);
  }

  if (options?.dateFrom) {
    params.set("dateFrom", options.dateFrom);
  }

  if (options?.dateTo) {
    params.set("dateTo", options.dateTo);
  }

  const endpoint = `${getApiBaseUrl()}/api/observaciones/geojson?${params.toString()}`;

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

export const fetchTaxonomicGroups = async (options?: {
  dateFrom?: string | null;
  dateTo?: string | null;
  source?: "all" | "drive" | "inaturalist";
}): Promise<TaxonomicGroup[]> => {
  const params = new URLSearchParams({
    source: options?.source ?? "all",
  });

  if (options?.dateFrom) {
    params.set("dateFrom", options.dateFrom);
  }

  if (options?.dateTo) {
    params.set("dateTo", options.dateTo);
  }

  const endpoint = `${getApiBaseUrl()}/api/observaciones/groups?${params.toString()}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "default",
  });

  if (!response.ok) {
    throw new Error(`No fue posible cargar grupos taxonómicos: HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isGroupsResponse(payload)) {
    throw new Error("La respuesta del backend no tiene el formato esperado");
  }

  return payload.data;
};

export const fetchObservationDateBounds = async (): Promise<
  ObservationDateBoundsResponse["data"]
> => {
  const endpoint = `${getApiBaseUrl()}/api/observaciones/date-bounds`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "default",
  });

  if (!response.ok) {
    throw new Error(`No fue posible cargar los límites de fecha: HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!isObject(payload) || payload.ok !== true || !isObject(payload.data)) {
    throw new Error("La respuesta del backend no tiene el formato esperado");
  }

  const data = payload.data as Record<string, unknown>;
  if (
    (data.minDate !== null && typeof data.minDate !== "string") ||
    (data.maxDate !== null && typeof data.maxDate !== "string")
  ) {
    throw new Error("La respuesta del backend no tiene el formato esperado");
  }

  return {
    minDate: data.minDate ?? null,
    maxDate: data.maxDate ?? null,
  };
};
