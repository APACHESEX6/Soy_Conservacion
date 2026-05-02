import { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/prisma";

type SourceFilter = "all" | "drive" | "inaturalist";
type ObservationSource = "drive" | "inaturalist";
type Bbox = [number, number, number, number];

type GroupFilter = {
  groupName: string | null;
  groupId: number | null;
  hasInvalidGroupId: boolean;
};

type DateRangeFilter = {
  fromValue: string | null;
  toValue: string | null;
  from: Date | null;
  to: Date | null;
  hasInvalidRange: boolean;
};

interface GeoPointProperties {
  source: ObservationSource;
  externalId: string;
  observedAt: string;
  username: string;
  scientificName: string;
  taxonomicGroup: string;
  accuracy: number | null;
}

interface GeoPointFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: GeoPointProperties;
}

interface GeoPointFeatureCollection {
  type: "FeatureCollection";
  features: GeoPointFeature[];
}

interface DatedFeature {
  feature: GeoPointFeature;
  observedAtMs: number;
}

type GeoJsonCacheEntry = {
  body: string;
  etag: string;
  expiresAt: number;
  createdAt: number;
};

type GroupSummaryRow = {
  idGrupo: number;
  nombre: string;
  total: number;
  drive: number;
  inaturalist: number;
};

type DateBoundsRow = {
  minDate: Date | null;
  maxDate: Date | null;
};

type GeoQueryRow = {
  externalId: string;
  observedAt: Date;
  latitud: number | null;
  longitud: number | null;
  accuracy: number | null;
  username: string;
  scientificName: string;
  taxonomicGroup: string;
};

const GEOJSON_CACHE_ENABLED = (process.env.OBS_GEOJSON_CACHE_ENABLED ?? "true") === "true";
const GEOJSON_USE_POSTGIS = (process.env.OBS_GEOJSON_USE_POSTGIS ?? "true") === "true";
const GEOJSON_CACHE_TTL_MS = (() => {
  const raw = Number(process.env.OBS_GEOJSON_CACHE_TTL_MS ?? 60_000);
  if (!Number.isFinite(raw)) return 60_000;
  return Math.min(300_000, Math.max(5_000, Math.floor(raw)));
})();
const GEOJSON_CACHE_MAX = (() => {
  const raw = Number(process.env.OBS_GEOJSON_CACHE_MAX ?? 200);
  if (!Number.isFinite(raw)) return 200;
  return Math.min(1000, Math.max(20, Math.floor(raw)));
})();
const GEOJSON_CACHE = new Map<string, GeoJsonCacheEntry>();

const pruneGeojsonCache = (now: number): void => {
  for (const [key, entry] of GEOJSON_CACHE.entries()) {
    if (entry.expiresAt <= now) {
      GEOJSON_CACHE.delete(key);
    }
  }

  while (GEOJSON_CACHE.size > GEOJSON_CACHE_MAX) {
    const oldestKey = GEOJSON_CACHE.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    GEOJSON_CACHE.delete(oldestKey);
  }
};

const buildGeojsonCacheKey = (
  source: SourceFilter,
  limit: number,
  spread: boolean,
  bbox: Bbox | null,
  groupFilter: GroupFilter,
  dateFilter: DateRangeFilter,
): string => {
  const groupKey =
    groupFilter.groupId !== null
      ? `id:${groupFilter.groupId}`
      : groupFilter.groupName !== null
        ? `name:${groupFilter.groupName}`
        : "none";
  const dateKey =
    dateFilter.fromValue !== null || dateFilter.toValue !== null
      ? `${dateFilter.fromValue ?? "none"}:${dateFilter.toValue ?? "none"}`
      : "none";

  if (!bbox) {
    return `${source}|${limit}|${spread ? 1 : 0}|none|${groupKey}|${dateKey}`;
  }

  const bboxKey = bbox.map((value) => value.toFixed(6)).join(",");
  return `${source}|${limit}|${spread ? 1 : 0}|${bboxKey}|${groupKey}|${dateKey}`;
};

const matchesEtag = (ifNoneMatch: string | string[] | undefined, etag: string): boolean => {
  if (!ifNoneMatch) {
    return false;
  }

  if (Array.isArray(ifNoneMatch)) {
    return ifNoneMatch.some((value) => value.trim() === etag);
  }

  return ifNoneMatch
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === etag);
};

const metersToDegrees = (
  lng: number,
  lat: number,
  meters: number,
  radians: number,
): [number, number] => {
  const deltaLat = (meters * Math.sin(radians)) / 111320;
  const denominator = 111320 * Math.cos((lat * Math.PI) / 180);
  const deltaLng = denominator === 0 ? 0 : (meters * Math.cos(radians)) / denominator;
  return [lng + deltaLng, lat + deltaLat];
};

const spreadOverlappingPoints = (features: GeoPointFeature[]): GeoPointFeature[] => {
  const groups = new Map<string, number[]>();

  features.forEach((feature, index) => {
    const [lng, lat] = feature.geometry.coordinates;
    const key = `${lng.toFixed(6)}|${lat.toFixed(6)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(index);
      return;
    }

    groups.set(key, [index]);
  });

  const nextFeatures = [...features];
  const pointsPerRing = 10;

  for (const indexes of groups.values()) {
    if (indexes.length <= 1) {
      continue;
    }

    indexes.forEach((featureIndex, idxInGroup) => {
      if (idxInGroup === 0) {
        return;
      }

      const ring = Math.floor((idxInGroup - 1) / pointsPerRing) + 1;
      const position = (idxInGroup - 1) % pointsPerRing;
      const angle = ((2 * Math.PI) / pointsPerRing) * position + ring * 0.17;
      const radiusMeters = 5 + ring * 5;
      const current = nextFeatures[featureIndex];
      if (!current) {
        return;
      }

      const [lng, lat] = current.geometry.coordinates;
      const [newLng, newLat] = metersToDegrees(lng, lat, radiusMeters, angle);

      nextFeatures[featureIndex] = {
        ...current,
        geometry: {
          ...current.geometry,
          coordinates: [newLng, newLat],
        },
      };
    });
  }

  return nextFeatures;
};

const router = Router();

const SOURCE_VALUES: SourceFilter[] = ["all", "drive", "inaturalist"];
// Cache-Control: max-age=60 sincronizado con GEOJSON_CACHE_TTL_MS (60s).
// stale-while-revalidate=300 permite servir stale hasta 5 min mientras revalida.
const CACHE_CONTROL_HEADER = "public, max-age=60, stale-while-revalidate=300";

const parseSourceFilter = (value: unknown): SourceFilter => {
  if (typeof value !== "string") {
    return "all";
  }

  const normalized = value.trim().toLowerCase() as SourceFilter;
  if (SOURCE_VALUES.includes(normalized)) {
    return normalized;
  }

  return "all";
};

const parseLimit = (value: unknown): number => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return 5000;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 5000;
  }

  return Math.min(20000, Math.max(1, Math.floor(parsed)));
};

const parseBooleanFlag = (value: unknown): boolean => {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

const parseGroupFilter = (groupValue: unknown, groupIdValue: unknown): GroupFilter => {
  const groupName =
    typeof groupValue === "string" && groupValue.trim().length > 0 ? groupValue.trim() : null;

  if (typeof groupIdValue !== "string" || groupIdValue.trim().length === 0) {
    return {
      groupName,
      groupId: null,
      hasInvalidGroupId: false,
    };
  }

  const parsedGroupId = Number(groupIdValue);
  if (!Number.isInteger(parsedGroupId) || parsedGroupId <= 0) {
    return {
      groupName,
      groupId: null,
      hasInvalidGroupId: true,
    };
  }

  return {
    groupName,
    groupId: parsedGroupId,
    hasInvalidGroupId: false,
  };
};

const parseDateValue = (value: unknown, startOfDay: boolean): Date | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  const date = new Date(`${normalized}T${startOfDay ? "00:00:00.000" : "23:59:59.999"}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateRangeFilter = (fromValue: unknown, toValue: unknown): DateRangeFilter => {
  const normalizedFromValue =
    typeof fromValue === "string" && fromValue.trim().length > 0 ? fromValue.trim() : null;
  const normalizedToValue =
    typeof toValue === "string" && toValue.trim().length > 0 ? toValue.trim() : null;
  const from = parseDateValue(normalizedFromValue, true);
  const to = parseDateValue(normalizedToValue, false);

  const hasInvalidRange =
    (normalizedFromValue !== null && from === null) ||
    (normalizedToValue !== null && to === null) ||
    (normalizedFromValue !== null &&
      normalizedToValue !== null &&
      normalizedFromValue > normalizedToValue);

  return {
    fromValue: normalizedFromValue,
    toValue: normalizedToValue,
    from,
    to,
    hasInvalidRange,
  };
};

const parseBbox = (value: unknown): Bbox | null => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parts = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));

  if (parts.length !== 4) {
    return null;
  }

  const [minLng, minLat, maxLng, maxLat] = parts as Bbox;

  const isValidRange =
    minLng >= -180 &&
    maxLng <= 180 &&
    minLat >= -90 &&
    maxLat <= 90 &&
    minLng <= maxLng &&
    minLat <= maxLat;

  if (!isValidRange) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
};

type CoordinateWhere = ReturnType<typeof buildCoordinateWhere>;

const buildCoordinateWhere = (bbox: Bbox | null) => {
  if (!bbox) {
    return {
      latitud: { not: null as null | number },
      longitud: { not: null as null | number },
    };
  }

  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    latitud: {
      not: null as null | number,
      gte: minLat,
      lte: maxLat,
    },
    longitud: {
      not: null as null | number,
      gte: minLng,
      lte: maxLng,
    },
  };
};

const buildDateWhere = (dateFilter: DateRangeFilter) => {
  if (dateFilter.from === null && dateFilter.to === null) {
    return {};
  }

  return {
    fecha: {
      ...(dateFilter.from !== null ? { gte: dateFilter.from } : {}),
      ...(dateFilter.to !== null ? { lte: dateFilter.to } : {}),
    },
  };
};

const buildDateSqlFilter = (dateFilter: DateRangeFilter, alias: "o" | "i"): Prisma.Sql => {
  const clauses: Prisma.Sql[] = [];

  if (dateFilter.from !== null) {
    clauses.push(
      alias === "o"
        ? Prisma.sql`AND o.fecha >= ${dateFilter.from}`
        : Prisma.sql`AND i.fecha >= ${dateFilter.from}`,
    );
  }

  if (dateFilter.to !== null) {
    clauses.push(
      alias === "o"
        ? Prisma.sql`AND o.fecha <= ${dateFilter.to}`
        : Prisma.sql`AND i.fecha <= ${dateFilter.to}`,
    );
  }

  return clauses.length > 0 ? Prisma.join(clauses, " ") : Prisma.empty;
};

const hasValidCoordinates = (latitude: number | null, longitude: number | null): boolean => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const buildGroupSqlFilter = (groupFilter: GroupFilter): Prisma.Sql => {
  const clauses: Prisma.Sql[] = [];

  if (groupFilter.groupId !== null) {
    clauses.push(Prisma.sql`AND gt.id_grupo = ${groupFilter.groupId}`);
  }

  if (groupFilter.groupName !== null) {
    clauses.push(Prisma.sql`AND gt.nombre = ${groupFilter.groupName}`);
  }

  return clauses.length > 0 ? Prisma.join(clauses, " ") : Prisma.empty;
};

const fetchDriveRows = async (
  coordinateWhere: CoordinateWhere,
  limit: number,
  bbox: Bbox | null,
  usePostgis: boolean,
  groupFilter: GroupFilter,
  dateFilter: DateRangeFilter,
): Promise<GeoQueryRow[]> => {
  const groupSqlFilter = buildGroupSqlFilter(groupFilter);
  const dateSqlFilter = buildDateSqlFilter(dateFilter, "o");

  // Con bbox: usa ST_Intersects sobre el índice GIST → O(log n), máxima precisión PostGIS.
  // Sin bbox: usa Prisma ORM con índice B-Tree en latitud/longitud → suficiente para carga global.
  if (usePostgis && bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return prisma.$queryRaw<GeoQueryRow[]>`
      SELECT
        o.instance_id        AS "externalId",
        o.fecha              AS "observedAt",
        o.latitud            AS "latitud",
        o.longitud           AS "longitud",
        o.accuracy           AS "accuracy",
        u.username           AS "username",
        e.nombre_cientifico  AS "scientificName",
        gt.nombre            AS "taxonomicGroup"
      FROM observaciones o
      JOIN usuarios u        ON o.id_usuario = u.id_usuario
      JOIN especies e        ON o.id_especie = e.id_especie
      JOIN grupo_taxonomico gt ON e.grupo_taxonomico = gt.id_grupo
      WHERE o.geom IS NOT NULL
        AND ST_Intersects(
              o.geom,
              ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
            )
        ${dateSqlFilter}
        ${groupSqlFilter}
      ORDER BY o.fecha DESC
      LIMIT ${limit}
    `;
  }

  const where: Prisma.ObservacionWhereInput = {
    ...coordinateWhere,
    ...buildDateWhere(dateFilter),
    ...(groupFilter.groupId !== null || groupFilter.groupName !== null
      ? {
          AND: [
            ...(groupFilter.groupId !== null
              ? [{ especie: { grupoTaxonomicoId: groupFilter.groupId } }]
              : []),
            ...(groupFilter.groupName !== null
              ? [{ especie: { grupoTaxonomico: { nombre: groupFilter.groupName } } }]
              : []),
          ],
        }
      : {}),
  };

  const rows = await prisma.observacion.findMany({
    where,
    orderBy: { fecha: "desc" },
    take: limit,
    select: {
      instanceId: true,
      fecha: true,
      latitud: true,
      longitud: true,
      accuracy: true,
      usuario: { select: { username: true } },
      especie: {
        select: {
          nombreCientifico: true,
          grupoTaxonomico: { select: { nombre: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    externalId: row.instanceId,
    observedAt: row.fecha,
    latitud: row.latitud,
    longitud: row.longitud,
    accuracy: row.accuracy,
    username: row.usuario.username,
    scientificName: row.especie.nombreCientifico,
    taxonomicGroup: row.especie.grupoTaxonomico.nombre,
  }));
};

const fetchINatRows = async (
  coordinateWhere: CoordinateWhere,
  limit: number,
  bbox: Bbox | null,
  usePostgis: boolean,
  groupFilter: GroupFilter,
  dateFilter: DateRangeFilter,
): Promise<GeoQueryRow[]> => {
  const groupSqlFilter = buildGroupSqlFilter(groupFilter);
  const dateSqlFilter = buildDateSqlFilter(dateFilter, "i");

  // Con bbox: usa ST_Intersects sobre el índice GIST → O(log n), máxima precisión PostGIS.
  // Sin bbox: usa Prisma ORM con índice B-Tree en latitud/longitud → suficiente para carga global.
  if (usePostgis && bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return prisma.$queryRaw<GeoQueryRow[]>`
      SELECT
        i.inaturalist_id     AS "externalId",
        i.fecha              AS "observedAt",
        i.latitud            AS "latitud",
        i.longitud           AS "longitud",
        i.accuracy           AS "accuracy",
        u.username           AS "username",
        e.nombre_cientifico  AS "scientificName",
        gt.nombre            AS "taxonomicGroup"
      FROM inaturalist_observaciones i
      JOIN usuarios u        ON i.id_usuario = u.id_usuario
      JOIN especies e        ON i.id_especie = e.id_especie
      JOIN grupo_taxonomico gt ON i.id_grupo = gt.id_grupo
      WHERE i.geom IS NOT NULL
        AND ST_Intersects(
              i.geom,
              ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
            )
        ${dateSqlFilter}
        ${groupSqlFilter}
      ORDER BY i.fecha DESC
      LIMIT ${limit}
    `;
  }

  const where: Prisma.InaturalistObservacionWhereInput = {
    ...coordinateWhere,
    ...buildDateWhere(dateFilter),
    ...(groupFilter.groupId !== null || groupFilter.groupName !== null
      ? {
          AND: [
            ...(groupFilter.groupId !== null ? [{ grupoTaxonomicoId: groupFilter.groupId }] : []),
            ...(groupFilter.groupName !== null
              ? [{ grupoTaxonomico: { nombre: groupFilter.groupName } }]
              : []),
          ],
        }
      : {}),
  };

  const rows = await prisma.inaturalistObservacion.findMany({
    where,
    orderBy: { fecha: "desc" },
    take: limit,
    select: {
      inaturalistId: true,
      fecha: true,
      latitud: true,
      longitud: true,
      accuracy: true,
      usuario: { select: { username: true } },
      especie: {
        select: {
          nombreCientifico: true,
          grupoTaxonomico: { select: { nombre: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    externalId: row.inaturalistId,
    observedAt: row.fecha,
    latitud: row.latitud,
    longitud: row.longitud,
    accuracy: row.accuracy,
    username: row.usuario.username,
    scientificName: row.especie.nombreCientifico,
    taxonomicGroup: row.especie.grupoTaxonomico.nombre,
  }));
};

const fetchDateBounds = async (): Promise<DateBoundsRow | null> => {
  const [row] = await prisma.$queryRaw<DateBoundsRow[]>`
    SELECT
      MIN(all_dates.fecha) AS "minDate",
      MAX(all_dates.fecha) AS "maxDate"
    FROM (
      SELECT fecha FROM observaciones
      UNION ALL
      SELECT fecha FROM inaturalist_observaciones
    ) AS all_dates
  `;

  return row ?? null;
};

router.get("/date-bounds", async (_req, res) => {
  try {
    const bounds = await fetchDateBounds();

    res.status(200).json({
      ok: true,
      data: {
        minDate: bounds?.minDate ? bounds.minDate.toISOString().slice(0, 10) : null,
        maxDate: bounds?.maxDate ? bounds.maxDate.toISOString().slice(0, 10) : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({
      ok: false,
      error: "No fue posible consultar los límites de fecha",
      detail: message,
    });
  }
});

router.get("/geojson", async (req, res) => {
  const sourceFilter = parseSourceFilter(req.query.source);
  const limit = parseLimit(req.query.limit);
  const bbox = parseBbox(req.query.bbox);
  const spread = parseBooleanFlag(req.query.spread);
  const groupFilter = parseGroupFilter(req.query.group, req.query.groupId);
  const dateFilter = parseDateRangeFilter(req.query.dateFrom, req.query.dateTo);
  const coordinateWhere = buildCoordinateWhere(bbox);
  const startedAt = performance.now();
  const cacheKey = buildGeojsonCacheKey(sourceFilter, limit, spread, bbox, groupFilter, dateFilter);
  const usePostgis = GEOJSON_USE_POSTGIS && bbox !== null;

  if (groupFilter.hasInvalidGroupId) {
    res.status(200).json({
      ok: true,
      data: {
        type: "FeatureCollection",
        features: [],
      },
      meta: {
        source: sourceFilter,
        requestedLimit: limit,
        limit: 0,
        total: 0,
        drive: 0,
        inaturalist: 0,
        spreadApplied: spread,
        postgisUsed: usePostgis,
        timingsMs: {
          db: 0,
          transform: 0,
          total: 0,
        },
        bboxApplied: bbox,
        group: groupFilter.groupName,
        groupId: groupFilter.groupId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (dateFilter.hasInvalidRange) {
    res.status(200).json({
      ok: true,
      data: {
        type: "FeatureCollection",
        features: [],
      },
      meta: {
        source: sourceFilter,
        requestedLimit: limit,
        limit: 0,
        total: 0,
        drive: 0,
        inaturalist: 0,
        spreadApplied: spread,
        postgisUsed: usePostgis,
        timingsMs: {
          db: 0,
          transform: 0,
          total: 0,
        },
        bboxApplied: bbox,
        group: groupFilter.groupName,
        groupId: groupFilter.groupId,
        dateFrom: dateFilter.fromValue,
        dateTo: dateFilter.toValue,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (GEOJSON_CACHE_ENABLED) {
    const now = Date.now();
    pruneGeojsonCache(now);
    const cached = GEOJSON_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      // Refresh LRU order
      GEOJSON_CACHE.delete(cacheKey);
      GEOJSON_CACHE.set(cacheKey, cached);

      const ifNoneMatch = req.headers["if-none-match"];
      if (matchesEtag(ifNoneMatch, cached.etag)) {
        res
          .status(304)
          .set("Cache-Control", CACHE_CONTROL_HEADER)
          .set("ETag", cached.etag)
          .set("Server-Timing", "cache;desc=hit")
          .end();
        return;
      }

      res
        .status(200)
        .set("Cache-Control", CACHE_CONTROL_HEADER)
        .set("ETag", cached.etag)
        .set("Content-Type", "application/json; charset=utf-8")
        .set("Server-Timing", "cache;desc=hit")
        .send(cached.body);
      return;
    }
  }

  try {
    const shouldReadDrive = sourceFilter === "all" || sourceFilter === "drive";
    const shouldReadInat = sourceFilter === "all" || sourceFilter === "inaturalist";

    const dbStartedAt = performance.now();
    const [driveRows, inatRows] = await Promise.all([
      shouldReadDrive
        ? fetchDriveRows(coordinateWhere, limit, bbox, usePostgis, groupFilter, dateFilter)
        : Promise.resolve([]),
      shouldReadInat
        ? fetchINatRows(coordinateWhere, limit, bbox, usePostgis, groupFilter, dateFilter)
        : Promise.resolve([]),
    ]);
    const dbMs = performance.now() - dbStartedAt;

    const driveFeatures: DatedFeature[] = driveRows
      .filter((row) => hasValidCoordinates(row.latitud, row.longitud))
      .map((row) => {
        const observedAtMs = row.observedAt.getTime();
        const feature: GeoPointFeature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [row.longitud as number, row.latitud as number],
          },
          properties: {
            source: "drive",
            externalId: row.externalId,
            observedAt: row.observedAt.toISOString(),
            username: row.username,
            scientificName: row.scientificName,
            taxonomicGroup: row.taxonomicGroup,
            accuracy: row.accuracy,
          },
        };

        return { feature, observedAtMs };
      });

    const inatFeatures: DatedFeature[] = inatRows
      .filter((row) => hasValidCoordinates(row.latitud, row.longitud))
      .map((row) => {
        const observedAtMs = row.observedAt.getTime();
        const feature: GeoPointFeature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [row.longitud as number, row.latitud as number],
          },
          properties: {
            source: "inaturalist",
            externalId: row.externalId,
            observedAt: row.observedAt.toISOString(),
            username: row.username,
            scientificName: row.scientificName,
            taxonomicGroup: row.taxonomicGroup,
            accuracy: row.accuracy,
          },
        };

        return { feature, observedAtMs };
      });

    const combineStartedAt = performance.now();

    // Merge de dos arrays ya ordenados de forma descendente (O(n) en vez de O(n log n))
    const mergeSortedByDateDesc = (
      arr1: DatedFeature[],
      arr2: DatedFeature[],
      maxLimit: number,
    ): GeoPointFeature[] => {
      const result: GeoPointFeature[] = [];
      let i = 0;
      let j = 0;

      while (i < arr1.length && j < arr2.length && result.length < maxLimit) {
        const left = arr1[i];
        const right = arr2[j];

        if (!left || !right) {
          break;
        }

        if (left.observedAtMs > right.observedAtMs) {
          result.push(left.feature);
          i += 1;
        } else {
          result.push(right.feature);
          j += 1;
        }
      }

      while (i < arr1.length && result.length < maxLimit) {
        const next = arr1[i];
        if (!next) {
          break;
        }
        result.push(next.feature);
        i += 1;
      }

      while (j < arr2.length && result.length < maxLimit) {
        const next = arr2[j];
        if (!next) {
          break;
        }
        result.push(next.feature);
        j += 1;
      }
      return result;
    };

    const globallyLimited = mergeSortedByDateDesc(driveFeatures, inatFeatures, limit);
    const features = spread ? spreadOverlappingPoints(globallyLimited) : globallyLimited;
    const transformMs = performance.now() - combineStartedAt;
    const totalMs = performance.now() - startedAt;
    const collection: GeoPointFeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    // Cache-Control: permite que el browser y cualquier CDN/proxy cachéen
    // las respuestas exitosas. max-age=30 = 30 s en caché fresco.
    // stale-while-revalidate=300 = puede servir stale hasta 5 min mientras revalida en background.
    const payload = {
      ok: true,
      data: collection,
      meta: {
        source: sourceFilter,
        requestedLimit: limit,
        limit: features.length,
        total: features.length,
        drive: driveFeatures.length,
        inaturalist: inatFeatures.length,
        spreadApplied: spread,
        // postgisUsed: true cuando la query usó ST_Intersects sobre el índice GIST.
        // false cuando no había bbox y se usó el fallback ORM con índice B-Tree.
        postgisUsed: usePostgis,
        timingsMs: {
          db: Number(dbMs.toFixed(1)),
          transform: Number(transformMs.toFixed(1)),
          total: Number(totalMs.toFixed(1)),
        },
        bboxApplied: bbox,
        group: groupFilter.groupName,
        groupId: groupFilter.groupId,
        dateFrom: dateFilter.fromValue,
        dateTo: dateFilter.toValue,
        timestamp: new Date().toISOString(),
      },
    };

    const body = JSON.stringify(payload);
    // ETag ligero: combina longitud del body + timestamp de inicio de request.
    // Evita el SHA-1 O(n) que bloquea el event loop para bodies grandes (~150KB).
    // La unicidad está garantizada porque cualquier cambio en los datos cambia
    // la longitud del JSON o el timestamp del request.
    const etag = `"${body.length.toString(36)}-${startedAt.toString(36)}"`;

    if (GEOJSON_CACHE_ENABLED) {
      const now = Date.now();
      GEOJSON_CACHE.set(cacheKey, {
        body,
        etag,
        createdAt: now,
        expiresAt: now + GEOJSON_CACHE_TTL_MS,
      });
      pruneGeojsonCache(now);
    }

    res
      .status(200)
      .set("Cache-Control", CACHE_CONTROL_HEADER)
      .set("ETag", etag)
      .set("Content-Type", "application/json; charset=utf-8")
      .set(
        "Server-Timing",
        `db;dur=${dbMs.toFixed(1)},transform;dur=${transformMs.toFixed(1)},total;dur=${totalMs.toFixed(1)}`,
      )
      .send(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({
      ok: false,
      error: "No fue posible consultar puntos geograficos",
      detail: message,
    });
  }
});
router.get(["/groups", "/grupos"], async (req, res) => {
  try {
    const sourceFilter = parseSourceFilter(req.query.source);
    const dateFilter = parseDateRangeFilter(req.query.dateFrom, req.query.dateTo);

    if (dateFilter.hasInvalidRange) {
      res.status(200).json({
        ok: true,
        data: [],
        total: 0,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const groups = await prisma.$queryRaw<GroupSummaryRow[]>`
        WITH grouped_observations AS (
          SELECT
            gt.id_grupo AS "idGrupo",
            gt.nombre AS "nombre",
            'drive'::text AS "source"
          FROM observaciones o
          JOIN especies e ON o.id_especie = e.id_especie
          JOIN grupo_taxonomico gt ON e.grupo_taxonomico = gt.id_grupo
          WHERE o.geom IS NOT NULL
            ${sourceFilter === "all" || sourceFilter === "drive" ? Prisma.empty : Prisma.sql`AND 1 = 0`}
            ${buildDateSqlFilter(dateFilter, "o")}

          UNION ALL

          SELECT
            gt.id_grupo AS "idGrupo",
            gt.nombre AS "nombre",
            'inaturalist'::text AS "source"
          FROM inaturalist_observaciones i
          JOIN grupo_taxonomico gt ON i.id_grupo = gt.id_grupo
          WHERE i.geom IS NOT NULL
            ${sourceFilter === "all" || sourceFilter === "inaturalist" ? Prisma.empty : Prisma.sql`AND 1 = 0`}
            ${buildDateSqlFilter(dateFilter, "i")}
        )
        SELECT
          "idGrupo",
          "nombre",
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (WHERE "source" = 'drive')::int AS "drive",
          COUNT(*) FILTER (WHERE "source" = 'inaturalist')::int AS "inaturalist"
        FROM grouped_observations
        GROUP BY "idGrupo", "nombre"
        ORDER BY "nombre" ASC
      `;

    res.status(200).json({
      ok: true,
      data: groups,
      total: groups.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    res.status(500).json({
      ok: false,
      error: "No fue posible consultar los grupos taxonómicos",
      detail: message,
    });
  }
});

export default router;
