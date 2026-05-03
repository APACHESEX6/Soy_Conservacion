"use client";

import { Calendar, RotateCcw } from "lucide-react";
import type { DateRange } from "../../types/map.types";
import { getObservationYear, getYearPalette } from "../../lib/year-visualization";

type FechaProps = {
  minDate: string | null;
  maxDate: string;
  value: DateRange | null;
  isLoading?: boolean;
  isYearMode?: boolean;
  selectedYear?: number | null;
  onYearChange?: (year: number | null) => void;
  onChange: (range: DateRange) => void;
  onReset: () => void;
};

const getTodayInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function Fecha({
  minDate,
  maxDate,
  value,
  isLoading = false,
  isYearMode = false,
  selectedYear = null,
  onYearChange,
  onChange,
  onReset,
}: FechaProps) {
  const minAllowedDate = minDate ?? getTodayInputValue();
  const currentRange = value ?? { from: minAllowedDate, to: maxDate };
  const minAllowedYear = minDate ? getObservationYear(minDate) ?? 2023 : 2023;
  const maxAllowedYear = Math.max(2060, getObservationYear(maxDate) ?? minAllowedYear);
  const currentYear = selectedYear ?? getObservationYear(currentRange.to ?? maxDate) ?? maxAllowedYear;
  const yearPalette = getYearPalette(currentYear);

  const handleFromChange = (nextFrom: string) => {
    const nextTo = currentRange.to && nextFrom > currentRange.to ? nextFrom : currentRange.to;
    onChange({ from: nextFrom, to: nextTo });
  };

  const handleToChange = (nextTo: string) => {
    const nextFrom = currentRange.from && currentRange.from > nextTo ? nextTo : currentRange.from;
    onChange({ from: nextFrom, to: nextTo });
  };

  const handleYearInputChange = (nextValue: string) => {
    if (!onYearChange) {
      return;
    }

    if (nextValue.trim() === "") {
      onYearChange(null);
      return;
    }

    const parsedYear = Number(nextValue);
    if (!Number.isInteger(parsedYear)) {
      return;
    }

    const clampedYear = Math.min(Math.max(parsedYear, minAllowedYear), maxAllowedYear);
    onYearChange(clampedYear);
  };

  const handleReset = () => {
    onReset();
  };

  const statusLabel = isYearMode ? "Año exacto" : value ? "Activo" : "Todo";

  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Calendar className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#003B46]">
              {isYearMode ? "Filtrar Año" : "Filtrar Fecha"}
            </h3>
            <p className="text-xs text-gray-500">
              {isYearMode ? "Solo un año exacto para comparar colores" : "Desde el registro más antiguo hasta hoy"}
            </p>
          </div>
        </div>
        {isYearMode ? (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
            style={{ backgroundColor: yearPalette.chipBg, color: yearPalette.chipText }}
          >
            {currentYear}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            {statusLabel}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-8 text-sm text-gray-500">
          {isYearMode ? "Cargando límites de año..." : "Cargando límites de fecha..."}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
          {isYearMode ? (
            <div className="flex flex-1 flex-col gap-4">
              <div className="grid gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Año exacto
                  <input
                    type="number"
                    min={minAllowedYear}
                    max={maxAllowedYear}
                    step={1}
                    inputMode="numeric"
                    value={currentYear}
                    onChange={(event) => handleYearInputChange(event.target.value)}
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#003B46] outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                  />
                </label>

                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-3 py-3 text-xs text-amber-900/80 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold uppercase tracking-wide">Color del año</span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
                      style={{ backgroundColor: yearPalette.chipBg, color: yearPalette.chipText }}
                    >
                      {currentYear}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-amber-900/70">
                    Cada año tiene un color estable para comparar registros de iNaturalist y ODK.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-gray-500">
                  {minDate ? `Más antiguo: ${minDate}` : "No se encontró una fecha mínima."}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#003B46] transition hover:border-amber-300 hover:text-amber-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restablecer
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Fecha inicial
                  <input
                    type="date"
                    min={minAllowedDate}
                    max={currentRange.to ?? maxDate}
                    value={currentRange.from ?? minAllowedDate}
                    onChange={(event) => handleFromChange(event.target.value)}
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#003B46] outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Fecha final
                  <input
                    type="date"
                    min={currentRange.from ?? minAllowedDate}
                    max={maxDate}
                    value={currentRange.to ?? maxDate}
                    onChange={(event) => handleToChange(event.target.value)}
                    className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#003B46] outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-xs text-gray-500">
                  {minDate ? `Más antiguo: ${minDate}` : "No se encontró una fecha mínima."}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#003B46] transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restablecer
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
