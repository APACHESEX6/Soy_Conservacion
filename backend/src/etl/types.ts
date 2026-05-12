export type ObservationOrigin = "drive" | "inaturalist";

export interface RawObservationRecord {
  origin: ObservationOrigin;
  externalId: string;
  sourceName: string;
  observedAt: Date | null;
  username: string;
  scientificName: string;
  taxonomicGroupRaw: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  photoUrl: string | null;
  audioUrl: string | null;
  inaturalistUrl: string | null;
  qualityGrade: string | null;
  license: string | null;
}

export interface NormalizedObservationRecord extends RawObservationRecord {
  username: string;
  scientificName: string;
  taxonomicGroupDisplay: string;
}

export interface IngestSummary {
  source: ObservationOrigin;
  totalRead: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}
