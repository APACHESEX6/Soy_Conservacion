import { promises as fs } from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { google } from "googleapis";
import { env } from "../../config/env";
import type { RawObservationRecord } from "../types";

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

const asString = (value: unknown): string => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value).trim();
  }

  return "";
};

const normalizeHeaderKey = (value: string): string =>
  value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const raw = asString(value).replace(",", ".");
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const asNumberOrNull = (value: unknown): number | null => asNumber(value) ?? null;

const asNullableString = (value: unknown): string | null => {
  const parsed = asString(value);
  return parsed ? parsed : null;
};

const asDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const parsed = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const raw = asString(value);
  if (!raw) {
    return null;
  }

  const dayMonthYearMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dayMonthYearMatch) {
    const [, dayText, monthText, yearText] = dayMonthYearMatch;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const pick = (row: Record<string, unknown>, aliases: string[]): unknown => {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeaderKey(key),
    value,
  ]);

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeaderKey(alias);

    for (const [normalizedKey, value] of normalizedEntries) {
      if (normalizedKey === normalizedAlias) {
        return value;
      }
    }
  }
  return undefined;
};

const parseCoordinatePair = (value: unknown): { latitude: number; longitude: number } | null => {
  const raw = asString(value);
  if (!raw) {
    return null;
  }

  const parts = raw
    .split(/[;,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const latitude = asNumber(parts[0]);
  const longitude = asNumber(parts[1]);

  if (latitude == null || longitude == null) {
    return null;
  }

  return { latitude, longitude };
};

const toBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }

    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    if (ArrayBuffer.isView(chunk)) {
      chunks.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
    }
  }

  return Buffer.concat(chunks);
};

const parseExcelBuffer = async (buffer: Buffer): Promise<Record<string, unknown>[]> => {
  const workbook = new ExcelJS.Workbook();
  const normalizedBuffer = Buffer.from(buffer as unknown as ArrayBufferLike) as Buffer;
  // @ts-expect-error Buffer generic mismatch with ExcelJS types
  await workbook.xlsx.load(normalizedBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return [];
  }

  const headerRow = sheet.getRow(1);
  const headerValues = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
  const headers = headerValues.map((cell: unknown) => {
    if (cell == null) {
      return "";
    }
    return typeof cell === "string" ? cell.trim() : String(cell).trim();
  });

  const rows: Record<string, unknown>[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const rowValues = Array.isArray(row.values) ? row.values.slice(1) : [];
    const record: Record<string, unknown> = {};

    headers.forEach((header: string, index: number) => {
      if (!header) {
        return;
      }
      record[header] = rowValues[index] ?? null;
    });

    rows.push(record);
  });

  return rows;
};

const downloadDriveFileBuffer = async (
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  mimeType: string,
): Promise<Buffer> => {
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    const response = await drive.files.export(
      {
        fileId,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      {
        responseType: "stream",
      },
    );

    return toBuffer(response.data);
  }

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
    },
    {
      responseType: "stream",
    },
  );

  return toBuffer(response.data);
};

export const mapRowToRecord = (
  row: Record<string, unknown>,
  rowIndex: number,
  fileId: string,
): RawObservationRecord | null => {
  const scientificName = asString(
    pick(row, [
      "nombre_cientifico",
      "nombre cientifico",
      "data-nombre_cientifico",
      "data-nombre cientifico",
      "species",
      "especie",
      "taxon_name",
    ]),
  );

  if (!scientificName) {
    return null;
  }

  const externalId =
    asString(
      pick(row, [
        "instance_id",
        "instance id",
        "meta-instanceID",
        "meta instance id",
        "data-instance_id",
        "id_registro",
        "record_id",
        "id",
      ]),
    ) || `${fileId}-${rowIndex + 1}`;

  const sourceName =
    asString(pick(row, ["fuente", "source", "data-fuente"])) || "Google Drive Excel";
  const username =
    asString(pick(row, ["username", "usuario", "data-usuario", "user", "observador"])) ||
    "Usuario Drive";

  const latitudeValue = pick(row, ["latitud", "latitude", "data-latitud", "data-latitude", "lat"]);
  const longitudeValue = pick(row, [
    "longitud",
    "longitude",
    "data-longitud",
    "data-longitude",
    "lon",
    "lng",
  ]);
  const coordinatePair = parseCoordinatePair(
    pick(row, ["data-coordenada", "coordenada", "coordinates", "coordinate", "coord"]),
  );

  return {
    origin: "drive",
    externalId,
    sourceName,
    observedAt: asDate(pick(row, ["fecha", "data-fecha", "date", "observed_at", "observed on"])),
    username,
    scientificName,
    taxonomicGroupRaw: asNullableString(
      pick(row, [
        "grupo_taxonomico",
        "grupo taxonomico",
        "data-grupo_taxonomico",
        "data-grupo taxonomico",
        "grupo",
        "taxonomic_group",
        "iconic_taxon_name",
      ]),
    ),
    latitude: asNumberOrNull(latitudeValue) ?? coordinatePair?.latitude ?? null,
    longitude: asNumberOrNull(longitudeValue) ?? coordinatePair?.longitude ?? null,
    altitude: asNumberOrNull(pick(row, ["altitud", "data-coordenada-altitude", "altitude"])),
    accuracy: asNumberOrNull(pick(row, ["precision", "data-coordenada-accuracy", "accuracy"])),
    photoUrl: asNullableString(
      pick(row, ["foto", "data-foto", "photo", "photo_url", "imagen", "imagen_url"]),
    ),
    audioUrl: asNullableString(pick(row, ["audio", "data-audio", "audio_url"])),
    inaturalistUrl: null,
    qualityGrade: null,
    license: null,
  };
};

export const readDriveExcelRecords = async (): Promise<RawObservationRecord[]> => {
  const folderId = env.GOOGLE_DRIVE_FOLDER_ID;
  const serviceAccountJson = env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile = env.GOOGLE_SERVICE_ACCOUNT_FILE;

  if (!folderId || (!serviceAccountJson && !serviceAccountFile)) {
    console.warn(
      "[ETL_DRIVE_SKIP] Falta GOOGLE_DRIVE_FOLDER_ID o GOOGLE_SERVICE_ACCOUNT_JSON/GOOGLE_SERVICE_ACCOUNT_FILE. Se omite ingesta de Drive.",
    );
    return [];
  }

  let credentialsJson = serviceAccountJson;
  if (!credentialsJson && serviceAccountFile) {
    const resolvedPath = path.isAbsolute(serviceAccountFile)
      ? serviceAccountFile
      : path.resolve(process.cwd(), serviceAccountFile);

    try {
      credentialsJson = await fs.readFile(resolvedPath, "utf8");
    } catch (error) {
      throw new Error(
        `No se puede leer GOOGLE_SERVICE_ACCOUNT_FILE en ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(credentialsJson as string) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON valido");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: DRIVE_SCOPES,
  });

  const drive = google.drive({ version: "v3", auth });

  const fileList = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'application/vnd.ms-excel' or mimeType = 'application/vnd.google-apps.spreadsheet')`,
    fields: "files(id,name,mimeType)",
    pageSize: 100,
  });

  const files = fileList.data.files ?? [];
  const records: RawObservationRecord[] = [];

  for (const file of files) {
    const fileId = file.id;
    if (!fileId) {
      continue;
    }

    if (!file.mimeType) {
      continue;
    }

    const buffer = await downloadDriveFileBuffer(drive, fileId, file.mimeType);
    const rows = await parseExcelBuffer(buffer);

    rows.forEach((row, index) => {
      const mapped = mapRowToRecord(row, index, fileId);
      if (mapped) {
        records.push(mapped);
      }
    });
  }

  return records;
};
