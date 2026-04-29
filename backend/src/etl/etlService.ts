import { prisma } from "../config/prisma";
import { normalizeObservationRecord } from "./normalization";
import { readDriveExcelRecords } from "./sources/driveExcelSource";
import { readINaturalistRecords } from "./sources/inaturalistSource";
import type { IngestSummary, NormalizedObservationRecord, ObservationOrigin } from "./types";

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const now = () => new Date().toISOString();

interface IngestionCache {
  users: Map<string, number>;
  groups: Map<string, number>;
  sources: Map<string, number>;
  species: Map<string, { id: number; groupId: number }>;
}

type PersistableObservationRecord = Omit<NormalizedObservationRecord, "observedAt"> & {
  observedAt: Date;
};

type DrivePersistInput = {
  externalId: string;
  usuarioId: number;
  especieId: number;
  fuenteId: number;
  observedAt: Date;
  photoUrl: string | null;
  audioUrl: string | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
};

type INatPersistInput = DrivePersistInput & {
  inaturalistUrl: string | null;
  qualityGrade: string | null;
  grupoTaxonomicoId: number;
};

const createIngestionCache = (): IngestionCache => ({
  users: new Map<string, number>(),
  groups: new Map<string, number>(),
  sources: new Map<string, number>(),
  species: new Map<string, { id: number; groupId: number }>(),
});

const baseSummary = (source: ObservationOrigin): IngestSummary => ({
  source,
  totalRead: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
});

// ---------------------------------------------------------------------------
// Helpers de upsert para tablas de catálogo con GENERATED ALWAYS AS IDENTITY.
// Prisma 7 no puede resolver el nombre de la constraint en columnas IDENTITY,
// por lo que usamos INSERT ... ON CONFLICT DO NOTHING + SELECT como fallback.
// Esto es atómico, seguro ante concurrencia y no genera gaps innecesarios.
// ---------------------------------------------------------------------------

type IdRow = [{ id_usuario: number }] | [];
type GrupoRow = [{ id_grupo: number }] | [];
type FuenteRow = [{ id_fuente: number }] | [];
type EspecieRow = [{ id_especie: number; grupo_taxonomico: number }] | [];

const upsertUsuario = async (username: string, cache: IngestionCache): Promise<number> => {
  const cached = cache.users.get(username);
  if (cached) return cached;

  // INSERT ... ON CONFLICT DO NOTHING es idempotente y no consume secuencia si ya existe.
  await prisma.$executeRaw`
    INSERT INTO "usuarios" ("username")
    VALUES (${username})
    ON CONFLICT ("username") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<IdRow>`
    SELECT "id_usuario" FROM "usuarios" WHERE "username" = ${username} LIMIT 1
  `;

  const id = rows[0]?.id_usuario;
  if (!id) throw new Error(`No se pudo obtener id para usuario '${username}'`);

  cache.users.set(username, id);
  return id;
};

const upsertGrupoTaxonomico = async (nombre: string, cache: IngestionCache): Promise<number> => {
  const cached = cache.groups.get(nombre);
  if (cached) return cached;

  await prisma.$executeRaw`
    INSERT INTO "grupo_taxonomico" ("nombre")
    VALUES (${nombre})
    ON CONFLICT ("nombre") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<GrupoRow>`
    SELECT "id_grupo" FROM "grupo_taxonomico" WHERE "nombre" = ${nombre} LIMIT 1
  `;

  const id = rows[0]?.id_grupo;
  if (!id) throw new Error(`No se pudo obtener id para grupo '${nombre}'`);

  cache.groups.set(nombre, id);
  return id;
};

const upsertFuente = async (nombre: string, cache: IngestionCache): Promise<number> => {
  const cached = cache.sources.get(nombre);
  if (cached) return cached;

  await prisma.$executeRaw`
    INSERT INTO "fuente" ("nombre")
    VALUES (${nombre})
    ON CONFLICT ("nombre") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<FuenteRow>`
    SELECT "id_fuente" FROM "fuente" WHERE "nombre" = ${nombre} LIMIT 1
  `;

  const id = rows[0]?.id_fuente;
  if (!id) throw new Error(`No se pudo obtener id para fuente '${nombre}'`);

  cache.sources.set(nombre, id);
  return id;
};

const upsertEspecie = async (
  nombreCientifico: string,
  grupoTaxonomicoId: number,
  cache: IngestionCache,
): Promise<number> => {
  const cached = cache.species.get(nombreCientifico);
  if (cached) {
    if (cached.groupId !== grupoTaxonomicoId) {
      console.warn(
        `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_SPECIES_GROUP_MISMATCH${color.reset} especie='${nombreCientifico}' grupoExistente=${cached.groupId} grupoEntrante=${grupoTaxonomicoId}`,
      );
    }
    return cached.id;
  }

  await prisma.$executeRaw`
    INSERT INTO "especies" ("nombre_cientifico", "grupo_taxonomico")
    VALUES (${nombreCientifico}, ${grupoTaxonomicoId})
    ON CONFLICT ("nombre_cientifico") DO NOTHING
  `;

  const rows = await prisma.$queryRaw<EspecieRow>`
    SELECT "id_especie", "grupo_taxonomico"
    FROM "especies"
    WHERE "nombre_cientifico" = ${nombreCientifico}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) throw new Error(`No se pudo obtener id para especie '${nombreCientifico}'`);

  if (row.grupo_taxonomico !== grupoTaxonomicoId) {
    console.warn(
      `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_SPECIES_GROUP_MISMATCH${color.reset} especie='${nombreCientifico}' grupoExistente=${row.grupo_taxonomico} grupoEntrante=${grupoTaxonomicoId}`,
    );
  }

  cache.species.set(nombreCientifico, { id: row.id_especie, groupId: row.grupo_taxonomico });
  return row.id_especie;
};

const hasValidObservedAt = (value: Date | null): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const hasValidCoordinates = (latitude: number | null, longitude: number | null): boolean => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const PREFETCH_CHUNK_SIZE = (() => {
  const raw = Number(process.env.ETL_PREFETCH_CHUNK_SIZE ?? 500);
  if (!Number.isFinite(raw)) {
    return 500;
  }
  return Math.min(2000, Math.max(50, Math.floor(raw)));
})();

const chunkArray = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const uniqueValues = (
  records: NormalizedObservationRecord[],
  selector: (record: NormalizedObservationRecord) => string,
): string[] => {
  const set = new Set<string>();
  for (const record of records) {
    const value = selector(record).trim();
    if (value) {
      set.add(value);
    }
  }
  return [...set];
};

const prefetchCache = async (
  records: NormalizedObservationRecord[],
  cache: IngestionCache,
): Promise<void> => {
  if (records.length === 0) {
    return;
  }

  const usernames = uniqueValues(records, (record) => record.username);
  const groups = uniqueValues(records, (record) => record.taxonomicGroupDisplay);
  const sources = uniqueValues(records, (record) => record.sourceName);
  const species = uniqueValues(records, (record) => record.scientificName);

  try {
    for (const chunk of chunkArray(usernames, PREFETCH_CHUNK_SIZE)) {
      const rows = await prisma.usuario.findMany({
        where: { username: { in: chunk } },
        select: { idUsuario: true, username: true },
      });
      for (const row of rows) {
        cache.users.set(row.username, row.idUsuario);
      }
    }

    for (const chunk of chunkArray(groups, PREFETCH_CHUNK_SIZE)) {
      const rows = await prisma.grupoTaxonomico.findMany({
        where: { nombre: { in: chunk } },
        select: { idGrupo: true, nombre: true },
      });
      for (const row of rows) {
        cache.groups.set(row.nombre, row.idGrupo);
      }
    }

    for (const chunk of chunkArray(sources, PREFETCH_CHUNK_SIZE)) {
      const rows = await prisma.fuente.findMany({
        where: { nombre: { in: chunk } },
        select: { idFuente: true, nombre: true },
      });
      for (const row of rows) {
        cache.sources.set(row.nombre, row.idFuente);
      }
    }

    for (const chunk of chunkArray(species, PREFETCH_CHUNK_SIZE)) {
      const rows = await prisma.especie.findMany({
        where: { nombreCientifico: { in: chunk } },
        select: { idEspecie: true, nombreCientifico: true, grupoTaxonomicoId: true },
      });
      for (const row of rows) {
        cache.species.set(row.nombreCientifico, {
          id: row.idEspecie,
          groupId: row.grupoTaxonomicoId,
        });
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.warn(
      `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_PREFETCH_FAIL${color.reset} ${message}`,
    );
  }
};

const resolveDriveRecord = async (
  record: PersistableObservationRecord,
  cache: IngestionCache,
): Promise<DrivePersistInput> => {
  const idUsuario = await upsertUsuario(record.username, cache);
  const idGrupo = await upsertGrupoTaxonomico(record.taxonomicGroupDisplay, cache);
  const idEspecie = await upsertEspecie(record.scientificName, idGrupo, cache);
  const idFuente = await upsertFuente(record.sourceName, cache);
  return {
    externalId: record.externalId,
    usuarioId: idUsuario,
    especieId: idEspecie,
    fuenteId: idFuente,
    observedAt: record.observedAt,
    photoUrl: record.photoUrl ?? null,
    audioUrl: record.audioUrl ?? null,
    latitude: record.latitude as number,
    longitude: record.longitude as number,
    altitude: record.altitude ?? null,
    accuracy: record.accuracy ?? null,
  };
};

const resolveINaturalistRecord = async (
  record: PersistableObservationRecord,
  cache: IngestionCache,
): Promise<INatPersistInput> => {
  const idUsuario = await upsertUsuario(record.username, cache);
  const idGrupo = await upsertGrupoTaxonomico(record.taxonomicGroupDisplay, cache);
  const idEspecie = await upsertEspecie(record.scientificName, idGrupo, cache);
  const idFuente = await upsertFuente(record.sourceName, cache);
  return {
    externalId: record.externalId,
    usuarioId: idUsuario,
    especieId: idEspecie,
    fuenteId: idFuente,
    observedAt: record.observedAt,
    photoUrl: record.photoUrl ?? null,
    audioUrl: record.audioUrl ?? null,
    latitude: record.latitude as number,
    longitude: record.longitude as number,
    altitude: record.altitude ?? null,
    accuracy: record.accuracy ?? null,
    inaturalistUrl: record.inaturalistUrl ?? null,
    qualityGrade: record.qualityGrade ?? null,
    grupoTaxonomicoId: idGrupo,
  };
};

const buildDriveData = (record: DrivePersistInput) => ({
  usuarioId: record.usuarioId,
  especieId: record.especieId,
  fecha: record.observedAt,
  foto: record.photoUrl,
  audio: record.audioUrl,
  latitud: record.latitude,
  longitud: record.longitude,
  altitude: record.altitude,
  accuracy: record.accuracy,
  fuenteId: record.fuenteId,
});

const buildINatData = (record: INatPersistInput) => ({
  usuarioId: record.usuarioId,
  especieId: record.especieId,
  fecha: record.observedAt,
  foto: record.photoUrl,
  audio: record.audioUrl,
  latitud: record.latitude,
  longitud: record.longitude,
  accuracy: record.accuracy,
  urlInaturalist: record.inaturalistUrl,
  qualityGrade: record.qualityGrade,
  grupoTaxonomicoId: record.grupoTaxonomicoId,
  fuenteId: record.fuenteId,
});

const fetchExistingDriveIds = async (externalIds: string[]): Promise<Set<string>> => {
  const existing = new Set<string>();
  for (const chunk of chunkArray(externalIds, PREFETCH_CHUNK_SIZE)) {
    if (chunk.length === 0) {
      continue;
    }
    const rows = await prisma.observacion.findMany({
      where: { instanceId: { in: chunk } },
      select: { instanceId: true },
    });
    for (const row of rows) {
      existing.add(row.instanceId);
    }
  }
  return existing;
};

const fetchExistingINatIds = async (externalIds: string[]): Promise<Set<string>> => {
  const existing = new Set<string>();
  for (const chunk of chunkArray(externalIds, PREFETCH_CHUNK_SIZE)) {
    if (chunk.length === 0) {
      continue;
    }
    const rows = await prisma.inaturalistObservacion.findMany({
      where: { inaturalistId: { in: chunk } },
      select: { inaturalistId: true },
    });
    for (const row of rows) {
      existing.add(row.inaturalistId);
    }
  }
  return existing;
};

const createDriveBatches = async (
  records: DrivePersistInput[],
  summary: IngestSummary,
): Promise<void> => {
  for (const chunk of chunkArray(records, PREFETCH_CHUNK_SIZE)) {
    if (chunk.length === 0) {
      continue;
    }

    const data = chunk.map((record) => ({
      ...buildDriveData(record),
      instanceId: record.externalId,
    }));

    try {
      const result = await prisma.observacion.createMany({
        data,
        skipDuplicates: true,
      });
      summary.inserted += result.count;

      // Backfill explícito de geom para los registros recién insertados.
      // El trigger de PostgreSQL debería haberlo hecho, pero esto garantiza
      // consistencia si el trigger no estaba activo en el momento del insert.
      const externalIds = chunk.map((r) => r.externalId);
      await prisma.$executeRaw`
        UPDATE "observaciones"
        SET "geom" = ST_SetSRID(ST_MakePoint("longitud", "latitud"), 4326)
        WHERE "instance_id" = ANY(${externalIds}::text[])
          AND "geom" IS NULL
          AND "longitud" IS NOT NULL
          AND "latitud" IS NOT NULL
      `;
      continue;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.warn(
        `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_BATCH_CREATE_FAIL${color.reset} source=drive ${message}`,
      );
    }

    for (const record of chunk) {
      try {
        await prisma.observacion.create({
          data: {
            ...buildDriveData(record),
            instanceId: record.externalId,
          },
        });
        summary.inserted += 1;
      } catch (error) {
        summary.failed += 1;
        const message = error instanceof Error ? error.message : "Error desconocido";
        console.error(
          `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=drive externalId=${record.externalId} ${message}`,
        );
      }
    }
  }
};

const createINatBatches = async (
  records: INatPersistInput[],
  summary: IngestSummary,
): Promise<void> => {
  for (const chunk of chunkArray(records, PREFETCH_CHUNK_SIZE)) {
    if (chunk.length === 0) {
      continue;
    }

    const data = chunk.map((record) => ({
      ...buildINatData(record),
      inaturalistId: record.externalId,
    }));

    try {
      const result = await prisma.inaturalistObservacion.createMany({
        data,
        skipDuplicates: true,
      });
      summary.inserted += result.count;

      // Backfill explícito de geom para los registros recién insertados.
      const externalIds = chunk.map((r) => r.externalId);
      await prisma.$executeRaw`
        UPDATE "inaturalist_observaciones"
        SET "geom" = ST_SetSRID(ST_MakePoint("longitud", "latitud"), 4326)
        WHERE "inaturalist_id" = ANY(${externalIds}::text[])
          AND "geom" IS NULL
          AND "longitud" IS NOT NULL
          AND "latitud" IS NOT NULL
      `;
      continue;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.warn(
        `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_BATCH_CREATE_FAIL${color.reset} source=inaturalist ${message}`,
      );
    }

    for (const record of chunk) {
      try {
        await prisma.inaturalistObservacion.create({
          data: {
            ...buildINatData(record),
            inaturalistId: record.externalId,
          },
        });
        summary.inserted += 1;
      } catch (error) {
        summary.failed += 1;
        const message = error instanceof Error ? error.message : "Error desconocido";
        console.error(
          `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=inaturalist externalId=${record.externalId} ${message}`,
        );
      }
    }
  }
};

const updateDriveBatches = async (
  records: DrivePersistInput[],
  summary: IngestSummary,
  concurrency: number,
): Promise<void> => {
  for (const chunk of chunkArray(records, concurrency)) {
    await Promise.all(
      chunk.map(async (record) => {
        try {
          await prisma.observacion.update({
            where: { instanceId: record.externalId },
            data: buildDriveData(record),
          });
          summary.updated += 1;
        } catch (error) {
          summary.failed += 1;
          const message = error instanceof Error ? error.message : "Error desconocido";
          console.error(
            `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=drive externalId=${record.externalId} ${message}`,
          );
        }
      }),
    );
  }
};

const updateINatBatches = async (
  records: INatPersistInput[],
  summary: IngestSummary,
  concurrency: number,
): Promise<void> => {
  for (const chunk of chunkArray(records, concurrency)) {
    await Promise.all(
      chunk.map(async (record) => {
        try {
          await prisma.inaturalistObservacion.update({
            where: { inaturalistId: record.externalId },
            data: buildINatData(record),
          });
          summary.updated += 1;
        } catch (error) {
          summary.failed += 1;
          const message = error instanceof Error ? error.message : "Error desconocido";
          console.error(
            `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=inaturalist externalId=${record.externalId} ${message}`,
          );
        }
      }),
    );
  }
};

const runIngestion = async (
  source: ObservationOrigin,
  records: NormalizedObservationRecord[],
): Promise<IngestSummary> => {
  const summary = baseSummary(source);
  summary.totalRead = records.length;
  const cache = createIngestionCache();
  await prefetchCache(records, cache);
  const concurrencyRaw = Number(process.env.ETL_CONCURRENCY ?? 4);
  const concurrency = Number.isFinite(concurrencyRaw)
    ? Math.min(20, Math.max(1, Math.floor(concurrencyRaw)))
    : 4;

  const persistable: PersistableObservationRecord[] = [];

  for (const record of records) {
    const observedAt = record.observedAt;

    if (!hasValidObservedAt(observedAt)) {
      summary.skipped += 1;
      console.warn(
        `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_ROW_SKIP${color.reset} source=${source} externalId=${record.externalId} reason=invalid_date`,
      );
      continue;
    }

    if (!hasValidCoordinates(record.latitude, record.longitude)) {
      summary.skipped += 1;
      console.warn(
        `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_ROW_SKIP${color.reset} source=${source} externalId=${record.externalId} reason=invalid_coordinates`,
      );
      continue;
    }

    persistable.push({
      ...record,
      observedAt,
    });
  }

  if (persistable.length === 0) {
    return summary;
  }

  if (source === "drive") {
    const resolved: DrivePersistInput[] = [];

    for (const batch of chunkArray(persistable, concurrency)) {
      await Promise.all(
        batch.map(async (record) => {
          try {
            resolved.push(await resolveDriveRecord(record, cache));
          } catch (error) {
            summary.failed += 1;
            const message = error instanceof Error ? error.message : "Error desconocido";
            console.error(
              `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=drive externalId=${record.externalId} ${message}`,
            );
          }
        }),
      );
    }

    if (resolved.length === 0) {
      return summary;
    }

    const existing = await fetchExistingDriveIds(resolved.map((record) => record.externalId));
    const toCreate: DrivePersistInput[] = [];
    const toUpdate: DrivePersistInput[] = [];

    for (const record of resolved) {
      if (existing.has(record.externalId)) {
        toUpdate.push(record);
      } else {
        toCreate.push(record);
      }
    }

    await createDriveBatches(toCreate, summary);
    await updateDriveBatches(toUpdate, summary, concurrency);
    return summary;
  }

  const resolved: INatPersistInput[] = [];

  for (const batch of chunkArray(persistable, concurrency)) {
    await Promise.all(
      batch.map(async (record) => {
        try {
          resolved.push(await resolveINaturalistRecord(record, cache));
        } catch (error) {
          summary.failed += 1;
          const message = error instanceof Error ? error.message : "Error desconocido";
          console.error(
            `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=inaturalist externalId=${record.externalId} ${message}`,
          );
        }
      }),
    );
  }

  if (resolved.length === 0) {
    return summary;
  }

  const existing = await fetchExistingINatIds(resolved.map((record) => record.externalId));
  const toCreate: INatPersistInput[] = [];
  const toUpdate: INatPersistInput[] = [];

  for (const record of resolved) {
    if (existing.has(record.externalId)) {
      toUpdate.push(record);
    } else {
      toCreate.push(record);
    }
  }

  await createINatBatches(toCreate, summary);
  await updateINatBatches(toUpdate, summary, concurrency);
  return summary;
};

const logSummary = (summary: IngestSummary): void => {
  console.log(
    `${color.dim}[${now()}]${color.reset} ${color.cyan}ETL_SUMMARY${color.reset} source=${summary.source} read=${summary.totalRead} inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped} failed=${summary.failed}`,
  );
};

export const runDriveIngestion = async (): Promise<IngestSummary> => {
  const raw = await readDriveExcelRecords();
  const normalized = raw.map(normalizeObservationRecord);
  const summary = await runIngestion("drive", normalized);
  logSummary(summary);
  return summary;
};

export const runINaturalistIngestion = async (): Promise<IngestSummary> => {
  const raw = await readINaturalistRecords();
  const normalized = raw.map(normalizeObservationRecord);
  const summary = await runIngestion("inaturalist", normalized);
  logSummary(summary);
  return summary;
};

export const runAllIngestions = async (): Promise<IngestSummary[]> => {
  const summaries: IngestSummary[] = [];

  if ((process.env.DRIVE_ETL_ENABLED ?? "true") === "true") {
    summaries.push(await runDriveIngestion());
  }

  if ((process.env.INAT_ETL_ENABLED ?? "true") === "true") {
    summaries.push(await runINaturalistIngestion());
  }

  return summaries;
};
