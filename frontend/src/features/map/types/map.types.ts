export type LngLat = {
  lng: number;
  lat: number;
};

export type MapViewProps = {
  className?: string;
  center?: LngLat;
  zoom?: number;
};
