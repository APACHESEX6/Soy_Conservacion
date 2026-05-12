import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/env", () => ({
  env: {
    GOOGLE_DRIVE_FOLDER_ID: undefined,
    GOOGLE_SERVICE_ACCOUNT_JSON: undefined,
    GOOGLE_SERVICE_ACCOUNT_FILE: undefined,
  },
}));

import { mapRowToRecord } from "./driveExcelSource";

describe("mapRowToRecord", () => {
  it("parses the cliente Excel format with data-* headers and combined coordinates", () => {
    const record = mapRowToRecord(
      {
        "data-fecha": "28/01/2022",
        "data-usuario": "Diego Alejandro Gomez Hoyos",
        "data-foto": "",
        "data-audio": "",
        "data-coordenada": "4.324763, -75.834469",
        "data-coordenada-altitude": "",
        "data-coordenada-accuracy": "",
        "data-grupo_taxonomico": "mammalia",
        "data-nombre_cientifico": "Aotus lemurinus",
        "meta-instanceID": "abc-123",
      },
      0,
      "file-1",
    );

    expect(record).not.toBeNull();
    expect(record).toMatchObject({
      origin: "drive",
      externalId: "abc-123",
      sourceName: "Google Drive Excel",
      username: "Diego Alejandro Gomez Hoyos",
      scientificName: "Aotus lemurinus",
      taxonomicGroupRaw: "mammalia",
      latitude: 4.324763,
      longitude: -75.834469,
      altitude: null,
      accuracy: null,
      photoUrl: null,
      audioUrl: null,
    });

    expect(record?.observedAt).toBeInstanceOf(Date);
    expect(record?.observedAt?.toISOString()).toBe("2022-01-28T00:00:00.000Z");
  });

  it("returns null when there is no scientific name", () => {
    const record = mapRowToRecord(
      {
        "data-fecha": "28/01/2022",
        "data-usuario": "Diego Alejandro Gomez Hoyos",
        "data-coordenada": "4.324763, -75.834469",
      },
      0,
      "file-1",
    );

    expect(record).toBeNull();
  });
});
