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
  uri?: string;
  quality_grade?: string;
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

const fetchWithRetry = async (
  url: string,
  attempts: number,
  timeoutMs: number,
): Promise<Response> => {
  let lastError: unknown;

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

      await sleep(attempt * 400);
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      await sleep(attempt * 400);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("No fue posible consultar iNaturalist");
};

const windowIsoDate = (): string => {
  const pollMinutes = Number(process.env.INAT_LOOKBACK_MINUTES ?? 120);
  const lookback = Number.isFinite(pollMinutes) && pollMinutes > 0 ? pollMinutes : 120;
  return new Date(Date.now() - lookback * 60_000).toISOString();
};

const isFullSync = (): boolean => (process.env.INAT_FULL_SYNC ?? "false") === "true";

const buildRequestUrl = (page: number): string => {
  const baseUrl = process.env.INAT_API_BASE_URL ?? "https://api.inaturalist.org/v1";
  const perPage = Number(process.env.INAT_PER_PAGE ?? 200);
  const sanitizedPerPage = Number.isFinite(perPage) ? Math.min(200, Math.max(1, perPage)) : 200;
  const projectId = process.env.INAT_PROJECT_ID ?? "";

  if (!projectId) {
    throw new Error("INAT_PROJECT_ID no esta definido en variables de entorno");
  }

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

const mapObservation = (obs: INaturalistObservation): RawObservationRecord | null => {
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
    observedAt: toDate(obs.time_observed_at ?? obs.observed_on_string ?? obs.observed_on),
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
  };
};

export const readINaturalistRecords = async (): Promise<RawObservationRecord[]> => {
  const maxPages = Number(process.env.INAT_MAX_PAGES ?? 3);
  const pages = Number.isFinite(maxPages) && maxPages > 0 ? maxPages : 3;
  const retriesRaw = Number(process.env.INAT_HTTP_RETRIES ?? 3);
  const retries = Number.isFinite(retriesRaw) ? Math.min(5, Math.max(1, retriesRaw)) : 3;
  const timeoutRaw = Number(process.env.INAT_HTTP_TIMEOUT_MS ?? 15000);
  const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(1000, timeoutRaw) : 15000;

  const records: RawObservationRecord[] = [];

  for (let page = 1; page <= pages; page += 1) {
    const response = await fetchWithRetry(buildRequestUrl(page), retries, timeoutMs);

    const payload = (await response.json()) as INaturalistResponse;
    const observations = payload.results ?? [];
    if (observations.length === 0) {
      break;
    }

    for (const item of observations) {
      const mapped = mapObservation(item);
      if (mapped) {
        records.push(mapped);
      }
    }
  }

  return records;
};
