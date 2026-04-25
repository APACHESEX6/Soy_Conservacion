import type { Readable } from "node:stream";
import { google } from "googleapis";
import * as XLSX from "xlsx";
import type { RawObservationRecord } from "../types";

interface XlsxSheetLike {
  [cell: string]: unknown;
}

interface XlsxWorkbookLike {
  SheetNames: string[];
  Sheets: Record<string, XlsxSheetLike | undefined>;
}

interface XlsxModuleLike {
  read: (data: Buffer, options: { type: "buffer" }) => XlsxWorkbookLike;
  utils: {
    sheet_to_json: <T>(sheet: XlsxSheetLike, options: { defval: null }) => T[];
  };
}

const xlsxModule = XLSX as unknown as XlsxModuleLike;

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

  const raw = asString(value);
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const pick = (row: Record<string, unknown>, aliases: string[]): unknown => {
  for (const alias of aliases) {
    if (alias in row) {
      return row[alias];
    }
  }
  return undefined;
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

const parseExcelBuffer = (buffer: Buffer): Record<string, unknown>[] => {
  const workbook = xlsxModule.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    return [];
  }

  return xlsxModule.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });
};

const mapRowToRecord = (
  row: Record<string, unknown>,
  rowIndex: number,
  fileId: string,
): RawObservationRecord | null => {
  const scientificName = asString(
    pick(row, ["nombre_cientifico", "nombre cientifico", "species", "especie", "taxon_name"]),
  );

  if (!scientificName) {
    return null;
  }

  const externalId =
    asString(pick(row, ["instance_id", "instance id", "id_registro", "record_id", "id"])) ||
    `${fileId}-${rowIndex + 1}`;

  const sourceName = asString(pick(row, ["fuente", "source"])) || "Google Drive Excel";
  const username =
    asString(pick(row, ["username", "usuario", "user", "observador"])) || "Usuario Drive";

  return {
    origin: "drive",
    externalId,
    sourceName,
    observedAt: asDate(pick(row, ["fecha", "date", "observed_at", "observed on"])),
    username,
    scientificName,
    taxonomicGroupRaw: asNullableString(
      pick(row, [
        "grupo_taxonomico",
        "grupo taxonomico",
        "grupo",
        "taxonomic_group",
        "iconic_taxon_name",
      ]),
    ),
    latitude: asNumberOrNull(pick(row, ["latitud", "latitude", "lat"])),
    longitude: asNumberOrNull(pick(row, ["longitud", "longitude", "lon", "lng"])),
    altitude: asNumberOrNull(pick(row, ["altitud", "altitude"])),
    accuracy: asNumberOrNull(pick(row, ["precision", "accuracy"])),
    photoUrl: asNullableString(pick(row, ["foto", "photo", "photo_url", "imagen", "imagen_url"])),
    audioUrl: asNullableString(pick(row, ["audio", "audio_url"])),
    inaturalistUrl: null,
    qualityGrade: null,
  };
};

export const readDriveExcelRecords = async (): Promise<RawObservationRecord[]> => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!folderId || !serviceAccountJson) {
    console.warn(
      "[ETL_DRIVE_SKIP] Falta GOOGLE_DRIVE_FOLDER_ID o GOOGLE_SERVICE_ACCOUNT_JSON. Se omite ingesta de Drive.",
    );
    return [];
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(serviceAccountJson) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON valido");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: DRIVE_SCOPES,
  });

  const drive = google.drive({ version: "v3", auth });

  const fileList = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'application/vnd.ms-excel')`,
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

    const mediaResponse = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    );

    const stream = mediaResponse.data;
    const buffer = await toBuffer(stream);
    const rows = parseExcelBuffer(buffer);

    rows.forEach((row, index) => {
      const mapped = mapRowToRecord(row, index, fileId);
      if (mapped) {
        records.push(mapped);
      }
    });
  }

  return records;
};
