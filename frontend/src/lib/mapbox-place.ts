import { getMapboxToken } from "../config/env";

const placeNameCache = new Map<string, string | null>();

const roundCoord = (value: number): number => Number(value.toFixed(3));
const PLACE_CACHE_VERSION = "v2";

type MapboxFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  place_type?: string[];
  context?: Array<{ id?: string; text?: string }>;
};

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildPremiumLabel = (
  city: string | null,
  region: string | null,
  country: string | null,
): string => {
  const parts: string[] = [];

  const normalizedCountry = country ? toTitleCase(country.trim()) : "Colombia";
  parts.push(normalizedCountry);

  if (region) {
    const normalizedRegion = toTitleCase(region.trim());
    if (normalizedRegion.toLowerCase() !== normalizedCountry.toLowerCase()) {
      parts.push(normalizedRegion);
    }
  }

  if (city) {
    const normalizedCity = toTitleCase(city.trim());
    // Evitar duplicados si la ciudad tiene el mismo nombre que el país o la región
    const alreadyIncluded = parts.some((p) => p.toLowerCase() === normalizedCity.toLowerCase());
    if (!alreadyIncluded) {
      parts.push(normalizedCity);
    }
  }

  return parts.join(", ");
};

export const getPlaceLabel = async (
  lng: number,
  lat: number,
  signal?: AbortSignal,
): Promise<string | null> => {
  const cacheKey = `${PLACE_CACHE_VERSION}:${roundCoord(lng)}|${roundCoord(lat)}`;
  if (placeNameCache.has(cacheKey)) {
    return placeNameCache.get(cacheKey) ?? null;
  }

  try {
    const token = getMapboxToken();
    const params = new URLSearchParams({
      types: "place,locality", // Solo ciudades o localidades, evitar direcciones
      language: "es",
      limit: "1",
      access_token: token,
    });

    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`;
    const response = await fetch(endpoint, {
      method: "GET",
      signal,
      cache: "force-cache",
    });

    if (!response.ok) return "Colombia";

    const payload = (await response.json()) as { features?: MapboxFeature[] };
    const features = payload.features ?? [];

    if (features.length === 0) return "Colombia";

    const feature = features[0];
    if (!feature) return "Colombia";
    const city = feature.text?.trim() ?? null;

    // El país y la región suelen estar en el contexto
    const country =
      feature.context?.find((c) => c.id?.startsWith("country"))?.text?.trim() ?? "Colombia";
    const region = feature.context?.find((c) => c.id?.startsWith("region"))?.text?.trim() ?? null;

    const label = buildPremiumLabel(city, region, country);
    console.info(`[mapbox-place] Resolved (${lng}, ${lat}) -> ${label}`);

    placeNameCache.set(cacheKey, label);
    return label;
  } catch (error) {
    console.warn("[mapbox-place] Error resolving place:", error);
    return "Colombia";
  }
};
