import { getMapboxToken } from "../lib/env";

const placeNameCache = new Map<string, string | null>();

const roundCoord = (value: number): number => Number(value.toFixed(3));

export const getPlaceLabel = async (
  lng: number,
  lat: number,
  signal?: AbortSignal,
): Promise<string | null> => {
  const cacheKey = `${roundCoord(lng)}|${roundCoord(lat)}`;
  if (placeNameCache.has(cacheKey)) {
    return placeNameCache.get(cacheKey) ?? null;
  }

  const token = getMapboxToken();
  const params = new URLSearchParams({
    types: "place,locality,neighborhood",
    language: "es",
    limit: "1",
    access_token: token,
  });

  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`;
  const response = await fetch(endpoint, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No fue posible resolver el lugar: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as { features?: Array<{ place_name?: string }> };
  const label = payload.features?.[0]?.place_name?.split(",")[0]?.trim() ?? null;
  placeNameCache.set(cacheKey, label);
  return label;
};
