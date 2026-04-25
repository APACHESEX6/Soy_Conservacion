import type { NormalizedObservationRecord, RawObservationRecord } from "./types";

const TAXONOMIC_GROUP_MAP: Record<string, string> = {
  aves: "Aves",
  birds: "Aves",
  mamiferos: "Mamiferos",
  mammalia: "Mamiferos",
  mammals: "Mamiferos",
  reptiles: "Reptiles",
  reptilia: "Reptiles",
  anfibios: "Anfibios",
  amphibia: "Anfibios",
  peces: "Peces",
  fish: "Peces",
  actinopterygii: "Peces",
  chondrichthyes: "Peces",
  insectos: "Insectos",
  insecta: "Insectos",
  insects: "Insectos",
  aracnidos: "Aracnidos",
  arachnida: "Aracnidos",
  moluscos: "Moluscos",
  mollusca: "Moluscos",
  plantas: "Plantas",
  plantae: "Plantas",
  fungi: "Hongos",
  hongos: "Hongos",
  protozoos: "Protozoos",
  protozoa: "Protozoos",
  cromistas: "Cromistas",
  chromista: "Cromistas",
  animalia: "Animalia",
  unknown: "Desconocido",
  desconocido: "Desconocido",
};

const TAXONOMIC_GROUP_DISPLAY_FIXES: Record<string, string> = {
  Mamiferos: "Mamíferos",
  Anfibios: "Anfibios",
  Aracnidos: "Arácnidos",
};

const NORMALIZED_SPACE_PATTERN = /\s+/g;
const NON_ALNUM_SPACE_PATTERN = /[^\p{L}\p{N}\s-]/gu;

const toAsciiKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(NON_ALNUM_SPACE_PATTERN, " ")
    .replace(NORMALIZED_SPACE_PATTERN, " ")
    .trim();

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");

export const normalizeDisplayText = (value: string, fallback: string): string => {
  const cleaned = value.trim().replace(NORMALIZED_SPACE_PATTERN, " ");
  if (!cleaned) {
    return fallback;
  }
  return toTitleCase(cleaned);
};

export const normalizeTaxonomicGroup = (value: string | null): string => {
  if (!value) {
    return "Desconocido";
  }

  const normalizedKey = toAsciiKey(value);
  const mapped = TAXONOMIC_GROUP_MAP[normalizedKey];
  if (mapped) {
    return TAXONOMIC_GROUP_DISPLAY_FIXES[mapped] ?? mapped;
  }

  const title = normalizeDisplayText(value, "Desconocido");
  return TAXONOMIC_GROUP_DISPLAY_FIXES[title] ?? title;
};

const normalizeScientificName = (scientificName: string): string => {
  const compact = scientificName.trim().replace(NORMALIZED_SPACE_PATTERN, " ");
  if (!compact) {
    return "Sin Especie";
  }

  const tokens = compact.split(" ");
  const firstToken = tokens[0];
  if (!firstToken) {
    return "Sin Especie";
  }

  if (tokens.length === 1) {
    return firstToken.charAt(0).toUpperCase() + firstToken.slice(1).toLowerCase();
  }

  const [genus, ...rest] = tokens;
  const normalizedGenus = genus ?? firstToken;
  return [
    normalizedGenus.charAt(0).toUpperCase() + normalizedGenus.slice(1).toLowerCase(),
    ...rest.map((part) => part.toLowerCase()),
  ].join(" ");
};

export const normalizeObservationRecord = (
  record: RawObservationRecord,
): NormalizedObservationRecord => {
  const username = normalizeDisplayText(record.username, "Usuario Desconocido");
  const scientificName = normalizeScientificName(record.scientificName);
  const taxonomicGroupDisplay = normalizeTaxonomicGroup(record.taxonomicGroupRaw);

  return {
    ...record,
    username,
    scientificName,
    taxonomicGroupDisplay,
  };
};
