"use client";

import { Eye, Home, Medal } from "lucide-react";
import Image from "next/image";
import type { ElementType } from "react";
import { useEffect, useState } from "react";
import { SpeciesMayorVisualizacionModal } from "../../../components/analisis_modals/SpeciesMayorVisualizacionModal";
import { SpeciesRegisteredModal } from "../../../components/analisis_modals/SpeciesRegisteredModal";
import {
  UserRankingModal,
  type UserRankingItem as UserRankingModalItem,
} from "../../../components/analisis_modals/UserRankingModal";
import { HydrationFix } from "../../../components/layout/HydrationFix";
import {
  fetchObservationSpeciesRanking,
  fetchObservationUserRanking,
  fetchTaxonomicGroups,
  type SpeciesRankingItem,
  type UserRankingItem,
} from "../../../lib/observations-api";
import { getTaxonomicTheme } from "../../../lib/taxonomic-config";
import { getYearRange } from "../../../lib/year-visualization";
import type { TaxonomicGroup } from "../../../types/map.types";

type SpeciesRegisteredItem = {
  name: string;
  value: number;
  progress: number;
  color: string;
  icon: ElementType;
};

const USER_ACCENTS = [
  "#D9A520",
  "#B8B8B8",
  "#D97A22",
  "#0f766e",
  "#5b8def",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#6366f1",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
];

const buildUserRankingItems = (items: UserRankingItem[]): UserRankingModalItem[] =>
  items.map((item, index) => ({
    position: index + 1,
    name: item.username,
    role: "Observador",
    value: item.total,
    accent: USER_ACCENTS[index % USER_ACCENTS.length] ?? "#0f766e",
  }));
const buildSpeciesRegisteredItems = (groups: TaxonomicGroup[]): SpeciesRegisteredItem[] => {
  const topTotal = groups[0]?.total ?? 0;

  return groups.map((group) => {
    const theme = getTaxonomicTheme(group.nombre);

    return {
      name: group.nombre,
      value: group.total,
      progress: topTotal > 0 ? Math.max(8, Math.round((group.total / topTotal) * 100)) : 0,
      color: theme.hex,
      icon: theme.icon,
    };
  });
};

const buildSpeciesRankingItems = (items: SpeciesRankingItem[]) =>
  items.map((item) => ({
    id: String(item.idEspecie),
    scientificName: item.scientificName,
    views: item.views,
    group: item.taxonomicGroup,
  }));

export default function AnalisisPage() {
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [isSpeciesRankingModalOpen, setIsSpeciesRankingModalOpen] = useState(false);
  const [userRankingItems, setUserRankingItems] = useState<UserRankingModalItem[]>([]);
  const [speciesRegisteredItems, setSpeciesRegisteredItems] = useState<SpeciesRegisteredItem[]>([]);
  const [topSpeciesItems, setTopSpeciesItems] = useState<
    ReturnType<typeof buildSpeciesRankingItems>
  >([]);
  const [yearSpeciesItems, setYearSpeciesItems] = useState<
    ReturnType<typeof buildSpeciesRankingItems>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getUTCFullYear();
  const currentYearRange = getYearRange(currentYear);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      const [usersResult, groupsResult, speciesResult, yearSpeciesResult] =
        await Promise.allSettled([
          fetchObservationUserRanking({
            limit: 12,
            source: "all",
            signal: controller.signal,
          }),
          fetchTaxonomicGroups({
            source: "all",
            signal: controller.signal,
          }),
          fetchObservationSpeciesRanking({
            limit: 12,
            source: "all",
            signal: controller.signal,
          }),
          fetchObservationSpeciesRanking({
            limit: 12,
            source: "all",
            dateFrom: currentYearRange.from,
            dateTo: currentYearRange.to,
            signal: controller.signal,
          }),
        ]);

      if (controller.signal.aborted) {
        return;
      }

      if (usersResult.status === "fulfilled") {
        setUserRankingItems(buildUserRankingItems(usersResult.value));
      } else {
        setError("No fue posible cargar el ranking de usuarios.");
      }

      if (groupsResult.status === "fulfilled") {
        setSpeciesRegisteredItems(buildSpeciesRegisteredItems(groupsResult.value));
      } else {
        setError((prev) => prev ?? "No fue posible cargar las especies registradas.");
      }

      if (speciesResult.status === "fulfilled") {
        setTopSpeciesItems(buildSpeciesRankingItems(speciesResult.value));
      } else {
        setError((prev) => prev ?? "No fue posible cargar las especies más observadas.");
      }

      if (yearSpeciesResult.status === "fulfilled") {
        setYearSpeciesItems(buildSpeciesRankingItems(yearSpeciesResult.value));
      } else {
        setError((prev) => prev ?? "No fue posible cargar las especies por fecha.");
      }

      setIsLoading(false);
    };

    void loadAnalysis();

    return () => controller.abort();
  }, [currentYearRange.from, currentYearRange.to]);

  const userPreviewItems = userRankingItems.slice(0, 3);
  const topSpeciesPreviewItems = topSpeciesItems.slice(0, 3);
  const yearSpeciesPreviewItems = yearSpeciesItems.slice(0, 3);
  const speciesPreviewItems = speciesRegisteredItems.slice(0, 3);

  const totalUsers = userRankingItems.length;
  const averageRecords =
    userRankingItems.length > 0
      ? Math.round(
          userRankingItems.reduce((acc, item) => acc + item.value, 0) / userRankingItems.length,
        )
      : 0;
  const leader = userRankingItems[0];

  return (
    <HydrationFix>
      <div className="min-h-screen w-screen overflow-hidden bg-[#f3f4f3] text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%)]" />

        <main className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <header className="mb-4 flex flex-col gap-4 rounded-[28px] bg-white/80 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <a
                href="https://www.soyconservacion.org"
                target="_blank"
                rel="noreferrer"
                className="relative flex h-18 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_14px_28px_rgba(15,118,110,0.14)] transition-transform hover:scale-[1.02]"
                aria-label="Ir a Soy Conservación"
                title="Ir a Soy Conservación"
              >
                <Image
                  src="/soy_conservacion_logo.png"
                  alt="Soy Conservación"
                  fill
                  sizes="96px"
                  className="object-contain p-1"
                  priority
                />
              </a>

              <div>
                <h1 className="text-[1.7rem] font-black tracking-tight sm:text-[2rem]">Análisis</h1>
                <p className="text-[0.95rem] font-medium text-slate-600 sm:text-base">
                  Impacto colectivo en la biodiversidad
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4.5 py-3.5 text-[0.95rem] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-zinc-200"
              >
                <Home className="h-4.5 w-4.5" />
                Inicio
              </button>
            </div>
          </header>

          {error ? (
            <div className="mb-4 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
              {error}
            </div>
          ) : null}

          <div className="grid min-h-0 flex-1 gap-3 md:gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start xl:gap-5">
            <div className="grid h-fit min-h-0 content-start gap-3 md:gap-4">
              <section className="h-fit rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.05rem] font-semibold text-slate-800">
                    Usuarios con más registros
                  </h2>
                </div>

                <div className="space-y-3">
                  {userPreviewItems.length > 0 ? (
                    userPreviewItems.map((item) => (
                      <div key={item.position} className="flex items-center gap-2.5">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                          style={{ backgroundColor: item.accent }}
                        >
                          <Medal className="h-4.5 w-4.5" strokeWidth={2.2} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[0.9rem] font-semibold text-slate-900">
                            {item.name}
                          </div>
                          <div className="truncate text-[0.78rem] text-slate-500">{item.role}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[0.92rem] font-bold text-slate-800">
                            {item.value.toLocaleString("es-CO")}
                          </div>
                          <div className="text-[0.7rem] uppercase tracking-[0.16em] text-slate-400">
                            Registros
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm font-medium text-slate-500">
                      {isLoading ? "Cargando ranking de usuarios..." : "Sin datos disponibles."}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsRankingModalOpen(true)}
                  className="mt-4 w-full rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:bg-slate-100"
                >
                  Ver ranking completo
                </button>
              </section>

              <section className="h-fit rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.05rem] font-semibold text-slate-800">
                    Especies con mayor visualización
                  </h2>
                </div>

                <div className="space-y-3">
                  {topSpeciesPreviewItems.length > 0 ? (
                    topSpeciesPreviewItems.map((item) => {
                      const theme = getTaxonomicTheme(item.group);

                      return (
                        <div key={item.id} className="flex items-center gap-2.5">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: theme.hex }}
                          >
                            <theme.icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[0.9rem] font-semibold text-slate-900">
                              {item.scientificName}
                            </div>
                            <div className="truncate text-[0.78rem] text-slate-500">
                              {item.group}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full bg-[#c8d7ff] px-3 py-1.5 text-[0.8rem] font-semibold text-slate-700 shadow-sm">
                            <Eye className="mr-1 inline-block h-3.5 w-3.5" />
                            {item.views.toLocaleString("es-CO")}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm font-medium text-slate-500">
                      {isLoading ? "Cargando especies..." : "Sin datos disponibles."}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSpeciesRankingModalOpen(true)}
                  className="mt-4 w-full rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:bg-slate-100"
                >
                  Ver ranking completo
                </button>
              </section>
            </div>

            <div className="grid min-h-0 gap-3 md:gap-4">
              <section className="min-h-[200px] rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:min-h-[220px] md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:mb-5">
                  <div>
                    <h2 className="text-[1.05rem] font-semibold text-slate-800 md:text-lg">
                      Especies más registradas en {currentYear}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Rango activo: {currentYearRange.from} al {currentYearRange.to}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    Año actual
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {yearSpeciesPreviewItems.length > 0 ? (
                    yearSpeciesPreviewItems.map((item) => {
                      const theme = getTaxonomicTheme(item.group);

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50/80 px-4 py-3"
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{ backgroundColor: theme.hex }}
                          >
                            <theme.icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {item.scientificName}
                            </div>
                            <div className="truncate text-[0.78rem] text-slate-500">
                              {item.group}
                            </div>
                          </div>
                          <div className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[0.8rem] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                            <Eye className="mr-1 inline-block h-3.5 w-3.5" />
                            {item.views.toLocaleString("es-CO")}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-[140px] items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 text-center text-[0.8rem] font-semibold text-slate-500 md:min-h-[160px] md:text-sm">
                      {isLoading ? "Cargando estadísticas por fecha..." : "Sin datos disponibles."}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
                  <div>
                    <h2 className="text-[1.05rem] font-semibold text-slate-800 md:text-lg">
                      Especies registradas
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Distribución por grupo taxonómico</p>
                  </div>
                </div>

                <div className="space-y-4 md:space-y-5">
                  {speciesPreviewItems.length > 0 ? (
                    speciesPreviewItems.map((item) => (
                      <div key={item.name}>
                        <div className="mb-1.5 flex items-center justify-between text-[0.85rem] md:text-sm">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm"
                              style={{ backgroundColor: item.color }}
                            >
                              <item.icon className="h-4 w-4" />
                            </span>
                            {item.name}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.value.toLocaleString("es-CO")}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200 md:h-4">
                          <div
                            className="h-3 rounded-full bg-[#083b3a] md:h-4"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm font-medium text-slate-500">
                      {isLoading ? "Cargando grupos taxonómicos..." : "Sin datos disponibles."}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSpeciesModalOpen(true)}
                  className="mt-4 w-full rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:bg-slate-100 md:mt-5"
                >
                  Ver ranking completo
                </button>
              </section>
            </div>
          </div>

          <UserRankingModal
            open={isRankingModalOpen}
            onClose={() => setIsRankingModalOpen(false)}
            items={userRankingItems}
            totalUsers={totalUsers}
            averageRecords={averageRecords}
            leaderName={leader?.name}
            leaderRecords={leader?.value}
          />
          <SpeciesRegisteredModal
            open={isSpeciesModalOpen}
            onClose={() => setIsSpeciesModalOpen(false)}
            items={speciesRegisteredItems.map((item) => ({
              name: item.name,
              value: item.value,
              color: item.color,
              icon: item.icon,
            }))}
          />
          <SpeciesMayorVisualizacionModal
            open={isSpeciesRankingModalOpen}
            onClose={() => setIsSpeciesRankingModalOpen(false)}
            items={topSpeciesItems}
          />
        </main>
      </div>
    </HydrationFix>
  );
}
