/**
 * popup-builders.ts
 *
 * Funciones puras que construyen el HTML de los popups del mapa.
 * Sincronizado con los filtros de Fauna y Flora del proyecto.
 */

// ── Tipos públicos ────────────────────────────────────────────────────────────

type ObservationProperties = Record<string, unknown>;

export type PopupSelection = {
  features: GeoJSON.Feature[];
  coords: [number, number];
  selectedFeatureIndex?: number;
};

// ── Helpers de formato ────────────────────────────────────────────────────────

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatObservedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatAccuracy = (value: unknown): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "No reportada";
  if (value < 10) return `${value.toFixed(1)} m`;
  return `${Math.round(value)} m`;
};

// ── Tokens de diseño ──────────────────────────────────────────────────────────

const COLOR = {
  inat: "#334155",
  drive: "#334155",
  inatBg: "#f8fafc",
  inatBorder: "#e2e8f0",
  driveBg: "#f8fafc",
  driveBorder: "#e2e8f0",
} as const;

const getSourceColor = (source: string) => (source === "iNaturalist" ? COLOR.inat : COLOR.drive);
const getSourceBg = (source: string) => (source === "iNaturalist" ? COLOR.inatBg : COLOR.driveBg);
const getSourceBorder = (source: string) =>
  source === "iNaturalist" ? COLOR.inatBorder : COLOR.driveBorder;
const getSourceLabel = (raw: unknown): string => (raw === "inaturalist" ? "iNaturalist" : "Drive");

// ── Íconos SVG ────────────────────────────────────────────────────────────────

const ICON_LOCATION = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// ── Temas e íconos taxonómicos sincronizados ──────────────────────────────────

interface TaxonTheme {
  color: string;
  bg: string;
  border: string;
}

const TAXON_THEMES: Record<string, TaxonTheme> = {
  aves: { color: "#00a8ff", bg: "#f0f9ff", border: "#e0f2fe" }, // Sky Vivid
  mamiferos: { color: "#ff8c00", bg: "#fff7ed", border: "#ffedd5" }, // Peach Vivid
  reptiles: { color: "#ffcc00", bg: "#fffbeb", border: "#fef3c7" }, // Citrus Vivid
  peces: { color: "#4d7cff", bg: "#eff6ff", border: "#dbeafe" }, // Ocean Vivid
  aracnidos: { color: "#ff4d8d", bg: "#fff1f2", border: "#ffe4e6" }, // Pink Vivid
  anfibios: { color: "#00d68f", bg: "#ecfdf5", border: "#d1fae5" }, // Mint Vivid
  moluscos: { color: "#a865ff", bg: "#faf5ff", border: "#f3e8ff" }, // Lavender Vivid
  animalia: { color: "#7b8ea3", bg: "#f8fafc", border: "#f1f5f9" }, // Slate Vivid
  plantas: { color: "#3ddf5c", bg: "#f0fdf4", border: "#dcfce7" }, // Leaf Vivid
  hongos: { color: "#ff9f43", bg: "#fffaf0", border: "#ffedd5" }, // Terra Vivid
};

const DEFAULT_THEME: TaxonTheme = { color: "#475569", bg: "#f8fafc", border: "#e2e8f0" };

const TAXON_PATTERNS = [
  { pattern: /ave|bird/, key: "aves" },
  { pattern: /mamif|mammal|rabbit/, key: "mamiferos" },
  { pattern: /reptil|chameleo|lagarto/, key: "reptiles" },
  { pattern: /pez|fish/, key: "peces" },
  { pattern: /aracn|spider|arana/, key: "aracnidos" },
  { pattern: /anfibio|frog|rana/, key: "anfibios" },
  { pattern: /molusc|snail|caracol/, key: "moluscos" },
  { pattern: /hongo|mushroom|fungi/, key: "hongos" },
  { pattern: /plant|flora|leaf/, key: "plantas" },
  { pattern: /animalia/, key: "animalia" },
] as const;

const getTaxonKey = (group: string): string | null => {
  const normalized = group
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const { pattern, key } of TAXON_PATTERNS) {
    if (pattern.test(normalized)) return key;
  }
  return null;
};

const getTaxonTheme = (group: string): TaxonTheme => {
  const key = getTaxonKey(group);
  return (key && TAXON_THEMES[key as keyof typeof TAXON_THEMES]) || DEFAULT_THEME;
};

const TAXON_ICONS: Record<string, string> = {
  aves: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7c.5 0 1 .1 1.5.3M16 7c-.5 0-1-.1-1.5-.3M16 7v4m0 0a4 4 0 0 1-8 0V7m8 4h3m-11 0H5m4-4c-.5 0-1-.1-1.5-.3M9 7c.5 0 1-.1 1.5.3M9 7v4"/><path d="M12 11v8m0 0H9m3 0h3"/></svg>`,
  mamiferos: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 16a3 3 0 0 1 2.24 5"/><path d="M18 12h.01"/><path d="M18 21v-4a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4"/><path d="M20 9.13A9 9 0 0 0 15 3a9 9 0 0 0-6 6.13"/><path d="M6 12h.01"/><path d="M8.76 21a3 3 0 0 0-2.24-5"/></svg>`,
  reptiles: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"/><path d="M12 13v9"/><path d="M12 2v4"/><path d="M3 11c0 3 2.5 5 5 5h8c2.5 0 5-2 5-5"/><path d="M7 16v4"/><path d="M17 16v4"/></svg>`,
  peces: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.966 0 1.75-.784 1.75-1.75s-.784-1.75-1.75-1.75-1.75.784-1.75 1.75.784 1.75 1.75 1.75Z"/><path d="M2 16s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z"/><path d="M22 12l-3-3v6l3-3Z"/></svg>`,
  aracnidos: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M12 9v-5"/><path d="M12 15v5"/><path d="M9 12h-5"/><path d="M15 12h5"/><path d="M10 10l-4-4"/><path d="M14 10l4-4"/><path d="M10 14l-4 4"/><path d="M14 14l4 4"/></svg>`,
  anfibios: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/><path d="M18.2 8.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  moluscos: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21h18c2 0 2-2 2-2v-4c0-4-3-7-7-7H7c-4 0-7 3-7 7v4c0 2 2 2 2 2Z"/><path d="M12 10V5"/><path d="M8 10V7"/><path d="M16 10V7"/></svg>`,
  plantas: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  hongos: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a9 9 0 0 0-9 9c0 2.5 1 4.7 2.6 6.3.4.4.4 1 0 1.4L4 20h16l-1.6-1.3c-.4-.4-.4-1 0-1.4C20 15.7 21 13.5 21 11a9 9 0 0 0-9-9Z"/><path d="M10 20h4"/></svg>`,
  animalia: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="9" cy="10" r="2"/><path d="M9 14c0 6 3 8 3 8s3-2 3-8"/></svg>`,
};

const getTaxonIcon = (group: string): string => {
  const key = getTaxonKey(group);
  return (key && TAXON_ICONS[key]) || TAXON_ICONS.plantas || "";
};

// ── Fragmentos compartidos ────────────────────────────────────────────────────

const buildPopupHeader = (_coords?: [number, number], counterHtml = ""): string => `
  <div style="padding: 20px 20px 18px; position: relative; overflow: hidden; flex-shrink: 0;">
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:${counterHtml ? "16px" : "0"}; position:relative; z-index:1;">
      <div style="display:flex; align-items:center; gap:14px; min-width:0; flex:1;">
        <div style="
          background: linear-gradient(145deg, #818cf8 0%, #4f46e5 100%);
          width: 46px; height: 46px; border-radius: 18px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(99,102,241,0.3), 0 8px 24px rgba(99,102,241,0.25);
        ">${ICON_LOCATION}</div>
        <div style="min-width:0; flex:1; overflow:hidden; -webkit-font-smoothing:antialiased;">
          <div style="
            font-size:9.5px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase;
            background:linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(99,102,241,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%);
            background-size:200% auto;
            -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
            animation: popup-shimmer 6s linear infinite;
            margin:0 0 4px 0;
          ">Ubicación</div>
          <div class="popup-loc-country" style="font-size:17px; font-weight:800; color:#0f172a; line-height:1.15; letter-spacing:-0.025em; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Colombia</div>
          <div class="popup-loc-detail" style="font-size:12px; font-weight:400; color:#94a3b8; line-height:1.3; margin:4px 0 0 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Buscando ubicación...</div>
        </div>
      </div>
      <button type="button" class="close-list-btn" aria-label="Cerrar" style="
        flex-shrink:0; width:34px; height:34px; border-radius:14px;
        background:linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%);
        border:1px solid rgba(255,255,255,0.9);
        color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center;
        box-shadow: 0 2px 4px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04);
        backdrop-filter:blur(8px); transition:all 0.3s cubic-bezier(0.16,1,0.3,1); pointer-events:auto;
      ">${ICON_CLOSE}</button>
    </div>
    ${counterHtml}
  </div>`;

// ── Popup de detalle individual ───────────────────────────────────────────────

const buildSingleObservationPopup = (
  properties: ObservationProperties,
  coords?: [number, number],
): string => {
  const sourceLabel = getSourceLabel(properties.source);
  const sourceColor = getSourceColor(sourceLabel);
  const scientificName =
    typeof properties.scientificName === "string" ? properties.scientificName : "Sin especie";
  const taxonomicGroup =
    typeof properties.taxonomicGroup === "string" ? properties.taxonomicGroup : "General";
  const observedAt =
    typeof properties.observedAt === "string"
      ? formatObservedAt(properties.observedAt)
      : "Fecha desconocida";
  const accuracy = formatAccuracy(properties.accuracy);

  return `
    <div class="popup-entrance map-popup-root" style="font-family:'Poppins',system-ui,sans-serif; display:flex; flex-direction:column;">
      ${buildPopupHeader(coords)}
      <div style="padding:16px 20px 0; flex-shrink:0;">
        <div style="font-size:18px; font-weight:800; color:#0f172a; line-height:1.25; letter-spacing:-0.02em; margin-bottom:10px;">${escapeHtml(scientificName)}</div>
        <div style="display:inline-flex; align-items:center; gap:5px; background:${getSourceBg(sourceLabel)}; border:1px solid ${getSourceBorder(sourceLabel)}; color:${sourceColor}; padding:3px 10px; border-radius:99px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em;"><span style="width:5px;height:5px;border-radius:50%;background:${sourceColor};flex-shrink:0;"></span>${escapeHtml(taxonomicGroup)}</div>
      </div>
      <div style="padding:14px 20px 16px; display:flex; flex-direction:column; gap:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;"><span style="font-size:12px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Fuente</span><span style="font-size:13px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:${sourceColor};display:inline-block;"></span>${escapeHtml(sourceLabel)}</span></div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;"><span style="font-size:12px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Precisión GPS</span><span style="font-size:13px; font-weight:700; color:#0f172a;">${escapeHtml(accuracy)}</span></div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0;"><span style="font-size:12px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Observado</span><span style="font-size:13px; font-weight:700; color:#0f172a;">${escapeHtml(observedAt)}</span></div>
      </div>
    </div>`;
};

// ── Fila individual de la lista ───────────────────────────────────────────────

const buildObservationListItem = (properties: ObservationProperties, index: number): string => {
  const scientificName =
    typeof properties.scientificName === "string" ? properties.scientificName : "Sin especie";
  const taxonomicGroup =
    typeof properties.taxonomicGroup === "string" ? properties.taxonomicGroup : "";
  const taxonTheme = getTaxonTheme(taxonomicGroup);
  const taxonIcon = getTaxonIcon(taxonomicGroup);

  return `
    <div class="observation-item" data-index="${index}" style="
      padding: 13px 20px;
      cursor: pointer;
      box-sizing: border-box;
      width: 100%;
      background: transparent;
      perspective: 1000px;
      position: relative;
    ">
      <div class="obs-item-card" style="
        display: flex;
        align-items: center;
        gap: 18px;
        width: 100%;
        padding: 16px 20px;
        background: #ffffff;
        border-radius: 28px;
        border: none;
        box-shadow: 
          0 4px 12px rgba(15, 23, 42, 0.03),
          0 8px 24px rgba(15, 23, 42, 0.05);
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      ">
        <!-- Efecto de Brillo Ultra-Premium -->
        <div class="obs-item-glow" style="
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform: translateX(-100%);
          transition: transform 0.8s ease;
          pointer-events: none;
          z-index: 2;
        "></div>

        <!-- Avatar Taxonómico — Diseño de Élite -->
        <div style="
          width: 52px; height: 52px;
          border-radius: 20px;
          flex-shrink: 0;
          background: ${taxonTheme.bg};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${taxonTheme.color};
          border: 1.5px solid ${taxonTheme.border};
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px ${taxonTheme.bg};
          position: relative;
          z-index: 1;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        " class="obs-avatar">
          ${taxonIcon}
        </div>

        <!-- Info Principal -->
        <div style="flex: 1; min-width: 0; position: relative; z-index: 1;">
          <div style="
            font-size: 15.5px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.3;
            letter-spacing: -0.02em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 6px;
          ">${escapeHtml(scientificName)}</div>
          
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: ${taxonTheme.bg};
              color: ${taxonTheme.color};
              padding: 4px 12px;
              border-radius: 10px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              border: 1px solid ${taxonTheme.border};
              box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            ">
              ${escapeHtml(taxonomicGroup)}
            </div>
          </div>
        </div>

        <!-- Botón de Acción — Squircle Premium -->
        <div class="obs-item-action" style="
          width: 34px; height: 34px;
          border-radius: 14px;
          background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          color: #94a3b8;
          box-shadow: 0 2px 4px rgba(15,23,42,0.04);
          flex-shrink: 0;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    </div>`;
};

// ── Popup de lista ────────────────────────────────────────────────────────────

const buildObservationListPopup = (
  features: GeoJSON.Feature[],
  coords?: [number, number],
): string => {
  const itemsHtml = features
    .map((f, i) => buildObservationListItem((f.properties as ObservationProperties) ?? {}, i))
    .join("");
  const counterHtml = `
    <div style="
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 16px;
      background:rgba(255,255,255,0.6);
      backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
      border-radius:20px;
      border:1px solid rgba(255,255,255,0.8);
      box-shadow: 0 2px 4px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1);
    ">
      <div>
        <div style="
          font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
          background:linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(99,102,241,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation: popup-shimmer 6s linear infinite; animation-delay:-3s;
          margin-bottom:6px;
        ">Observaciones</div>
        <div style="
          font-size:38px; font-weight:900; letter-spacing:-0.04em; line-height:1;
          background:linear-gradient(90deg, #1e293b 0%, #334155 25%, #6366f1 50%, #334155 75%, #1e293b 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation: popup-num-shimmer 3.5s linear infinite;
        ">${features.length}</div>
      </div>
    <div style="
      display: inline-flex; align-items: center; gap: 8px;
      background: #ffffff; padding: 10px 18px; border-radius: 99px;
      box-shadow: 0 4px 12px rgba(15,23,42,0.06), inset 0 0 0 1px rgba(15,23,42,0.02);
    ">
      <span class="popup-active-dot" style="width:10px; height:10px; border-radius:50%; background:#10b981; position:relative; z-index:1;"></span>
      <span style="font-size:10px; font-weight:800; color:#1e293b; letter-spacing:0.12em; text-transform:uppercase;">EN VIVO</span>
    </div>
    </div>`;

  return `
    <style>
      @keyframes popup-shimmer {
        0%   { background-position: -200% center; }
        100% { background-position:  200% center; }
      }
      @keyframes popup-num-shimmer {
        0%   { background-position: 100% center; }
        100% { background-position: -100% center; }
      }
      @keyframes popup-live-ring {
        0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.6), 0 0 8px rgba(16,185,129,0.5); }
        70%  { box-shadow: 0 0 0 5px rgba(16,185,129,0),   0 0 8px rgba(16,185,129,0.3); }
        100% { box-shadow: 0 0 0 0   rgba(16,185,129,0),   0 0 8px rgba(16,185,129,0.5); }
      }
    </style>
    <div class="popup-entrance map-popup-root" style="
      font-family:'Poppins',system-ui,sans-serif;
      display:flex; flex-direction:column;
      height:auto; max-height:560px;
      background:linear-gradient(155deg, rgba(255,255,255,0.96) 0%, rgba(245,247,255,0.92) 50%, rgba(240,245,255,0.90) 100%);
    ">
      ${buildPopupHeader(coords, counterHtml)}
      <div style="height:1px; margin:0 20px; background:linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.15) 70%, transparent 100%);"></div>
      <div class="custom-scroll map-popup-scroll" style="max-height:350px; overflow-y:auto; overflow-x:hidden; min-height:0; padding:8px 0 8px;">${itemsHtml}</div>
    </div>`;
};

// ── Dispatcher ────────────────────────────────────────────────────────────────

export const buildPopupFromSelection = (selection: {
  features: GeoJSON.Feature[];
  coords: [number, number];
  selectedFeatureIndex?: number;
}): string => {
  const selectedFeature =
    typeof selection.selectedFeatureIndex === "number"
      ? selection.features[selection.selectedFeatureIndex]
      : selection.features.length === 1
        ? selection.features[0]
        : null;
  if (selectedFeature)
    return buildSingleObservationPopup(
      (selectedFeature.properties as ObservationProperties) ?? {},
      selection.coords,
    );
  return buildObservationListPopup(selection.features, selection.coords);
};
