"use client";

import { useEffect, useState } from "react";
import { Calendar, RotateCcw } from "lucide-react";
import type { DateRange } from "../../types/map.types";

type FechaProps = {
  minDate: string | null;
  maxDate: string;
  value: DateRange | null;
  isLoading?: boolean;
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
  onChange,
  onReset,
}: FechaProps) {
  // Elimina useState y useEffect — deriva directamente de la prop
  const minAllowedDate = minDate ?? getTodayInputValue();
  const currentRange = value ?? { from: minAllowedDate, to: maxDate };

  const handleFromChange = (nextFrom: string) => {
    const nextTo = currentRange.to && nextFrom > currentRange.to ? nextFrom : currentRange.to;
    onChange({ from: nextFrom, to: nextTo });
  };

  const handleToChange = (nextTo: string) => {
    const nextFrom = currentRange.from && currentRange.from > nextTo ? nextTo : currentRange.from;
    onChange({ from: nextFrom, to: nextTo });
  };

  // ... resto del JSX igual


  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Calendar className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#003B46]">Filtrar Fecha</h3>
            <p className="text-xs text-gray-500">Desde el registro más antiguo hasta hoy</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
          {value ? "Activo" : "Todo"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-8 text-sm text-gray-500">
          Cargando límites de fecha...
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
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
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#003B46] transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
