"use client";

import { Leaf, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ChromistaIcon, MushroomIcon, ProtozoaIcon } from "../icons/CustomIcons";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Source = "iNaturalist" | "ODK" | "Ubicacion";

interface SpeciesGroup {
  label: string;
  icon: React.ElementType;
  tone: string;
  ring: string;
  count: number; // conteo de ejemplo — reemplazar con datos reales
}

// ── Datos ─────────────────────────────────────────────────────────────────────

const FloraGroups: SpeciesGroup[] = [
  {
    label: "Plantas",
    icon: Leaf,
    tone: "bg-green-500/10 text-green-700 ring-green-500/20",
    ring: "ring-green-500",
    count: 84,
  },
  {
    label: "Hongos",
    icon: MushroomIcon,
    tone: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
    ring: "ring-amber-500",
    count: 37,
  },
  {
    label: "Protozoos",
    icon: ProtozoaIcon,
    tone: "bg-indigo-500/10 text-indigo-700 ring-indigo-500/20",
    ring: "ring-indigo-500",
    count: 15,
  },
  {
    label: "Cromistas",
    icon: ChromistaIcon,
    tone: "bg-rose-500/10 text-rose-700 ring-rose-500/20",
    ring: "ring-rose-500",
    count: 8,
  },
];

// Conteo total de ejemplo
const TOTAL_RESULTS = FloraGroups.reduce((acc, g) => acc + g.count, 0);

// ── Componente ────────────────────────────────────────────────────────────────

export function Flora() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<Set<Source>>(
    new Set(["iNaturalist", "ODK", "Ubicacion"]),
  );

  function toggleSource(source: Source) {
    setActiveSources((prev) => {
      const next = new Set(prev);
      // Evitar deseleccionar ambas fuentes a la vez
      if (next.has(source) && next.size === 1) return prev;
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  }

  function toggleGroup(label: string) {
    setSelectedGroup((prev) => (prev === label ? null : label));
  }

  // Conteo visible según grupo seleccionado
  const visibleCount = selectedGroup
    ? (FloraGroups.find((g) => g.label === selectedGroup)?.count ?? 0)
    : TOTAL_RESULTS;

  return (
    <section className="flex h-full flex-col gap-3 overflow-hidden">
      {/* ── Header con título, conteo y fuentes ── */}
      <div className="flex flex-col gap-2">
        {/* Fila 1: título + badge de resultados */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-secondary">Filtrar Flora</span>
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
            const active = activeSources.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleSource(id)}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs-minus font-medium transition-all ${
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
                    className={`${id === "ODK" ? "w-6 h-6" : "w-4 h-4"} object-contain ${!active && "opacity-40 grayscale"}`}
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
        {FloraGroups.map((group) => {
          const Icon = group.icon;
          const isSelected = selectedGroup === group.label;

          return (
            <button
              key={group.label}
              type="button"
              onClick={() => toggleGroup(group.label)}
              className={`flex flex-col items-start gap-2 rounded-2xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-premium-card ${group.tone} ${
                isSelected
                  ? `ring-[3px] ${group.ring} shadow-premium-card-selected -translate-y-0.5`
                  : ""
              }`}
            >
              <div className="flex w-full items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                {/* Conteo por grupo */}
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-2xs font-semibold text-current">
                  {group.count}
                </span>
              </div>
              <span className="text-sm font-semibold text-secondary">{group.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
