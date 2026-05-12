/**
 * popup-builders.ts
 *
 * Funciones puras que construyen el HTML de los popups del mapa.
 * Sincronizado con los filtros de Fauna y Flora del proyecto.
 *
 * Principios de diseño 2026:
 * - Los avatares taxonómicos usan fondo sólido (hex) + ícono blanco,
 *   idéntico al estado "seleccionado" en los filtros Fauna y Flora.
 * - Los colores, íconos SVG y sombras provienen exclusivamente de
 *   getTaxonomicTheme() → TAXONOMIC_CONFIG (fuente única de verdad).
 * - El badge del grupo muestra el ícono SVG + nombre, igual que los filtros.
 */
import { getTaxonomicTheme } from "../../lib/taxonomic-config";

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

// ── Helpers de color ──────────────────────────────────────────────────────────

/** Convierte un hex (#rrggbb) a rgba con la opacidad dada (0–1). */
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getSourceLabel = (raw: unknown): string => (raw === "inaturalist" ? "iNaturalist" : "Drive");

// ── Tema taxonómico (fuente única de verdad) ──────────────────────────────────

/**
 * Devuelve los tokens de diseño para un grupo taxonómico.
 * Alineado con TAXONOMIC_CONFIG en taxonomic-config.ts.
 */
const getTaxonTokens = (group: string) => {
  const theme = getTaxonomicTheme(group);
  return {
    hex: theme.hex,
    /** Fondo sólido para avatar (igual que estado seleccionado en Fauna/Flora). */
    avatarBg: theme.hex,
    /** Sombra del avatar usando el color del grupo. */
    avatarShadow: `0 4px 12px ${hexToRgba(theme.hex, 0.35)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
    /** Fondo translúcido para badges y chips. */
    chipBg: `${theme.hex}1a`, // ~10% opacidad
    chipBorder: `${theme.hex}33`, // ~20% opacidad
    /** SVG del ícono con stroke blanco (para avatar sólido). */
    svgWhite: theme.svg.replace(/stroke="currentColor"/g, 'stroke="#ffffff"'),
    /** SVG del ícono con stroke del color del grupo (para badges). */
    svgColored: theme.svg.replace(/stroke="currentColor"/g, `stroke="${theme.hex}"`),
  };
};

// ── Íconos SVG del sistema ────────────────────────────────────────────────────

const ICON_LOCATION = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_CLOSE = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// ── Header compartido ─────────────────────────────────────────────────────────

const buildPopupHeader = (_coords?: [number, number], counterHtml = ""): string => `
  <div style="padding:20px 20px 18px; position:relative; overflow:hidden; flex-shrink:0;">
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:${counterHtml ? "16px" : "0"}; position:relative; z-index:1;">
      <div style="display:flex; align-items:center; gap:14px; min-width:0; flex:1;">
        <div style="
          background:linear-gradient(145deg, #818cf8 0%, #4f46e5 100%);
          width:46px; height:46px; border-radius:18px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 6px rgba(99,102,241,0.3), 0 8px 24px rgba(99,102,241,0.25);
        ">${ICON_LOCATION}</div>
        <div style="min-width:0; flex:1; overflow:hidden; -webkit-font-smoothing:antialiased;">
          <div style="
            font-size:9.5px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase;
            background:linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(99,102,241,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%);
            background-size:200% auto;
            -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
            animation:popup-shimmer 8s linear infinite;
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
        box-shadow:0 2px 4px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04);
        backdrop-filter:blur(8px); transition:all 0.3s cubic-bezier(0.16,1,0.3,1); pointer-events:auto;
      ">${ICON_CLOSE}</button>
    </div>
    ${counterHtml}
  </div>`;

// ── Popup de detalle individual ───────────────────────────────────────────────

export const buildSingleObservationPopup = (
  feature: GeoJSON.Feature,
  coords: [number, number],
): string => {
  const props = (feature.properties as ObservationProperties) ?? {};
  const sourceLabel = getSourceLabel(props.source);
  const scientificName =
    typeof props.scientificName === "string" ? props.scientificName : "Sin especie";
  const taxonomicGroup =
    typeof props.taxonomicGroup === "string" ? props.taxonomicGroup : "Desconocido";
  const observedAt =
    typeof props.observedAt === "string" ? formatObservedAt(props.observedAt) : "Fecha desconocida";
  const accuracy = formatAccuracy(props.accuracy);

  const tokens = getTaxonTokens(taxonomicGroup);

  // Color del punto de fuente: verde para iNaturalist, azul para Drive
  const sourceColor = sourceLabel === "iNaturalist" ? "#10b981" : "#0ea5e9";

  return `
    <div class="popup-entrance map-popup-root" style="font-family:'Poppins',system-ui,sans-serif; display:flex; flex-direction:column;">
      ${buildPopupHeader(coords)}

      <!-- Nombre científico + badge taxonómico -->
      <div style="padding:16px 20px 0; flex-shrink:0;">
        <div style="
          font-size:18px; font-weight:800; color:#0f172a;
          line-height:1.25; letter-spacing:-0.02em; margin-bottom:12px;
        ">${escapeHtml(scientificName)}</div>

        <!-- Badge taxonómico: fondo sólido del color del grupo + ícono blanco + nombre -->
        <div style="
          display:inline-flex; align-items:center; gap:8px;
          background:${tokens.avatarBg};
          border:none;
          padding:6px 14px 6px 8px;
          border-radius:12px;
          box-shadow:${tokens.avatarShadow};
        ">
          <!-- Ícono SVG con stroke blanco -->
          <div style="
            width:22px; height:22px; flex-shrink:0;
            display:flex; align-items:center; justify-content:center;
          ">${tokens.svgWhite}</div>
          <span style="
            font-size:11px; font-weight:800; text-transform:uppercase;
            letter-spacing:0.07em; color:#ffffff;
            text-shadow:0 1px 2px rgba(0,0,0,0.2);
          ">${escapeHtml(taxonomicGroup)}</span>
        </div>
      </div>

      <!-- Filas de datos -->
      <div style="padding:14px 20px 16px; display:flex; flex-direction:column; gap:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <span style="font-size:12px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Fuente</span>
          <span style="font-size:13px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:6px;">
            <span style="width:7px; height:7px; border-radius:50%; background:${sourceColor}; display:inline-block; box-shadow:0 0 0 2px ${hexToRgba(sourceColor, 0.2)};"></span>
            ${escapeHtml(sourceLabel)}
          </span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <span style="font-size:12px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Precisión GPS</span>
          <span style="font-size:13px; font-weight:700; color:#0f172a;">${escapeHtml(accuracy)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0;">
          <span style="font-size:12px; font-weight:500; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em;">Observado</span>
          <span style="font-size:13px; font-weight:700; color:#0f172a;">${escapeHtml(observedAt)}</span>
        </div>
      </div>
    </div>`;
};

// ── Fila individual de la lista ───────────────────────────────────────────────

const buildObservationListItem = (properties: ObservationProperties, index: number): string => {
  const scientificName =
    typeof properties.scientificName === "string" ? properties.scientificName : "Sin especie";
  const taxonomicGroup =
    typeof properties.taxonomicGroup === "string" ? properties.taxonomicGroup : "Desconocido";

  const tokens = getTaxonTokens(taxonomicGroup);

  return `
    <div class="observation-item" data-index="${index}" style="
      padding:10px 20px;
      cursor:pointer;
      box-sizing:border-box;
      width:100%;
      background:transparent;
      position:relative;
    ">
      <div class="obs-item-card" style="
        display:flex;
        align-items:center;
        gap:16px;
        width:100%;
        padding:14px 16px;
        background:#ffffff;
        border-radius:24px;
        border:none;
        box-shadow:
          0 4px 12px rgba(15,23,42,0.03),
          0 8px 24px rgba(15,23,42,0.05),
          0 0 0 1.5px rgba(241,245,249,0.9);
        transition:all 0.45s cubic-bezier(0.16,1,0.3,1);
        position:relative;
        overflow:hidden;
      ">
        <!-- Efecto de brillo al hover -->
        <div class="obs-item-glow" style="
          position:absolute;
          top:0; left:0; width:100%; height:100%;
          background:linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform:translateX(-100%);
          transition:transform 0.7s ease;
          pointer-events:none;
          z-index:2;
        "></div>

        <!--
          Avatar taxonómico — fondo sólido con el color del grupo (igual que
          estado "seleccionado" en los filtros Fauna y Flora) + ícono blanco.
        -->
        <div class="obs-avatar" style="
          width:48px; height:48px;
          border-radius:18px;
          flex-shrink:0;
          background:${tokens.avatarBg};
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:${tokens.avatarShadow};
          position:relative;
          z-index:1;
          transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
        ">
          ${tokens.svgWhite}
        </div>

        <!-- Info principal -->
        <div style="flex:1; min-width:0; position:relative; z-index:1;">
          <!-- Nombre científico -->
          <div style="
            font-size:15px;
            font-weight:800;
            color:#0f172a;
            line-height:1.3;
            letter-spacing:-0.02em;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            margin-bottom:7px;
          ">${escapeHtml(scientificName)}</div>

          <!-- Badge del grupo taxonómico -->
          <div style="
            display:inline-flex;
            align-items:center;
            background:${tokens.chipBg};
            color:${tokens.hex};
            padding:4px 10px;
            border-radius:10px;
            font-size:10px;
            font-weight:800;
            text-transform:uppercase;
            letter-spacing:0.08em;
            border:1px solid ${tokens.chipBorder};
          ">
            ${escapeHtml(taxonomicGroup)}
          </div>
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
      box-shadow:0 2px 4px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1);
    ">
      <div>
        <div style="
          font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
          background:linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(99,102,241,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation:popup-shimmer 8s linear infinite; animation-delay:-1s;
          margin-bottom:6px;
        ">Observaciones</div>
        <div style="
          font-size:38px; font-weight:900; letter-spacing:-0.04em; line-height:1;
          background:linear-gradient(90deg, #1e293b 0%, #334155 25%, #6366f1 50%, #334155 75%, #1e293b 100%);
          background-size:200% auto;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          animation:popup-num-shimmer 8s linear infinite;
          animation-delay:-4s;
        ">${features.length}</div>
      </div>
      <div style="
        display:inline-flex; align-items:center; gap:8px;
        background:#ffffff; padding:10px 18px; border-radius:99px;
        box-shadow:0 4px 12px rgba(15,23,42,0.06), inset 0 0 0 1px rgba(15,23,42,0.02);
      ">
        <span class="popup-active-dot" style="
          width:10px; height:10px; border-radius:50%; background:#10b981;
          position:relative; z-index:1;
          box-shadow:0 0 0 2px rgba(16,185,129,0.2), 0 0 8px rgba(16,185,129,0.4);
        "></span>
        <span style="font-size:10px; font-weight:800; color:#1e293b; letter-spacing:0.12em; text-transform:uppercase;">EN VIVO</span>
      </div>
    </div>`;

  return `
    <style>
      @keyframes popup-shimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes popup-num-shimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes popup-live-ring {
        0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.6), 0 0 8px rgba(16,185,129,0.5); }
        70%  { box-shadow: 0 0 0 5px rgba(16,185,129,0),   0 0 8px rgba(16,185,129,0.3); }
        100% { box-shadow: 0 0 0 0   rgba(16,185,129,0),   0 0 8px rgba(16,185,129,0.5); }
      }
      /* Hover en tarjeta de observación */
      .obs-item-card:hover {
        box-shadow:
          0 8px 24px rgba(15,23,42,0.07),
          0 16px 40px rgba(15,23,42,0.08),
          0 0 0 1.5px rgba(226,232,240,0.9) !important;
        transform: translateY(-2px);
      }
      .obs-item-card:hover .obs-item-glow {
        transform: translateX(100%);
      }
      .obs-item-card:hover .obs-avatar {
        transform: scale(1.08);
      }
      .obs-item-card:hover .obs-item-action {
        background: linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%);
        color: #475569;
        transform: translateX(2px);
      }
      /* Punto EN VIVO pulsante */
      .popup-active-dot {
        animation: popup-live-ring 2.2s ease-out infinite;
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
      <div class="custom-scroll map-popup-scroll" style="max-height:350px; overflow-y:auto; overflow-x:hidden; min-height:0; padding:6px 0 8px;">
        ${itemsHtml}
      </div>
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

  if (selectedFeature) {
    return buildSingleObservationPopup(selectedFeature, selection.coords);
  }
  return buildObservationListPopup(selection.features, selection.coords);
};
