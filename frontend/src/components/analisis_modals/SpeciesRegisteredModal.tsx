"use client";

import { AlignLeft, Download, HelpCircle, PieChart as PieChartIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type SpeciesItem = {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
};

type SpeciesRegisteredModalProps = {
  open: boolean;
  onClose: () => void;
  items?: SpeciesItem[] | undefined;
};

export function SpeciesRegisteredModal({ open, onClose, items }: SpeciesRegisteredModalProps) {
  const [viewMode, setViewMode] = useState<"list" | "chart">("chart");

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

  const data = items ?? [];

  const total = data.reduce((acc, item) => acc + item.value, 0);
  const max = data.length ? Math.max(...data.map((i) => i.value)) : 1;
  const topGroup = data.length
    ? data.reduce((a, b) => (a.value > b.value ? a : b))
    : { name: "-", value: 0, color: "#CBD5E1", icon: HelpCircle };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-[6px]"
        onClick={onClose}
      />

      <section className="relative flex max-h-[90vh] w-[min(96vw,850px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_28px_60px_rgba(2,6,23,0.16)]">
        {/* Header */}
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

              <h3 className="text-xl font-semibold text-slate-900">Especies registradas</h3>

              <p className="mt-0.5 text-sm text-slate-500">Distribución por grupo taxonómico</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle */}
              <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("chart")}
                  className={`inline-flex items-center justify-center overflow-hidden rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === "chart"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <PieChartIcon className="mr-1.5 h-3.5 w-3.5" />
                  Gráfico
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center justify-center overflow-hidden rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <AlignLeft className="mr-1.5 h-3.5 w-3.5" />
                  Lista
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 px-4 py-2.5">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total registros
              </p>

              <p className="text-xl font-bold text-slate-900">{total.toLocaleString("es-CO")}</p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-2.5">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Grupos activos
              </p>

              <p className="text-xl font-bold text-slate-900">{data.length}</p>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-2.5">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Más registrado
              </p>

              <p className="text-lg font-bold text-slate-900">{topGroup.name}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="custom-scrollbar flex h-[500px] flex-col gap-4 overflow-y-auto px-8 pb-8">
          {viewMode === "list" ? (
            <div className="flex flex-col gap-4">
              {data.map((item) => {
                const barWidth = Math.round((item.value / max) * 100);
                const Icon = item.icon;

                return (
                  <div key={item.name} className="mt-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${item.color}25` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: item.color }} strokeWidth={2} />
                        </div>

                        <span className="text-[15px] font-semibold text-slate-800">
                          {item.name}
                        </span>
                      </div>

                      <span className="text-[15px] font-bold text-slate-800">
                        {item.value.toLocaleString("es-CO")} registros
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${barWidth}%`,
                          background: item.color,
                          transition: "width 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center pt-4">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={140}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString("es-CO")} registros`,
                      "Cantidad",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {data.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded bg-slate-50"
                        style={{ color: item.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-sm font-medium text-slate-600">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SpeciesRegisteredModal;
