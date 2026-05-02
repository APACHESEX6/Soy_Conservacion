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
};

const ICON_MAP: Record<string, { icon: React.ElementType; tone: string; ring: string }> = {
  Aves: {
    icon: Bird,
    tone: "bg-sky-500/10 text-sky-600 ring-sky-500/20",
    ring: "ring-sky-500",
  },
  Mamíferos: {
    icon: Rabbit,
    tone: "bg-orange-500/10 text-orange-700 ring-orange-500/20",
    ring: "ring-orange-500",
  },
  Reptiles: {
    icon: ChameleonIcon,
    tone: "bg-amber-600/10 text-amber-700 ring-amber-600/20",
    ring: "ring-amber-500",
  },
  Peces: {
    icon: Fish,
    tone: "bg-blue-500/10 text-blue-700 ring-blue-500/20",
    ring: "ring-blue-500",
  },
  Arácnidos: {
    icon: SpiderIcon,
    tone: "bg-red-500/10 text-red-700 ring-red-500/20",
    ring: "ring-red-500",
  },
  Anfibios: {
    icon: FrogIcon,
    tone: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
    ring: "ring-emerald-500",
  },
  Moluscos: {
    icon: SnailIcon,
    tone: "bg-purple-500/10 text-purple-700 ring-purple-500/20",
    ring: "ring-purple-500",
  },
  Animalia: {
    icon: PawPrint,
    tone: "bg-green-500/10 text-green-700 ring-green-500/20",
    ring: "ring-green-500",
  },

  Insectos: {
    icon: Bug,
    tone: "bg-yellow-500/10 text-yellow-700 ring-yellow-500/20",
    ring: "ring-yellow-500",
  },
  Desconocido: {
    icon: CircleHelp,
    tone: "bg-gray-500/10 text-gray-700 ring-gray-500/20",
    ring: "ring-gray-500",
  },
};

export function Fauna({
  onGroupSelected,
  activeSources,
  onSourceToggle,
  backendSource = "all",
  dateFrom,
  dateTo,
}: FaunaProps) {
  const [groups, setGroups] = useState<FaunaGroupDisplay[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
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
    onSourceToggle?.(source);
  }

  function toggleGroup(groupName: string) {
    const newSelected = selectedGroup === groupName ? null : groupName;
    setSelectedGroup(newSelected);
    onGroupSelected?.(newSelected);
  }

  // Conteo visible según grupo seleccionado
  const visibleCount = selectedGroup
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
    <section className="flex h-full flex-col gap-3 overflow-hidden">
      {/* ── Header con título, conteo y fuentes ── */}
      <div className="flex flex-col gap-2">
        {/* Fila 1: título + badge de resultados */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#003B46]">Filtrar Fauna</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            {visibleCount} Especies
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
                onClick={() => toggleSource(id)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
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
                    className={`object-contain h-4 w-4 ${!active && "opacity-40 grayscale"}`}
                  />
                ) : (
                  <MapPin
                    className={`h-3 w-3 ${active ? "text-emerald-500" : "text-gray-300"}`}
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
      <div className="grid grid-cols-2 gap-3 overflow-y-auto overflow-x-hidden pb-1 px-2 pt-2">
        {groups.map((group) => {
          const Icon = group.icon;
          const isSelected = selectedGroup === group.nombre;

          return (
            <button
              key={group.nombre}
              type="button"
              onClick={() => toggleGroup(group.nombre)}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] ${group.tone} ${
                isSelected
                  ? `ring-[3px] ${group.ring} shadow-[0_12px_28px_rgba(0,0,0,0.10)] -translate-y-0.5`
                  : ""
              }`}
            >
              <div className="flex w-full items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                {/* Conteo por grupo */}
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-current">
                  {group.total}
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
