export type LngLat = {
  lng: number;
  lat: number;
};

export type MapViewProps = {
  className?: string;
  center?: LngLat;
  zoom?: number;
  isUIHidden?: boolean;
  selectedGroup?: string | null;
  source?: "all" | "drive" | "inaturalist";
};

export type ObservationSource = "drive" | "inaturalist";
export type Bbox = [number, number, number, number];

export type TaxonomicGroup = {
  idGrupo: number;
  nombre: string;
  total: number;
  drive: number;
  inaturalist: number;
};

export type ObservationPointProperties = {
  source: ObservationSource;
  externalId: string;
  observedAt: string;
  username: string;
  scientificName: string;
  taxonomicGroup: string;
  accuracy: number | null;
};

export type ObservationFeature = {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: ObservationPointProperties;
};

export type ObservationFeatureCollection = {
  type: "FeatureCollection";
  features: ObservationFeature[];
};

export type ObservationGeoJsonResponse = {
  ok: true;
  data: ObservationFeatureCollection;
  meta: {
    source: "all" | ObservationSource;
    limit: number;
    requestedLimit?: number;
    total: number;
    drive: number;
    inaturalist: number;
    spreadApplied?: boolean;
    /** true cuando la query usó ST_Intersects sobre el índice GIST de PostGIS (bbox presente). */
    postgisUsed?: boolean;
    timingsMs?: {
      db: number;
      transform: number;
      total: number;
    };
    bboxApplied: Bbox | null;
    timestamp: string;
  };
};
