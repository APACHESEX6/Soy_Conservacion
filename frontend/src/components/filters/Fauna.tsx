"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Bird, Fish, Rabbit, PawPrint, Bug, CircleHelp } from "lucide-react";
import { SpiderIcon, ChameleonIcon, SnailIcon, FrogIcon } from "../icons/CustomIcons";
import { fetchTaxonomicGroups } from "../../lib/observations-api";
import type { TaxonomicGroup } from "../../types/map.types";

type Source = "iNaturalist" | "ODK" | "Ubicacion";

interface FaunaGroupDisplay extends TaxonomicGroup {
  icon: React.ElementType;
  tone: string;
  ring: string;
}

type FaunaProps = {
  onGroupSelected?: (groupName: string | null) => void;
  activeSources?: Set<string>;
  onSourceToggle?: (source: "iNaturalist" | "ODK" | "Ubicacion") => void;
  backendSource?: "all" | "drive" | "inaturalist";
  dateFrom?: string | null;
  dateTo?: string | null;
  disabled?: boolean;
  initialSelectedGroup?: string | null;
};
const ICON_MAP: Record<string, { icon: React.ElementType; tone: string; ring: string }> = {
  Aves: {
    icon: Bird,
    tone: "bg-[#0EA5E9]/10 text-[#0EA5E9] ring-[#0EA5E9]/20",
    ring: "border-[#0EA5E9]",
  },
  Mamíferos: {
    icon: Rabbit,
    tone: "bg-[#F97316]/10 text-[#F97316] ring-[#F97316]/20",
    ring: "border-[#F97316]",
  },
  Reptiles: {
    icon: ChameleonIcon,
    tone: "bg-[#00AD04]/10 text-[#00AD04] ring-[#00AD04]/20",
    ring: "border-[#00AD04]",
  },
  Peces: {
    icon: Fish,
    tone: "bg-[#6366F1]/10 text-[#6366F1] ring-[#6366F1]/20",
    ring: "border-[#6366F1]",
  },
  Arácnidos: {
    icon: SpiderIcon,
    tone: "bg-[#EF4444]/10 text-[#EF4444] ring-[#EF4444]/20",
    ring: "border-[#EF4444]",
  },
  Anfibios: {
    icon: FrogIcon,
    tone: "bg-[#84CC16]/10 text-[#84CC16] ring-[#84CC16]/20",
    ring: "border-[#84CC16]",
  },
  Moluscos: {
    icon: SnailIcon,
    tone: "bg-[#D946EF]/10 text-[#D946EF] ring-[#D946EF]/20",
    ring: "border-[#D946EF]",
  },
  Animalia: {
    icon: PawPrint,
    tone: "bg-[#8B5CF6]/10 text-[#8B5CF6] ring-[#8B5CF6]/20",
    ring: "border-[#8B5CF6]",
  },
  Insectos: {
    icon: Bug,
    tone: "bg-[#EAB308]/10 text-[#EAB308] ring-[#EAB308]/20",
    ring: "border-[#EAB308]",
  },
  Desconocido: {
    icon: CircleHelp,
    tone: "bg-[#6B7280]/10 text-[#6B7280] ring-[#6B7280]/20",
    ring: "border-[#6B7280]",
  },
};

export function Fauna({
  onGroupSelected,
  activeSources,
  onSourceToggle,
  initialSelectedGroup,
  backendSource = "all",
  dateFrom,
  dateTo,
  disabled = false,
}: FaunaProps) {
  const [groups, setGroups] = useState<FaunaGroupDisplay[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(initialSelectedGroup ?? null);
  const [isLoading, setIsLoading] = useState(true);
  // Usamos los props de activeSources del padre, si no viene fallback a default
  const localActiveSources = activeSources ?? new Set(["iNaturalist", "ODK", "Ubicacion"]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoading(true);
        const backendGroups = await fetchTaxonomicGroups({
          source: backendSource,
          dateFrom,
          dateTo,
        });

        // Filtrar para excluir Plantas y Hongos (van en Flora)
        const faunaGroups = backendGroups.filter(
          (g) => g.nombre !== "Plantas" && g.nombre !== "Hongos",
        );

        const enriched = faunaGroups
          .map((g) => ({
            ...g,
            icon: ICON_MAP[g.nombre]?.icon ?? PawPrint,
            tone: ICON_MAP[g.nombre]?.tone ?? "bg-gray-500/10 text-gray-700 ring-gray-500/20",
            ring: ICON_MAP[g.nombre]?.ring ?? "ring-gray-500",
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setGroups(enriched);
      } catch (error) {
        console.error("Error loading taxonomic groups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [backendSource, dateFrom, dateTo]);

  function toggleSource(source: Source) {
    if (disabled) {
      return;
    }
    onSourceToggle?.(source);
  }

  function toggleGroup(groupName: string) {
    if (disabled) {
      return;
    }
    const newSelected = selectedGroup === groupName ? null : groupName;
    setSelectedGroup(newSelected);
    onGroupSelected?.(newSelected);
  }

  // Conteo visible según grupo seleccionado y fuentes activas
  // Si no hay iNaturalist activo (datos están solo en iNaturalist), mostrar 0
  const hasINaturalist = localActiveSources.has("iNaturalist");

  const visibleCount = !hasINaturalist
    ? 0
    : selectedGroup
      ? (groups.find((g) => g.nombre === selectedGroup)?.total ?? 0)
      : groups.reduce((acc, g) => acc + g.total, 0);

  if (isLoading) {
    return (
      <section className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#003B46]">Filtrar Fauna</span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
            Cargando...
          </span>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`flex h-full flex-col gap-3 overflow-hidden ${disabled ? "pointer-events-none opacity-55 saturate-0" : ""}`}
    >
      {/* ── Header con título, conteo y fuentes ── */}
      <div className="flex flex-col gap-2">
        {/* Fila 1: título + badge de resultados */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#003B46]">Filtrar Fauna</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            {visibleCount} Resultados
          </span>
        </div>

        {/* Fila 2: toggles de fuente */}
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "iNaturalist", logo: "/INaturalist_logo.png" },
              { id: "ODK", logo: "/ODK.png" },
              { id: "Ubicacion", logo: null },
            ] as { id: Source; logo: string | null }[]
          ).map(({ id, logo }) => {
            const active = localActiveSources.has(id);
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => toggleSource(id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                  active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt={id}
                    width={id === "ODK" ? 24 : 16}
                    height={id === "ODK" ? 24 : 16}
                    className={`object-contain h-5 w-5 ${!active && "opacity-40 grayscale"}`}
                  />
                ) : (
                  <MapPin
                    className={`h-3 w-3 ${active ? "text-red-500" : "text-gray-300"}`}
                    strokeWidth={2.5}
                  />
                )}
                <span className={`${active ? "bg-emerald-500" : "bg-gray-300"}`} />
                {id === "ODK" ? <span className="-ml-1">{id}</span> : id}
              </button>
            );
          })}
        </div>

        {/* Fila 3: label sección */}
        <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
          Grupo Taxonómico
        </p>
      </div>

      {/* ── Grid de grupos ── */}
      <div className="fauna-grid grid grid-cols-2 gap-3 overflow-y-auto overflow-x-hidden pb-1 px-2 pt-2">
        {groups.map((group) => {
          const Icon = group.icon;
          const isSelected = selectedGroup === group.nombre;

          return (
            <button
              key={group.nombre}
              type="button"
              disabled={disabled}
              onClick={() => toggleGroup(group.nombre)}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] ${group.tone} ${
                isSelected
                  ? `border-[3px] ${group.ring.replace("ring-", "border-")} shadow-[0_12px_28px_rgba(0,0,0,0.10)] -translate-y-0.5`
                  : "border"
              }`}
            >
              <div className="flex w-full items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                {/* Conteo por grupo */}
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                  {hasINaturalist ? group.total : 0}
                </span>
              </div>
              <span className="text-sm font-semibold text-[#003B46]">{group.nombre}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
