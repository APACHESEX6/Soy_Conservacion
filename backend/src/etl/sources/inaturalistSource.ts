import { env } from "../../config/env";
import type { RawObservationRecord } from "../types";

interface INaturalistTaxon {
  name?: string;
  iconic_taxon_name?: string;
}

interface INaturalistUser {
  login?: string;
}

interface INaturalistPhoto {
  url?: string;
}

interface INaturalistSound {
  file_url?: string;
}

interface INaturalistObservation {
  id?: number;
  observed_on_string?: string;
  time_observed_at?: string;
  observed_on?: string;
  created_at?: string;
  uri?: string;
  quality_grade?: string;
  license?: string;
  license_code?: string;
  user?: INaturalistUser;
  taxon?: INaturalistTaxon;
  geojson?: {
    coordinates?: [number, number];
  };
  positional_accuracy?: number;
  photos?: INaturalistPhoto[];
  sounds?: INaturalistSound[];
}

interface INaturalistResponse {
  results?: INaturalistObservation[];
}

const toDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const parseRetryAfterMs = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const asSeconds = Number(value);
  if (Number.isFinite(asSeconds)) {
    return Math.max(0, Math.floor(asSeconds * 1000));
  }

  const asDateMs = Date.parse(value);
  if (!Number.isNaN(asDateMs)) {
    return Math.max(0, asDateMs - Date.now());
  }

  return null;
};

const computeBackoffMs = (attempt: number, retryAfterMs: number | null): number => {
  const base = Math.min(4000, 400 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 200);
  const backoff = base + jitter;
  return retryAfterMs ? Math.max(backoff, retryAfterMs) : backoff;
};

const fetchWithRetry = async (
  url: string,
  attempts: number,
  timeoutMs: number,
): Promise<Response> => {
  let lastError: unknown;
  const userAgent = env.INAT_USER_AGENT ?? "soy-conservacion-backend/1.0";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return response;
      }

      const retriable = response.status >= 500 || response.status === 429;
      if (!retriable || attempt === attempts) {
        throw new Error(`INaturalist API respondio con estado ${response.status}`);
      }

      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      await sleep(computeBackoffMs(attempt, retryAfterMs));
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      await sleep(computeBackoffMs(attempt, null));
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("No fue posible consultar iNaturalist");
};

const windowIsoDate = (): string => {
  const pollMinutes = Number(env.INAT_LOOKBACK_MINUTES ?? 120);
  const lookback = Number.isFinite(pollMinutes) && pollMinutes > 0 ? pollMinutes : 120;
  return new Date(Date.now() - lookback * 60_000).toISOString();
};

const isFullSync = (): boolean => env.INAT_FULL_SYNC;

const buildRequestUrl = (page: number): string => {
  const baseUrl = env.INAT_API_BASE_URL ?? "https://api.inaturalist.org/v1";
  const perPage = Number(env.INAT_PER_PAGE ?? 200);
  const sanitizedPerPage = Number.isFinite(perPage) ? Math.min(200, Math.max(1, perPage)) : 200;
  const projectId = env.INAT_PROJECT_ID ?? "";

  if (!projectId) {
    throw new Error("INAT_PROJECT_ID no esta definido en variables de entorno");
  }

  // No se filtra por quality_grade ni license en la URL porque la lógica de
  // inclusión es un OR: se acepta cualquier observación que sea "research" O
  // que tenga una licencia abierta permitida (CC-BY, CC-BY-NC, CC-BY-SA).
  // Filtrar en la API descartaría observaciones válidas que cumplen solo una
  // de las dos condiciones, por lo que el filtrado se aplica en isAllowedINaturalistObservation.
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(sanitizedPerPage),
    order: "desc",
    order_by: "observed_on",
    project_id: projectId,
  });

  if (!isFullSync()) {
    params.set("updated_since", windowIsoDate());
  }

  return `${baseUrl}/observations?${params.toString()}`;
};

const ALLOWED_INAT_LICENSES = new Set(["cc-by", "cc-by-nc", "cc-by-sa"]);

const getInaturalistLicense = (obs: INaturalistObservation): string | undefined => {
  return obs.license?.toLowerCase() ?? obs.license_code?.toLowerCase();
};

/**
 * Determina si una observación de iNaturalist debe ser incluida en la ingesta.
 *
 * Regla de inclusión (OR):
 *   - quality_grade === "research"  → verificada por la comunidad, siempre incluir.
 *   - licencia ∈ {cc-by, cc-by-nc, cc-by-sa} → uso permitido independientemente del grado.
 *
 * Una observación que cumpla al menos una de las dos condiciones es aceptada.
 * Se rechaza únicamente si no es "research" Y no tiene licencia abierta permitida.
 */
const isAllowedINaturalistObservation = (obs: INaturalistObservation): boolean => {
  const isResearch = obs.quality_grade?.toLowerCase() === "research";
  const license = getInaturalistLicense(obs);
  const hasAllowedLicense = typeof license === "string" && ALLOWED_INAT_LICENSES.has(license);

  return isResearch || hasAllowedLicense;
};

const mapObservation = (obs: INaturalistObservation): RawObservationRecord | null => {
  if (!isAllowedINaturalistObservation(obs)) {
    return null;
  }

  const externalId = obs.id ? String(obs.id) : "";
  if (!externalId) {
    return null;
  }

  const lat = obs.geojson?.coordinates?.[1];
  const lng = obs.geojson?.coordinates?.[0];
  const photoUrl = obs.photos?.[0]?.url?.replace("square", "large");

  return {
    origin: "inaturalist",
    externalId,
    sourceName: "iNaturalist",
    // Prioridad de fecha: time_observed_at → observed_on_string → observed_on → created_at
    // Las observaciones sin ninguna fecha de observación usan created_at como fallback
    // para no perder registros válidos con coordenadas y especie.
    observedAt: toDate(
      obs.time_observed_at ?? obs.observed_on_string ?? obs.observed_on ?? obs.created_at,
    ),
    username: obs.user?.login ?? "Usuario iNaturalist",
    scientificName: obs.taxon?.name ?? "Sin Especie",
    taxonomicGroupRaw: obs.taxon?.iconic_taxon_name ?? null,
    latitude: typeof lat === "number" ? lat : null,
    longitude: typeof lng === "number" ? lng : null,
    altitude: null,
    accuracy: typeof obs.positional_accuracy === "number" ? obs.positional_accuracy : null,
    photoUrl: photoUrl ?? null,
    audioUrl: obs.sounds?.[0]?.file_url ?? null,
    inaturalistUrl: obs.uri ?? null,
    qualityGrade: obs.quality_grade ?? null,
    license: getInaturalistLicense(obs) ?? null,
  };
};

export const readINaturalistRecords = async (): Promise<RawObservationRecord[]> => {
  // Soporta INAT_MAX_PAGES=all o INAT_MAX_PAGES=* para paginar todo el dataset
  const maxPagesEnv = String(env.INAT_MAX_PAGES ?? 3);
  const fetchAll = maxPagesEnv === "all" || maxPagesEnv === "*";
  const maxPages = fetchAll ? Number.POSITIVE_INFINITY : Number(maxPagesEnv);
  const pages = Number.isFinite(maxPages) && maxPages > 0 ? maxPages : 3;

  const retriesRaw = Number(env.INAT_HTTP_RETRIES ?? 3);
  const retries = Number.isFinite(retriesRaw) ? Math.min(5, Math.max(1, retriesRaw)) : 3;
  const timeoutRaw = Number(env.INAT_HTTP_TIMEOUT_MS ?? 15000);
  const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(1000, timeoutRaw) : 15000;

  const records: RawObservationRecord[] = [];
  let page = 1;

  while (page <= pages) {
    const response = await fetchWithRetry(buildRequestUrl(page), retries, timeoutMs);

    const payload = (await response.json()) as INaturalistResponse;
    const observations = payload.results ?? [];

    if (observations.length === 0) {
      console.log(`[iNaturalist] Fetch completo: ${page - 1} páginas, ${records.length} registros`);
      break;
    }

    for (const item of observations) {
      const mapped = mapObservation(item);
      if (mapped) {
        records.push(mapped);
      }
    }

    console.log(
      `[iNaturalist] Página ${page}: ${observations.length} observaciones, total: ${records.length}`,
    );
    page += 1;
  }

  return records;
};
