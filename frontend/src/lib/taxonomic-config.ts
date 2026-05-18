import { Bird, Bug, CircleHelp, Fish, Leaf, PawPrint, Rabbit } from "lucide-react";
import type { ElementType } from "react";
import {
  ChameleonIcon,
  FrogIcon,
  MushroomIcon,
  SnailIcon,
  SpiderIcon,
} from "../components/icons/CustomIcons";

export type TaxonomicTheme = {
  icon: ElementType;
  /** SVG inline string — paths extraídos 1:1 del componente React correspondiente. */
  svg: string;
  color: string;
  lightBg: string;
  ring: string;
  shadow: string;
  hex: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// TAXONOMIC_CONFIG
//
// Regla de oro: el campo `svg` DEBE ser idéntico al ícono React que usa `icon`.
// Los paths se extraen directamente de lucide-react v1.14.0 (dist/esm/icons/*.mjs)
// y de CustomIcons.tsx. NO inventar paths.
// ─────────────────────────────────────────────────────────────────────────────
export const TAXONOMIC_CONFIG = {
  // ── Lucide: Bird ──────────────────────────────────────────────────────────
  Aves: {
    icon: Bird,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>`,
    color: "bg-sky-500",
    lightBg: "bg-sky-50",
    ring: "ring-sky-500/20",
    shadow: "shadow-[0_4px_12px_rgba(14,165,233,0.3)]",
    hex: "#0ea5e9",
  },

  // ── Lucide: Rabbit ────────────────────────────────────────────────────────
  Mamíferos: {
    icon: Rabbit,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 16a3 3 0 0 1 2.24 5"/><path d="M18 12h.01"/><path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3"/><path d="M20 8.54V4a2 2 0 1 0-4 0v3"/><path d="M7.612 12.524a3 3 0 1 0-1.6 4.3"/></svg>`,
    color: "bg-orange-500",
    lightBg: "bg-orange-50",
    ring: "ring-orange-500/20",
    shadow: "shadow-[0_4px_12px_rgba(249,115,22,0.3)]",
    hex: "#f97316",
  },

  // ── CustomIcons: ChameleonIcon ────────────────────────────────────────────
  Reptiles: {
    icon: ChameleonIcon,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 22c-5 0-9-4.5-9-10S6 2 11 2c2.2 0 4.2.9 5.7 2.3L19.3 2c3.1 3.1 3.5 7.9 1.3 11.4-.6.9-1.9.9-2.7.1l-1.2-1.2C15.2 10.9 13.2 10 11 10a6 6 0 0 0 0 12 4 4 0 0 0 0-8 2 2 0 0 0 0 4"/><circle cx="14.5" cy="7" r="3.5"/><path d="M14 7h.01"/><path d="M8 10.8 6 10l1-2"/><path d="M22 22a2 2 0 0 1-2-2v-6.1"/></svg>`,
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    ring: "ring-emerald-500/20",
    shadow: "shadow-[0_4px_12px_rgba(16,185,129,0.3)]",
    hex: "#10b981",
  },

  // ── Lucide: Fish ──────────────────────────────────────────────────────────
  Peces: {
    icon: Fish,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/><path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/><path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/><path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98"/></svg>`,
    color: "bg-indigo-500",
    lightBg: "bg-indigo-50",
    ring: "ring-indigo-500/20",
    shadow: "shadow-[0_4px_12px_rgba(99,102,241,0.3)]",
    hex: "#6366f1",
  },

  // ── CustomIcons: SpiderIcon ───────────────────────────────────────────────
  Arácnidos: {
    icon: SpiderIcon,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5v1"/><path d="M14 6V5"/><path d="M10 10.4V8a2 2 0 1 1 4 0v2.4"/><path d="M7 15H4l-2 2.5"/><path d="M7.42 17 5 20l1 2"/><path d="m8 12-4-1-2-3"/><path d="M9 11 5.5 6 7 2"/><path d="M8 18a5 5 0 1 1 8 0s-2 3-4 4c-2-1-4-4-4-4"/><path d="m15 11 3.5-5L17 2"/><path d="m16 12 4-1 2-3"/><path d="M17 15h3l2 2.5"/><path d="M16.57 17 19 20l-1 2"/></svg>`,
    color: "bg-rose-500",
    lightBg: "bg-rose-50",
    ring: "ring-rose-500/20",
    shadow: "shadow-[0_4px_12px_rgba(244,63,94,0.3)]",
    hex: "#f43f5e",
  },

  // ── CustomIcons: FrogIcon ─────────────────────────────────────────────────
  Anfibios: {
    icon: FrogIcon,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h.01"/><circle cx="6" cy="7" r="4"/><path d="M14.4 5.3a10 10 0 0 0-4.8 0"/><circle cx="18" cy="7" r="4"/><path d="M18 7h.01"/><path d="M22 13.5C22 16 17.5 18 12 18S2 16 2 13.5"/><path d="M10 14h.01"/><path d="M14 14h.01"/><path d="M3.1 9.75A7 7 0 0 0 2 13.5C2 18.2 6.5 22 12 22s10-3.8 10-8.5a7 7 0 0 0-1.1-3.75"/></svg>`,
    color: "bg-lime-500",
    lightBg: "bg-lime-50",
    ring: "ring-lime-500/20",
    shadow: "shadow-[0_4px_12px_rgba(132,204,22,0.3)]",
    hex: "#84cc16",
  },

  // ── CustomIcons: SnailIcon ────────────────────────────────────────────────
  Moluscos: {
    icon: SnailIcon,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 13a6 6 0 1 0 12 0 4 4 0 1 0-8 0 2 2 0 0 0 4 0"/><circle cx="10" cy="13" r="8"/><path d="M2 21h12c4.4 0 8-3.6 8-8V7a2 2 0 1 0-4 0v6"/><path d="M18 3 19.1 5.2"/><path d="M22 3 20.9 5.2"/></svg>`,
    color: "bg-fuchsia-500",
    lightBg: "bg-fuchsia-50",
    ring: "ring-fuchsia-500/20",
    shadow: "shadow-[0_4px_12px_rgba(217,70,239,0.3)]",
    hex: "#d946ef",
  },

  // ── Lucide: Bug ───────────────────────────────────────────────────────────
  Insectos: {
    icon: Bug,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-9"/><path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"/><path d="M14.12 3.88 16 2"/><path d="M21 21a4 4 0 0 0-3.81-4"/><path d="M21 5a4 4 0 0 1-3.55 3.97"/><path d="M22 13h-4"/><path d="M3 21a4 4 0 0 1 3.81-4"/><path d="M3 5a4 4 0 0 0 3.55 3.97"/><path d="M6 13H2"/><path d="m8 2 1.88 1.88"/><path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"/></svg>`,
    color: "bg-amber-500",
    lightBg: "bg-amber-50",
    ring: "ring-amber-500/20",
    shadow: "shadow-[0_4px_12px_rgba(245,158,11,0.3)]",
    hex: "#f59e0b",
  },

  // ── Lucide: Leaf ──────────────────────────────────────────────────────────
  Plantas: {
    icon: Leaf,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
    color: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    ring: "ring-emerald-500/20",
    shadow: "shadow-[0_4px_12px_rgba(16,185,129,0.3)]",
    hex: "#10b981",
  },

  // ── CustomIcons: MushroomIcon ─────────────────────────────────────────────
  Hongos: {
    icon: MushroomIcon,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12C3 7 7 3 12 3C17 3 21 7 21 12Z"/><path d="M3 12C5 13 7 13.5 9 13.5C10 13.5 10 15 10 15"/><path d="M21 12C19 13 17 13.5 15 13.5C14 13.5 14 15 14 15"/><path d="M10 15C10 15 9.5 20 12 20C14.5 20 14 15 14 15"/><path d="M9 20C9 21.1 10.3 22 12 22C13.7 22 15 21.1 15 20"/><circle cx="9" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="6" r="0.8" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="11" cy="10" r="0.6" fill="currentColor" stroke="none"/><circle cx="14" cy="10.5" r="0.6" fill="currentColor" stroke="none"/></svg>`,
    color: "bg-amber-600",
    lightBg: "bg-amber-50",
    ring: "ring-amber-600/20",
    shadow: "shadow-[0_4px_12px_rgba(217,119,6,0.3)]",
    hex: "#d97706",
  },

  // ── Lucide: PawPrint ──────────────────────────────────────────────────────
  Animalia: {
    icon: PawPrint,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>`,
    color: "bg-violet-500",
    lightBg: "bg-violet-50",
    ring: "ring-violet-500/20",
    shadow: "shadow-[0_4px_12px_rgba(139,92,246,0.3)]",
    hex: "#8b5cf6",
  },

  // ── Lucide: CircleHelp (= CircleQuestionMark) ─────────────────────────────
  Protozoos: {
    icon: CircleHelp,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    color: "bg-blue-600",
    lightBg: "bg-blue-50",
    ring: "ring-blue-600/20",
    shadow: "shadow-[0_4px_12px_rgba(37,99,235,0.3)]",
    hex: "#2563eb",
  },

  Cromistas: {
    icon: CircleHelp,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    color: "bg-pink-600",
    lightBg: "bg-pink-50",
    ring: "ring-pink-600/20",
    shadow: "shadow-[0_4px_12px_rgba(219,39,119,0.3)]",
    hex: "#db2777",
  },

  Desconocido: {
    icon: CircleHelp,
    svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
    color: "bg-slate-500",
    lightBg: "bg-slate-50",
    ring: "ring-slate-500/20",
    shadow: "shadow-[0_4px_12px_rgba(100,116,139,0.3)]",
    hex: "#64748b",
  },
} satisfies Record<string, TaxonomicTheme>;

export const DEFAULT_TAXONOMIC_THEME: TaxonomicTheme = TAXONOMIC_CONFIG.Desconocido;

const normalizeStr = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const getTaxonomicTheme = (groupName: string): TaxonomicTheme => {
  const normalized = normalizeStr(groupName);

  // Mapeos por patrón — prioridad: coincidencias más específicas primero
  if (/ave|bird/i.test(normalized)) return TAXONOMIC_CONFIG.Aves;
  if (/mamif|mammal|rabbit/i.test(normalized)) return TAXONOMIC_CONFIG.Mamíferos;
  if (/reptil|chameleo|lagarto|squamat|testudin|crocodil/i.test(normalized))
    return TAXONOMIC_CONFIG.Reptiles;
  if (/pez|fish|actinoptery|elasmobranch|shark/i.test(normalized)) return TAXONOMIC_CONFIG.Peces;
  if (/aracn|spider|arana|arachnid|scorpion/i.test(normalized)) return TAXONOMIC_CONFIG.Arácnidos;
  if (/anfibio|frog|rana|amphibi|caudata/i.test(normalized)) return TAXONOMIC_CONFIG.Anfibios;
  if (
    /insect|insecto|arthropod/i.test(normalized) ||
    /\bants?\b|\bbee\b|\bbutterfly\b|\bwasp\b/i.test(normalized)
  )
    return TAXONOMIC_CONFIG.Insectos;
  if (/molusc|snail|caracol|mollusc|cephalopod/i.test(normalized)) return TAXONOMIC_CONFIG.Moluscos;
  if (/hongo|mushroom|fungi|basidio|ascomy/i.test(normalized)) return TAXONOMIC_CONFIG.Hongos;
  if (/plant|flora|leaf|tracheophyta|bryophyta|magnoliophy/i.test(normalized))
    return TAXONOMIC_CONFIG.Plantas;
  if (/protozoo|protozoa|amoeba/i.test(normalized)) return TAXONOMIC_CONFIG.Protozoos;
  if (/cromist|chromist|kelp|diatom/i.test(normalized)) return TAXONOMIC_CONFIG.Cromistas;
  if (/animalia|animal|chordata|invertebrat/i.test(normalized)) return TAXONOMIC_CONFIG.Animalia;
  if (/sin clasificar|desconocido|unknown|null|undefined/i.test(normalized))
    return TAXONOMIC_CONFIG.Desconocido;

  // Mapeo directo por nombre normalizado (para grupos ODK/Drive con nombre exacto)
  const exactMatch = Object.entries(TAXONOMIC_CONFIG).find(
    ([key]) => normalizeStr(key) === normalized,
  );

  return exactMatch ? (exactMatch[1] as TaxonomicTheme) : DEFAULT_TAXONOMIC_THEME;
};
