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
  species: Map<string, number>;
}

type PersistableObservationRecord = Omit<NormalizedObservationRecord, "observedAt"> & {
  observedAt: Date;
};

const createIngestionCache = (): IngestionCache => ({
  users: new Map<string, number>(),
  groups: new Map<string, number>(),
  sources: new Map<string, number>(),
  species: new Map<string, number>(),
});

const baseSummary = (source: ObservationOrigin): IngestSummary => ({
  source,
  totalRead: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
});

const upsertUsuario = async (username: string, cache: IngestionCache): Promise<number> => {
  const cached = cache.users.get(username);
  if (cached) {
    return cached;
  }

  const usuario = await prisma.usuario.upsert({
    where: { username },
    update: {},
    create: { username },
    select: { idUsuario: true },
  });

  cache.users.set(username, usuario.idUsuario);
  return usuario.idUsuario;
};

const upsertGrupoTaxonomico = async (nombre: string, cache: IngestionCache): Promise<number> => {
  const cached = cache.groups.get(nombre);
  if (cached) {
    return cached;
  }

  const grupo = await prisma.grupoTaxonomico.upsert({
    where: { nombre },
    update: {},
    create: { nombre },
    select: { idGrupo: true },
  });

  cache.groups.set(nombre, grupo.idGrupo);
  return grupo.idGrupo;
};

const upsertFuente = async (nombre: string, cache: IngestionCache): Promise<number> => {
  const cached = cache.sources.get(nombre);
  if (cached) {
    return cached;
  }

  const fuente = await prisma.fuente.upsert({
    where: { nombre },
    update: {},
    create: { nombre },
    select: { idFuente: true },
  });

  cache.sources.set(nombre, fuente.idFuente);
  return fuente.idFuente;
};

const upsertEspecie = async (
  nombreCientifico: string,
  grupoTaxonomicoId: number,
  cache: IngestionCache,
): Promise<number> => {
  const key = nombreCientifico;
  const cached = cache.species.get(key);
  if (cached) {
    return cached;
  }

  const especie = await prisma.especie.upsert({
    where: { nombreCientifico },
    update: {},
    create: {
      nombreCientifico,
      grupoTaxonomicoId,
    },
    select: { idEspecie: true, grupoTaxonomicoId: true },
  });

  if (especie.grupoTaxonomicoId !== grupoTaxonomicoId) {
    console.warn(
      `${color.dim}[${now()}]${color.reset} ${color.yellow}ETL_SPECIES_GROUP_MISMATCH${color.reset} especie='${nombreCientifico}' grupoExistente=${especie.grupoTaxonomicoId} grupoEntrante=${grupoTaxonomicoId}`,
    );
  }

  cache.species.set(key, especie.idEspecie);
  return especie.idEspecie;
};

const hasValidObservedAt = (value: Date | null): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const hasValidCoordinates = (latitude: number | null, longitude: number | null): boolean => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const persistDriveRecord = async (
  record: PersistableObservationRecord,
  cache: IngestionCache,
): Promise<"inserted" | "updated"> => {
  const idUsuario = await upsertUsuario(record.username, cache);
  const idGrupo = await upsertGrupoTaxonomico(record.taxonomicGroupDisplay, cache);
  const idEspecie = await upsertEspecie(record.scientificName, idGrupo, cache);
  const idFuente = await upsertFuente(record.sourceName, cache);

  const existing = await prisma.observacion.findUnique({
    where: { instanceId: record.externalId },
    select: { idObservacion: true },
  });

  if (existing) {
    await prisma.observacion.update({
      where: { instanceId: record.externalId },
      data: {
        usuarioId: idUsuario,
        especieId: idEspecie,
        fecha: record.observedAt,
        foto: record.photoUrl || null,
        audio: record.audioUrl || null,
        latitud: record.latitude,
        longitud: record.longitude,
        altitude: record.altitude,
        accuracy: record.accuracy,
        fuenteId: idFuente,
      },
    });

    return "updated";
  }

  await prisma.observacion.create({
    data: {
      usuarioId: idUsuario,
      especieId: idEspecie,
      instanceId: record.externalId,
      fecha: record.observedAt,
      foto: record.photoUrl || null,
      audio: record.audioUrl || null,
      latitud: record.latitude,
      longitud: record.longitude,
      altitude: record.altitude,
      accuracy: record.accuracy,
      fuenteId: idFuente,
    },
  });

  return "inserted";
};

const persistINaturalistRecord = async (
  record: PersistableObservationRecord,
  cache: IngestionCache,
): Promise<"inserted" | "updated"> => {
  const idUsuario = await upsertUsuario(record.username, cache);
  const idGrupo = await upsertGrupoTaxonomico(record.taxonomicGroupDisplay, cache);
  const idEspecie = await upsertEspecie(record.scientificName, idGrupo, cache);
  const idFuente = await upsertFuente(record.sourceName, cache);

  const existing = await prisma.inaturalistObservacion.findUnique({
    where: { inaturalistId: record.externalId },
    select: { idInaturalistObservacion: true },
  });

  if (existing) {
    await prisma.inaturalistObservacion.update({
      where: { inaturalistId: record.externalId },
      data: {
        usuarioId: idUsuario,
        especieId: idEspecie,
        fecha: record.observedAt,
        foto: record.photoUrl || null,
        audio: record.audioUrl || null,
        latitud: record.latitude,
        longitud: record.longitude,
        accuracy: record.accuracy,
        urlInaturalist: record.inaturalistUrl || null,
        qualityGrade: record.qualityGrade || null,
        grupoTaxonomicoId: idGrupo,
        fuenteId: idFuente,
      },
    });

    return "updated";
  }

  await prisma.inaturalistObservacion.create({
    data: {
      usuarioId: idUsuario,
      especieId: idEspecie,
      inaturalistId: record.externalId,
      fecha: record.observedAt,
      foto: record.photoUrl || null,
      audio: record.audioUrl || null,
      latitud: record.latitude,
      longitud: record.longitude,
      accuracy: record.accuracy,
      urlInaturalist: record.inaturalistUrl || null,
      qualityGrade: record.qualityGrade || null,
      grupoTaxonomicoId: idGrupo,
      fuenteId: idFuente,
    },
  });

  return "inserted";
};

const runIngestion = async (
  source: ObservationOrigin,
  records: NormalizedObservationRecord[],
): Promise<IngestSummary> => {
  const summary = baseSummary(source);
  summary.totalRead = records.length;
  const cache = createIngestionCache();

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

    const persistableRecord: PersistableObservationRecord = {
      ...record,
      observedAt,
    };

    try {
      const result =
        source === "drive"
          ? await persistDriveRecord(persistableRecord, cache)
          : await persistINaturalistRecord(persistableRecord, cache);

      if (result === "inserted") {
        summary.inserted += 1;
      } else {
        summary.updated += 1;
      }
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error(
        `${color.dim}[${now()}]${color.reset} ${color.red}ETL_ROW_FAIL${color.reset} source=${source} externalId=${record.externalId} ${message}`,
      );
    }
  }

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
