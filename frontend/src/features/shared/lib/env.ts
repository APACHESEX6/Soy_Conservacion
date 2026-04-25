export function getMapboxToken() {
  const value = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!value) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_MAPBOX_TOKEN");
  }

  return value;
}