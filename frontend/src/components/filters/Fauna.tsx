"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Bird, Fish, Rabbit, PawPrint } from "lucide-react";
import { SpiderIcon, ChameleonIcon, SnailIcon, FrogIcon } from "../icons/CustomIcons";

// ── Tipos ────────────────────────────────────────────────────────────────────

type Source = "iNaturalist" | "ODK" | "Ubicacion";

interface faunaGroup {
  label: string;
  icon: React.ElementType;
  tone: string;
  ring: string;
  count: number; // conteo de ejemplo — reemplazar con datos reales
}

// ── Datos ─────────────────────────────────────────────────────────────────────

const faunaGroups: faunaGroup[] = [
  {
    label: "Aves",
    icon: Bird,
    tone: "bg-sky-500/10 text-sky-600 ring-sky-500/20",
    ring: "ring-sky-500",
    count: 67,
  },
  {
    label: "Mamíferos",
    icon: Rabbit,
    tone: "bg-orange-500/10 text-orange-700 ring-orange-500/20",
    ring: "ring-orange-500",
    count: 42,
  },
  {
    label: "Reptiles",
    icon: ChameleonIcon,
    tone: "bg-amber-600/10 text-amber-700 ring-amber-600/20",
    ring: "ring-amber-500",
    count: 19,
  },
  {
    label: "Peces",
    icon: Fish,
    tone: "bg-blue-500/10 text-blue-700 ring-blue-500/20",
    ring: "ring-blue-500",
    count: 14,
  },
  {
    label: "Aracnidos",
    icon: SpiderIcon,
    tone: "bg-red-500/10 text-red-700 ring-red-500/20",
    ring: "ring-red-500",
    count: 31,
  },
  {
    label: "Anfibios",
    icon: FrogIcon,
    tone: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
    ring: "ring-emerald-500",
    count: 28,
  },
  {
    label: "Moluscos",
    icon: SnailIcon,
    tone: "bg-purple-500/10 text-purple-700 ring-purple-500/20",
    ring: "ring-purple-500",
    count: 12,
  },
  {
    label: "Animalia",
    icon: PawPrint,
    tone: "bg-green-500/10 text-green-700 ring-green-500/20",
    ring: "ring-green-500",
    count: 9,
  },
];

// Conteo total de ejemplo
const TOTAL_RESULTS = faunaGroups.reduce((acc, g) => acc + g.count, 0);

// ── Componente ────────────────────────────────────────────────────────────────

export function Fauna() {
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
    ? (faunaGroups.find((g) => g.label === selectedGroup)?.count ?? 0)
    : TOTAL_RESULTS;

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
            const active = activeSources.has(id);
            return (
              <button
                key={id}
                type="button"
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
                    style={{ width: "auto", height: id === "ODK" ? "18px" : "16px" }}
                    className={`object-contain ${!active && "opacity-40 grayscale"}`}
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
        {faunaGroups.map((group) => {
          const Icon = group.icon;
          const isSelected = selectedGroup === group.label;

          return (
            <button
              key={group.label}
              type="button"
              onClick={() => toggleGroup(group.label)}
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
                  {group.count}
                </span>
              </div>
              <span className="text-sm font-semibold text-[#003B46]">{group.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
