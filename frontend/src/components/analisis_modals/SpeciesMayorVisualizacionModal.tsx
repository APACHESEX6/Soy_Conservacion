"use client";

import { Download, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TopSpeciesItem = {
  id: string;
  scientificName: string;
  views: number;
  group: string;
};

type SpeciesMayorVisualizacionModalProps = {
  open: boolean;
  onClose: () => void;
  items?: TopSpeciesItem[] | undefined;
};

export function SpeciesMayorVisualizacionModal({
  open,
  onClose,
  items,
}: SpeciesMayorVisualizacionModalProps) {
  type DataSourceType = "iNaturalist" | "ODK";

  const [dataSources, setDataSources] = useState<Set<DataSourceType>>(
    new Set(["iNaturalist", "ODK"]),
  );

  const toggleSource = (source: DataSourceType) => {
    setDataSources((prev) => {
      const next = new Set(prev);

      if (next.has(source)) {
        if (next.size > 1) next.delete(source);
      } else {
        next.add(source);
      }

      return next;
    });
  };

  const data = items ?? [];

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sortedItems = [...data].sort((a, b) => b.views - a.views);

  const totalViews = data.reduce((acc, item) => acc + item.views, 0);

  const chartHeight = Math.max(420, sortedItems.length * 44 + 20);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-[6px]"
        onClick={onClose}
      />

      <section className="relative flex max-h-[90vh] w-[min(96vw,850px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_28px_60px_rgba(2,6,23,0.16)]">
        <div className="px-8 pt-6 pb-0">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                {/* iNaturalist */}
                <button
                  type="button"
                  onClick={() => toggleSource("iNaturalist")}
                  className={`source-chip-button group relative flex items-center justify-center gap-1.5 rounded-2xl px-2 py-1
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60
                    ${
                      dataSources.has("iNaturalist")
                        ? "source-chip-active-blue active:brightness-[0.97]"
                        : `transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                           hover:translate-y-[-1px] hover:shadow-md
                           active:translate-y-0 active:brightness-[0.97]`
                    }`}
                  style={
                    dataSources.has("iNaturalist")
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
                  <div
                    className={`source-chip-logo-wrap relative flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] transition-all duration-500 ${
                      dataSources.has("iNaturalist")
                        ? "source-chip-logo-wrap-on"
                        : "source-chip-logo-wrap-off"
                    }`}
                  >
                    <Image
                      src="/INaturalist_logo.png"
                      alt="iNaturalist"
                      fill
                      className={`object-contain p-[2px] transition-all duration-500 ${
                        dataSources.has("iNaturalist")
                          ? "source-chip-logo-on"
                          : "source-chip-logo-off"
                      }`}
                    />
                  </div>

                  <span
                    className={`pr-1 text-[13px] font-semibold tracking-wide transition-colors duration-500 ${
                      dataSources.has("iNaturalist")
                        ? "text-blue-700"
                        : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  >
                    iNaturalist
                  </span>
                </button>

                {/* ODK */}
                <button
                  type="button"
                  onClick={() => toggleSource("ODK")}
                  className={`source-chip-button group relative flex items-center justify-center gap-1.5 rounded-2xl px-2 py-1
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60
                    ${
                      dataSources.has("ODK")
                        ? "source-chip-active-blue active:brightness-[0.97]"
                        : `transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                           hover:translate-y-[-1px] hover:shadow-md
                           active:translate-y-0 active:brightness-[0.97]`
                    }`}
                  style={
                    dataSources.has("ODK")
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
                  <div
                    className={`source-chip-logo-wrap relative flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] transition-all duration-500 ${
                      dataSources.has("ODK")
                        ? "source-chip-logo-wrap-on"
                        : "source-chip-logo-wrap-off"
                    }`}
                  >
                    <Image
                      src="/ODK.png"
                      alt="ODK"
                      fill
                      className={`object-contain p-[2px] transition-all duration-500 ${
                        dataSources.has("ODK") ? "source-chip-logo-on" : "source-chip-logo-off"
                      }`}
                    />
                  </div>

                  <span
                    className={`pr-1 text-[13px] font-semibold tracking-wide transition-colors duration-500 ${
                      dataSources.has("ODK")
                        ? "text-blue-700"
                        : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  >
                    ODK
                  </span>
                </button>

                <div className="mx-1 h-5 w-px bg-gray-200" />

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                Especies con mayor visualización
              </h3>

              <p className="mt-0.5 text-sm text-slate-500">Ranking de especies más observadas</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-4 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 px-4 py-2.5">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total visualizaciones
              </p>

              <p className="text-xl font-bold text-slate-900">
                {totalViews.toLocaleString("es-CO")}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-2.5">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Especies listadas
              </p>

              <p className="text-xl font-bold text-slate-900">{data.length}</p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-2.5">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                #1 en ranking
              </p>

              <p
                className="truncate text-lg font-bold italic text-slate-900"
                title={sortedItems[0]?.scientificName}
              >
                {sortedItems[0]?.scientificName}
              </p>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar flex h-[500px] flex-col gap-4 overflow-y-auto px-8 pb-6">
          <div className="w-full flex-col pt-2 select-none">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                layout="vertical"
                data={sortedItems}
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />

                <XAxis type="number" hide />

                <YAxis
                  dataKey="scientificName"
                  type="category"
                  width={150}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#334155",
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                />

                <Tooltip
                  cursor={{ fill: "#F1F5F9" }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString("es-CO")} vistas`,
                    "Visualizaciones",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{
                    color: "#10B981",
                    fontWeight: 600,
                  }}
                />

                <Bar dataKey="views" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1200}>
                  {sortedItems.map((item, index) => (
                    <Cell key={item.id} fill={index === 0 ? "#10B981" : "#34D399"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SpeciesMayorVisualizacionModal;
