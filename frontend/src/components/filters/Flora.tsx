"use client";
import { Check, Leaf, MapPinned, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { fetchTaxonomicGroups } from "../../lib/observations-api";
import { getTaxonomicTheme } from "../../lib/taxonomic-config";
import type { TaxonomicGroup } from "../../types/map.types";

type Source = "iNaturalist" | "ODK" | "Ubicacion";

interface FloraGroupDisplay extends TaxonomicGroup {
  icon: React.ElementType;
  color: string;
  lightBg: string;
  ring: string;
  shadow: string;
  hex: string;
}

type FloraProps = {
  onClose?: () => void;
  onReset?: () => void;
  onGroupSelected?: (groupName: string | null) => void;
  activeSources?: Set<string>;
  onSourceToggle?: (source: "iNaturalist" | "ODK" | "Ubicacion") => void;
  backendSource?: "all" | "drive" | "inaturalist";
  dateFrom?: string | null;
  dateTo?: string | null;
  initialSelectedGroup?: string | null;
  disabled?: boolean;
};

const SOURCES: { id: Source; logo: string | null; labelKey: string }[] = [
  { id: "iNaturalist", logo: "/INaturalist_logo.png", labelKey: "iNaturalist" },
  { id: "ODK", logo: "/ODK.png", labelKey: "ODK" },
  { id: "Ubicacion", logo: null, labelKey: "ubicacion" },
];

const CARD_DEFAULT_SHADOW: React.CSSProperties = {
  boxShadow: "0 4px 12px rgba(15,23,42,0.03), 0 8px 24px rgba(15,23,42,0.05)",
};

const AVATAR_DEFAULT_STYLE: React.CSSProperties = {
  border: "1.5px solid #f1f5f9",
  boxShadow: "inset 0 2px 4px rgba(255,255,255,0.8)",
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const BADGE_DEFAULT_STYLE: React.CSSProperties = {
  background: "#f8fafc",
  color: "#94a3b8",
  border: "1px solid #f1f5f9",
};

const ARROW_STYLE: React.CSSProperties = {
  background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
  border: "1px solid #e2e8f0",
  color: "#94a3b8",
  boxShadow: "0 2px 4px rgba(15,23,42,0.04)",
};

const SHIMMER_LABEL_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(16,185,129,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  animation: "popup-shimmer 8s linear infinite",
  animationDelay: "-2s",
};

const SHIMMER_SECTION_STYLE: React.CSSProperties = {
  ...SHIMMER_LABEL_STYLE,
  animationDelay: "-5s",
};

export function Flora({
  onClose,
  onReset,
  onGroupSelected,
  activeSources,
  onSourceToggle,
  initialSelectedGroup,
  backendSource = "all",
  dateFrom,
  dateTo,
  disabled = false,
}: FloraProps) {
  const t = useTranslations("filters");
  const [groups, setGroups] = useState<FloraGroupDisplay[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(initialSelectedGroup ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const localActiveSources = activeSources ?? new Set(["iNaturalist", "ODK"]);

  useEffect(() => {
    const controller = new AbortController();
    const loadGroups = async () => {
      try {
        setIsLoading(true);
        const backendGroups = await fetchTaxonomicGroups({
          source: backendSource,
          dateFrom,
          dateTo,
          signal: controller.signal,
        });

        const floraGroups = backendGroups.filter((g) => {
          const n = g.nombre.toLowerCase();
          return (
            n.includes("planta") ||
            n.includes("hongo") ||
            n.includes("fungi") ||
            n.includes("flora")
          );
        });

        const enriched = floraGroups
          .map((g) => {
            const theme = getTaxonomicTheme(g.nombre);
            return {
              ...g,
              icon: theme.icon,
              color: theme.color,
              lightBg: theme.lightBg,
              ring: theme.ring,
              shadow: theme.shadow,
              hex: theme.hex,
            };
          })
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setGroups(enriched);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
    return () => controller.abort();
  }, [backendSource, dateFrom, dateTo]);

  useEffect(() => {
    setSelectedGroup(initialSelectedGroup ?? null);
  }, [initialSelectedGroup]);

  function toggleSource(source: Source) {
    onSourceToggle?.(source);
  }

  function toggleGroup(groupName: string) {
    if (disabled) return;
    const newSelected = selectedGroup === groupName ? null : groupName;
    setSelectedGroup(newSelected);
    onGroupSelected?.(newSelected);
  }

  const hasINat = localActiveSources.has("iNaturalist");
  const hasDrive = localActiveSources.has("ODK") || localActiveSources.has("Ubicacion");

  const getGroupVisibleCount = (g: TaxonomicGroup) => {
    let count = 0;
    if (hasINat) count += g.inaturalist;
    if (hasDrive) count += g.drive;
    return count;
  };

  const visibleCount = selectedGroup
    ? getGroupVisibleCount(
        groups.find((g) => g.nombre === selectedGroup) ?? {
          total: 0,
          drive: 0,
          inaturalist: 0,
          idGrupo: 0,
          nombre: "",
        },
      )
    : groups.reduce((acc, g) => acc + getGroupVisibleCount(g), 0);

  if (isLoading) {
    return (
      <section
        className="flex h-full flex-col p-5 animate-pulse"
        style={{ background: "transparent" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-[46px] w-[46px] rounded-4-5 bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-100 rounded-full" />
              <div className="h-5 w-28 bg-slate-100 rounded-full" />
            </div>
          </div>
          <div className="h-9 w-28 rounded-full bg-slate-100" />
        </div>
        <div className="flex gap-2.5 mb-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`flex flex-1 min-h-0 flex-col transition-opacity duration-600 ease-premium ${disabled ? "opacity-50 pointer-events-none" : "opacity-100"}`}
      style={{ background: "transparent", overflow: "visible" }}
      data-filter-theme="emerald"
    >
      {/* ── Header Premium ── */}
      <div className="flex flex-col px-5 pt-3 pb-3 shrink-0">
        {/* Fila: icono + título + botón cerrar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Icono con gradiente esmeralda */}
            <div
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-4-5 text-white"
              style={{
                background: "linear-gradient(145deg, #34d399 0%, #10b981 100%)",
                boxShadow: "0 2px 6px rgba(16,185,129,0.3), 0 8px 24px rgba(16,185,129,0.25)",
              }}
            >
              <Leaf className="h-icon-lg w-icon-lg" strokeWidth={2.2} />
            </div>

            {/* Texto */}
            <div className="flex flex-col gap-0.5">
              <p
                className="text-[9.5px] font-bold uppercase tracking-premium"
                style={SHIMMER_LABEL_STYLE}
              >
                {t("catalogo_flora")}
              </p>
              <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900 leading-tight">
                {t("flora")}
              </h2>
            </div>
          </div>

          {/* Botón cerrar — envuelto en div de 46px para igualar el ancho del ícono izquierdo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onReset?.();
              }}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[12px] text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
              title={t("limpiar")}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="filter-close-btn flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-slate-400 hover:bg-emerald-600! hover:text-white hover:shadow-lg hover:shadow-emerald-200/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.7) 100%)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Botones de fuente ── */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {SOURCES.map(({ id, logo, labelKey }) => {
            const isActive = localActiveSources.has(id);
            const labelText =
              labelKey === "iNaturalist" || labelKey === "ODK" ? labelKey : t("ubicacion");
            return (
              <div key={id} className="py-[3px]">
                <button
                  type="button"
                  onClick={() => toggleSource(id)}
                  className={`source-chip-button group relative flex w-full min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60
                    ${
                      isActive
                        ? "source-chip-active-emerald active:brightness-[0.97]"
                        : `transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                         hover:translate-y-[-2px] hover:shadow-md
                         active:translate-y-0 active:brightness-[0.97]`
                    }`}
                  style={
                    isActive
                      ? undefined
                      : {
                          background:
                            "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.7) 100%)",
                          border: "1px solid rgba(226,232,240,0.8)",
                          boxShadow:
                            "0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                        }
                  }
                >
                  {logo ? (
                    <div
                      className={`source-chip-logo-wrap relative flex h-icon-lg w-icon-lg shrink-0 items-center justify-center rounded-[9px] transition-all duration-500 ${isActive ? "source-chip-logo-wrap-on" : "source-chip-logo-wrap-off"}`}
                    >
                      <Image
                        src={logo}
                        alt={id}
                        fill
                        className={`object-contain p-[2px] transition-all duration-500 ${isActive ? "source-chip-logo-on" : "source-chip-logo-off"}`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`source-chip-logo-wrap relative flex h-icon-lg w-icon-lg shrink-0 items-center justify-center rounded-[9px] transition-all duration-500 ${isActive ? "source-chip-logo-wrap-on" : "source-chip-logo-wrap-off"}`}
                    >
                      <MapPinned
                        className="h-[14px] w-[14px] shrink-0 transition-colors duration-500"
                        style={{ color: isActive ? "#10b981" : "#94a3b8" }}
                        strokeWidth={2}
                      />
                    </div>
                  )}
                  <span
                    className="text-[10px] tracking-[0.01em] font-semibold whitespace-nowrap leading-none"
                    style={{
                      color: isActive ? "#065f46" : "#94a3b8",
                    }}
                  >
                    {labelText}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Stats card ── */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-[20px] mb-5"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow:
              "0 2px 4px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
          }}
        >
          {/* Número */}
          <div className="flex flex-col">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5"
              style={{
                background:
                  "linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(16,185,129,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "popup-shimmer 8s linear infinite",
                animationDelay: "-1s",
              }}
            >
              {t("observaciones")}
            </p>
            <p
              className="text-[38px] font-black leading-none tracking-[-0.04em]"
              style={{
                background:
                  "linear-gradient(90deg, #1e293b 0%, #334155 25%, #10b981 50%, #334155 75%, #1e293b 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "popup-num-shimmer 8s linear infinite",
                animationDelay: "-4s",
                fontVariantNumeric: "tabular-nums",
                minWidth: "3ch",
              }}
            >
              {visibleCount}
            </p>
          </div>

          {/* Iconos de fuentes activas — pill agrupado */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px]"
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.7) 100%)",
              border: "1px solid rgba(226,232,240,0.8)",
              boxShadow: "0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
            }}
          >
            {localActiveSources.has("iNaturalist") && (
              <div className="relative flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px]">
                <Image
                  src="/INaturalist_logo.png"
                  alt="iNaturalist"
                  fill
                  className="object-contain p-[2px]"
                />
              </div>
            )}
            {localActiveSources.has("ODK") && (
              <div className="relative flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px]">
                <Image src="/ODK.png" alt="ODK" fill className="object-contain p-[2px]" />
              </div>
            )}
            {localActiveSources.has("Ubicacion") && (
              <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px]">
                <MapPinned
                  className="h-[16px] w-[16px] shrink-0"
                  style={{ color: "#10b981" }}
                  strokeWidth={2}
                />
              </div>
            )}
          </div>
        </div>

        {/* Divisor */}
        <div
          className="mb-5 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.15) 30%, rgba(16,185,129,0.15) 70%, transparent 100%)",
          }}
        />

        {/* Etiqueta sección */}
        <p
          className="text-[9.5px] font-bold uppercase tracking-premium"
          style={SHIMMER_SECTION_STYLE}
        >
          {t("grupos_registrados")}
        </p>
      </div>

      <div
        className="fauna-grid overflow-y-auto rounded-b-[20px]"
        style={{
          background: "transparent",
          flex: "1 1 auto",
          minHeight: "0",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(148,163,184,0.6) transparent",
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingTop: "4px",
          paddingBottom: "0px",
          /* CSS custom property para el neon glow temático de las cards */
          ["--card-glow-rgb" as string]: "16, 185, 129",
        }}
      >
        <div className="flex flex-col gap-6 pt-0 pb-2">
          {groups.map((group) => {
            const Icon = group.icon;
            const isSelected = selectedGroup === group.nombre;

            return (
              <button
                key={group.nombre}
                type="button"
                onClick={() => toggleGroup(group.nombre)}
                className={`fauna-card group relative flex w-full items-center gap-3.5 rounded-[22px] p-3 text-left focus-visible:outline-none ${
                  isSelected ? "" : "focus-visible:ring-2 focus-visible:ring-emerald-400/60"
                }`}
                data-selected={isSelected ? "true" : undefined}
                style={{
                  ...(isSelected
                    ? {
                        background:
                          "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(250,255,250,0.95) 100%)",
                        boxShadow: `
                        0 0 0 2px ${group.hex},
                        0 0 0 6px ${hexToRgba(group.hex, 0.1)},
                        0 4px 20px ${hexToRgba(group.hex, 0.15)},
                        0 8px 32px ${hexToRgba(group.hex, 0.08)},
                        inset 0 1px 0 rgba(255,255,255,1)
                      `,
                      }
                    : {
                        ...CARD_DEFAULT_SHADOW,
                        boxShadow: `${CARD_DEFAULT_SHADOW.boxShadow}, 0 0 0 2px rgba(241,245,249,0.8)`,
                      }),
                }}
              >
                {/* Avatar taxonómico */}
                <div
                  className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[16px] transition-all duration-400 ${
                    isSelected
                      ? `${group.color} ${group.shadow}`
                      : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500"
                  }`}
                  style={isSelected ? undefined : AVATAR_DEFAULT_STYLE}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={2.5}
                    style={
                      isSelected
                        ? {
                            color: "rgba(255,255,255,0.95)",
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
                          }
                        : undefined
                    }
                  />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col min-w-0" style={{ gap: "5px" }}>
                  <span
                    className={`text-[14.5px] font-extrabold tracking-tight leading-none ${isSelected ? "text-slate-900" : "text-slate-800"}`}
                  >
                    {group.nombre}
                  </span>
                  <span
                    className="inline-flex items-center rounded-[8px] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                    style={{
                      alignSelf: "flex-start",
                      marginLeft: "-8px",
                      ...(isSelected
                        ? {
                            background: hexToRgba(group.hex, 0.12),
                            color: group.hex,
                            border: `1px solid ${hexToRgba(group.hex, 0.25)}`,
                            fontWeight: 700,
                          }
                        : BADGE_DEFAULT_STYLE),
                    }}
                  >
                    {getGroupVisibleCount(group) > 0
                      ? `${getGroupVisibleCount(group)} ${t("observaciones").toLowerCase()}`
                      : t("sin_registros")}
                  </span>
                </div>

                {/* Check cuando está seleccionado */}
                {isSelected && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] text-white transition-all duration-400"
                    style={{
                      background: `linear-gradient(145deg, ${group.hex} 0%, ${hexToRgba(group.hex, 0.82)} 100%)`,
                      boxShadow: `0 4px 12px ${hexToRgba(group.hex, 0.45)}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    }}
                  >
                    <Check className="h-[14px] w-[14px]" strokeWidth={3} />
                  </div>
                )}

                {/* Flecha cuando no está seleccionado */}
                {!isSelected && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] transition-all duration-300 group-hover:translate-x-0.5"
                    style={ARROW_STYLE}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
