import type { NormalizedObservationRecord, RawObservationRecord } from "./types";

const TAXONOMIC_GROUP_MAP: Record<string, string> = {
  // ── Aves ──────────────────────────────────────────────────────────────────
  aves: "Aves",
  birds: "Aves",
  // ── Mamíferos ─────────────────────────────────────────────────────────────
  mamiferos: "Mamíferos",
  mamifero: "Mamíferos",
  mammalia: "Mamíferos",
  mammals: "Mamíferos",
  mammal: "Mamíferos",
  // ── Reptiles ──────────────────────────────────────────────────────────────
  reptiles: "Reptiles",
  reptil: "Reptiles",
  reptilia: "Reptiles",
  // ── Anfibios ──────────────────────────────────────────────────────────────
  anfibios: "Anfibios",
  anfibio: "Anfibios",
  amphibia: "Anfibios",
  amphibians: "Anfibios",
  // ── Peces ─────────────────────────────────────────────────────────────────
  peces: "Peces",
  pez: "Peces",
  fish: "Peces",
  actinopterygii: "Peces", // nombre clásico peces óseos
  actinopteri: "Peces", // nombre moderno iNaturalist (reemplazó actinopterygii)
  chondrichthyes: "Peces", // tiburones, rayas
  // ── Insectos ──────────────────────────────────────────────────────────────
  insectos: "Insectos",
  insecto: "Insectos",
  insecta: "Insectos",
  insects: "Insectos",
  insect: "Insectos",
  // ── Arácnidos ─────────────────────────────────────────────────────────────
  aracnidos: "Arácnidos",
  aracnido: "Arácnidos",
  arachnida: "Arácnidos",
  arachnids: "Arácnidos",
  // ── Moluscos ──────────────────────────────────────────────────────────────
  moluscos: "Moluscos",
  molusco: "Moluscos",
  mollusca: "Moluscos",
  mollusks: "Moluscos",
  // ── Plantas ───────────────────────────────────────────────────────────────
  plantas: "Plantas",
  planta: "Plantas",
  plantae: "Plantas",
  plants: "Plantas",
  flora: "Plantas",
  // ── Hongos ────────────────────────────────────────────────────────────────
  hongos: "Hongos",
  hongo: "Hongos",
  fungi: "Hongos",
  fungus: "Hongos",
  mushroom: "Hongos",
  // ── Protozoos ─────────────────────────────────────────────────────────────
  protozoos: "Protozoos",
  protozoo: "Protozoos",
  protozoa: "Protozoos",
  protozoan: "Protozoos",
  // ── Cromistas ─────────────────────────────────────────────────────────────
  cromistas: "Cromistas",
  cromista: "Cromistas",
  chromista: "Cromistas",
  chromists: "Cromistas",
  // ── Animalia (sin clasificar a nivel de clase) ────────────────────────────
  animalia: "Animalia",
  animal: "Animalia",
  animals: "Animalia",
  // ── Desconocido / sin datos ───────────────────────────────────────────────
  unknown: "Desconocido",
  desconocido: "Desconocido",
  none: "Desconocido",
  "sin grupo": "Desconocido",
};

// DISPLAY_FIXES ya no es necesario porque el mapa usa directamente
// los nombres con tildes correctas. Se mantiene por compatibilidad
// con registros ya normalizados en la DB que puedan tener la forma antigua.
const TAXONOMIC_GROUP_DISPLAY_FIXES: Record<string, string> = {
  Mamiferos: "Mamíferos",
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

const normalizeDisplayText = (value: string, fallback: string): string => {
  const cleaned = value.trim().replace(NORMALIZED_SPACE_PATTERN, " ");
  if (!cleaned) {
    return fallback;
  }
  return toTitleCase(cleaned);
};

/**
 * Grupos taxonómicos canónicos reconocidos por el sistema.
 * Deben coincidir exactamente con los labels de Fauna.tsx y Flora.tsx.
 * Si se agrega un grupo nuevo al frontend, debe agregarse aquí también.
 */
const CANONICAL_TAXONOMIC_GROUPS = new Set([
  "Aves",
  "Mamíferos",
  "Reptiles",
  "Anfibios",
  "Peces",
  "Insectos",
  "Arácnidos",
  "Moluscos",
  "Animalia",
  "Plantas",
  "Hongos",
  "Protozoos",
  "Cromistas",
  "Desconocido",
]);

const normalizeTaxonomicGroup = (value: string | null): string => {
  if (!value) {
    return "Desconocido";
  }

  const normalizedKey = toAsciiKey(value);
  const mapped = TAXONOMIC_GROUP_MAP[normalizedKey];
  if (mapped) {
    return TAXONOMIC_GROUP_DISPLAY_FIXES[mapped] ?? mapped;
  }

  const title = normalizeDisplayText(value, "Desconocido");
  const fixed = TAXONOMIC_GROUP_DISPLAY_FIXES[title] ?? title;

  // Advertencia explícita: el grupo no está en el mapa canónico.
  // Esto permite detectar nuevos grupos en los logs del ETL y agregarlos
  // al TAXONOMIC_GROUP_MAP antes de que lleguen a producción sin cobertura.
  if (!CANONICAL_TAXONOMIC_GROUPS.has(fixed)) {
    console.warn(
      `[ETL_UNKNOWN_TAXON_GROUP] Grupo taxonómico no reconocido: '${value}' → normalizado como '${fixed}'. Considerar agregar al TAXONOMIC_GROUP_MAP.`,
    );
  }

  return fixed;
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
