export function getMapboxToken() {
  const value = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!value) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_MAPBOX_TOKEN");
  }

  return value;
}

export function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!value) {
    return "http://localhost:4000";
  }

  return value.replace(/\/$/, "");
}
