"use client";

import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  RotateCcw,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchObservationDates, fetchTaxonomicGroups } from "../../lib/observations-api";
import { getObservationYear, getYearPalette } from "../../lib/year-visualization";
import type { DateRange } from "../../types/map.types";

const SHIMMER_LABEL_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(59,130,246,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  animation: "popup-shimmer 8s linear infinite",
  animationDelay: "-2s",
};

type FechaProps = {
  minDate: string | null;
  maxDate: string;
  value: DateRange | null;
  isLoading?: boolean;
  activeSources?: Set<string>;
  onSourceToggle?: (source: "iNaturalist" | "ODK" | "Ubicacion") => void;
  isYearMode?: boolean;
  onYearModeToggle?: () => void;
  onYearChange?: (year: number | null) => void;
  onChange: (range: DateRange) => void;
  onReset: () => void;
  onClose?: () => void;
};

// --- Helpers (memoized for performance) ---
const parseDate = (dateStr: string | null) =>
  dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
const formatDate = (date: Date) => date.toISOString().split("T")[0] as string;

// Cache for month names to avoid repeated Intl calls
const MONTH_NAMES_CACHE = (() => {
  const cache: Record<number, string> = {};
  for (let i = 0; i < 12; i++) {
    cache[i] = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(2024, i, 1));
  }
  return cache;
})();

const getMonthName = (date: Date) => MONTH_NAMES_CACHE[date.getMonth()] || "";

export function Fecha({
  minDate,
  maxDate,
  value,
  isLoading = false,
  activeSources,
  onSourceToggle,
  isYearMode = false,
  onYearModeToggle,
  onYearChange,
  onChange,
  onReset,
  onClose,
}: FechaProps) {
  // --- States ---
  // Dos viewDate independientes: uno por campo, para que navegar en Desde
  // no afecte la posición del calendario cuando se cambia a Hasta y viceversa.
  const [viewDateFrom, setViewDateFrom] = useState(parseDate(value?.from || minDate));
  const [viewDateTo, setViewDateTo] = useState(parseDate(value?.to || maxDate));
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [calendarView, setCalendarView] = useState<"days" | "months" | "years">("days");
  const [isPickingYearSelector, setIsPickingYearSelector] = useState(false);

  // El viewDate activo depende de qué campo está seleccionado
  const viewDate = picking === "from" ? viewDateFrom : viewDateTo;
  const setViewDate = picking === "from" ? setViewDateFrom : setViewDateTo;

  // --- Date Constraints ---
  const minAllowedDate = useMemo(
    () => (minDate ? parseDate(minDate) : new Date(2010, 0, 1)),
    [minDate],
  );
  const maxAllowedDate = useMemo(() => parseDate(maxDate), [maxDate]);

  const currentRange = useMemo(
    () => ({
      from: value?.from ? parseDate(value.from) : minAllowedDate,
      to: value?.to ? parseDate(value.to) : maxAllowedDate,
    }),
    [value, minAllowedDate, maxAllowedDate],
  );

  const selectedFromDate = value?.from ? parseDate(value.from) : null;
  const selectedToDate = value?.to ? parseDate(value.to) : null;

  const hasCompleteRange = currentRange.from.getTime() !== currentRange.to.getTime();

  // --- Year Mode Logic ---
  const minAllowedYear = getObservationYear(minDate || "2010") ?? 2010;
  const maxAllowedYear = Math.max(2040, getObservationYear(maxDate) ?? minAllowedYear);
  const currentYear = getObservationYear(value?.to ?? maxDate) ?? maxAllowedYear;
  const yearPalette = getYearPalette(currentYear);

  const localActiveSources = useMemo(
    () => activeSources ?? new Set(["iNaturalist", "ODK"]),
    [activeSources],
  );

  // --- Sync view date with selection when it changes externally (reset, carga inicial) ---
  const prevRangeRef = useRef<{ from: string; to: string } | null>(null);
  useEffect(() => {
    const fromStr = value?.from ?? null;
    const toStr = value?.to ?? null;
    const prevFrom = prevRangeRef.current?.from ?? null;
    const prevTo = prevRangeRef.current?.to ?? null;
    if (fromStr !== prevFrom || toStr !== prevTo) {
      prevRangeRef.current = { from: fromStr ?? "", to: toStr ?? "" };
      // Solo sincroniza si el cambio viene de fuera (reset, carga inicial)
      // No toca el viewDate del campo que el usuario NO está editando
      if (fromStr && fromStr !== prevFrom) {
        setViewDateFrom(parseDate(fromStr));
      }
      if (toStr && toStr !== prevTo) {
        setViewDateTo(parseDate(toStr));
      }

      if (fromStr && toStr && fromStr !== prevFrom && toStr !== prevTo) {
        setPicking("from");
        setCalendarView("days");
      }
    }
  }, [value?.from, value?.to]);

  // --- Observations Count Logic ---
  const [totalObservations, setTotalObservations] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const loadCount = async () => {
      try {
        const groups = await fetchTaxonomicGroups({
          dateFrom: value?.from || null,
          dateTo: value?.to || null,
        });
        if (cancelled) return;

        const hasINat = localActiveSources.has("iNaturalist");
        const hasDrive = localActiveSources.has("ODK") || localActiveSources.has("Ubicacion");

        const total = groups.reduce((acc, g) => {
          let c = 0;
          if (hasINat) c += g.inaturalist || 0;
          if (hasDrive) c += g.drive || 0;
          return acc + c;
        }, 0);
        setTotalObservations(total);
      } catch (_err) {
        // Ignorar el error para evitar fallos visibles en caso de timeout
      }
    };

    void loadCount();
    return () => {
      cancelled = true;
    };
  }, [value?.from, value?.to, localActiveSources]);

  // --- Calendar Logic ---
  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
    return { offset, days };
  }, [viewDate]);

  // --- Fechas reales con observaciones — cache + prefetch de meses adyacentes ---
  const [observationDates, setObservationDates] = useState<Set<string>>(new Set());
  // Cache: clave "YYYY-MM" → Set de fechas con observaciones
  const datesCache = useRef<Map<string, Set<string>>>(new Map());
  // Ref para cancelar solo el fetch del mes visible al cambiar
  const visibleFetchController = useRef<AbortController | null>(null);

  useEffect(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const cacheKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    // Si ya está en cache, mostrar inmediatamente sin ghosting
    const cached = datesCache.current.get(cacheKey);
    if (cached) {
      setObservationDates(cached);
    } else {
      // Limpiar para evitar ghosting del mes anterior
      setObservationDates(new Set());

      // Cancelar fetch anterior del mes visible si aún está en curso
      visibleFetchController.current?.abort();
      const controller = new AbortController();
      visibleFetchController.current = controller;

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      fetchObservationDates({
        dateFrom: formatDate(firstDay),
        dateTo: formatDate(lastDay),
        source: "all",
        signal: controller.signal,
      })
        .then((dates) => {
          const dateSet = new Set(dates);
          datesCache.current.set(cacheKey, dateSet);
          setObservationDates(dateSet);
        })
        .catch(() => {
          // Silencioso — el calendario funciona sin los puntos
        });
    }

    // Prefetch de mes anterior y siguiente en background (sin cancelar al limpiar)
    const adjacentMonths = [
      { y: month === 0 ? year - 1 : year, m: month === 0 ? 11 : month - 1 },
      { y: month === 11 ? year + 1 : year, m: month === 11 ? 0 : month + 1 },
    ];

    for (const { y, m } of adjacentMonths) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      if (datesCache.current.has(key)) continue;

      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);

      fetchObservationDates({
        dateFrom: formatDate(firstDay),
        dateTo: formatDate(lastDay),
        source: "all",
      })
        .then((dates) => {
          datesCache.current.set(key, new Set(dates));
        })
        .catch(() => {
          // Silencioso
        });
    }

    return () => {
      // Solo cancelar el fetch del mes visible, no los prefetches
      visibleFetchController.current?.abort();
    };
  }, [viewDate]);

  const handleDayClick = useCallback(
    (day: number) => {
      const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const selectedStr = formatDate(selected);

      if (picking === "from") {
        if (selectedFromDate && formatDate(selectedFromDate) === selectedStr) {
          onChange({ from: null, to: value?.to ?? null });
          return;
        }

        const nextTo = selected > currentRange.to ? selected : currentRange.to;
        onChange({ from: selectedStr, to: formatDate(nextTo) });
      } else {
        if (selectedToDate && formatDate(selectedToDate) === selectedStr) {
          onChange({ from: value?.from ?? null, to: null });
          return;
        }

        const nextFrom = selected < currentRange.from ? selected : currentRange.from;
        onChange({ from: formatDate(nextFrom), to: selectedStr });
      }
    },
    [picking, viewDate, selectedFromDate, selectedToDate, currentRange, value, onChange],
  );

  const changeMonth = useCallback(
    (offset: number) => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    },
    [viewDate, setViewDate],
  );

  const handleReset = useCallback(() => {
    onReset();
    setPicking("from");
    setCalendarView("days");
    setViewDateFrom(parseDate(minDate || value?.from || maxDate));
    setViewDateTo(parseDate(maxDate));
  }, [onReset, minDate, value?.from, maxDate]);

  // Memoize day cell data to avoid recalculations
  const dayCellData = useMemo(() => {
    const cells: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isOutsideSelectedRange: boolean;
      isFrom: boolean;
      isTo: boolean;
      isSelected: boolean;
      isInRange: boolean;
      isOutside: boolean;
      isToday: boolean;
      hasObservations: boolean;
      showDot: boolean;
    }> = [];

    const todayStr = formatDate(new Date());
    const fromStr = formatDate(currentRange.from);
    const toStr = formatDate(currentRange.to);

    for (let i = 0; i < 42; i++) {
      const dayNumber = i - daysInMonth.offset + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth.days;

      if (!isCurrentMonth) {
        cells.push({
          dayNumber,
          isCurrentMonth: false,
          dateStr: "",
          isOutsideSelectedRange: false,
          isFrom: false,
          isTo: false,
          isSelected: false,
          isInRange: false,
          isOutside: false,
          isToday: false,
          hasObservations: false,
          showDot: false,
        });
        continue;
      }

      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNumber);
      const dateStr = formatDate(date);
      const isOutsideSelectedRange = date < currentRange.from || date > currentRange.to;
      const isFrom = dateStr === fromStr;
      const isTo = dateStr === toStr;
      const isSelected = isFrom || isTo;
      const isInRange = date > currentRange.from && date < currentRange.to;
      const isOutside = date < minAllowedDate || date > maxAllowedDate;
      const isToday = dateStr === todayStr;
      const hasObservations = observationDates.has(dateStr);
      const showDot = hasObservations && !isSelected && isInRange && hasCompleteRange;

      cells.push({
        dayNumber,
        isCurrentMonth: true,
        dateStr,
        isOutsideSelectedRange,
        isFrom,
        isTo,
        isSelected,
        isInRange,
        isOutside,
        isToday,
        hasObservations,
        showDot,
      });
    }

    return cells;
  }, [
    viewDate,
    daysInMonth,
    currentRange,
    minAllowedDate,
    maxAllowedDate,
    hasCompleteRange,
    observationDates,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col p-6 animate-pulse space-y-6">
        <div className="h-16 w-full rounded-3xl bg-slate-100" />
        <div className="h-12 w-full rounded-2xl bg-slate-100" />
        <div className="h-64 w-full rounded-4xl bg-slate-100" />
      </div>
    );
  }

  return (
    <section
      className="flex flex-1 min-h-0 flex-col transition-opacity duration-600 ease-premium"
      style={{ background: "transparent", overflow: "visible" }}
      data-filter-theme="blue"
    >
      {/* ── HEADER Premium ── */}
      <div className="flex flex-col px-5 pt-3 pb-5 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            {/* Icono con gradiente ámbar */}
            <div
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-4-5 text-white"
              style={{
                background: "linear-gradient(145deg, #60a5fa 0%, #2563eb 100%)",
                boxShadow: "0 2px 6px rgba(59,130,246,0.3), 0 8px 24px rgba(59,130,246,0.25)",
              }}
            >
              <CalendarDays className="h-icon-lg w-icon-lg" strokeWidth={2.2} />
            </div>

            {/* Texto */}
            <div className="flex flex-col gap-0.5">
              <p
                className="text-[9.5px] font-bold uppercase tracking-premium"
                style={SHIMMER_LABEL_STYLE}
              >
                Cronología de Datos
              </p>
              <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900 leading-tight">
                Fecha
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón reset (flecha) — reposicionado */}
            <button
              type="button"
              onClick={handleReset}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[12px] text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all active:scale-95"
              title="Reiniciar filtros"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {/* Botón cerrar — Premium estilo Flora/Fauna */}
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="filter-close-btn flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-slate-400 hover:bg-blue-600! hover:text-white hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.7) 100%)",
                  border: "1px solid rgba(226,232,240,0.8)",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Botones de fuente ── */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            {
              id: "iNaturalist",
              label: "iNaturalist",
              logo: "/INaturalist_logo.png",
              activeClass: "source-chip-active-blue",
            },
            { id: "ODK", label: "ODK", logo: "/ODK.png", activeClass: "source-chip-active-blue" },
            {
              id: "Year",
              label: "Año",
              icon: CalendarIcon,
              special: true,
              activeClass: "source-chip-active-blue",
            },
          ].map((src) => {
            const isActive = src.special ? isYearMode : localActiveSources.has(src.id);
            const toggle = src.special
              ? onYearModeToggle
              : () => onSourceToggle?.(src.id as "iNaturalist" | "ODK" | "Ubicacion");

            return (
              <div key={src.label} className="py-[3px]">
                <button
                  type="button"
                  onClick={toggle}
                  className={`source-chip-button group relative flex w-full min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60
                    ${
                      isActive
                        ? `${src.activeClass} active:brightness-[0.97]`
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
                  {src.logo ? (
                    <div
                      className={`source-chip-logo-wrap relative flex h-icon-lg w-icon-lg shrink-0 items-center justify-center rounded-[9px] transition-all duration-500 ${isActive ? "source-chip-logo-wrap-on" : "source-chip-logo-wrap-off"}`}
                    >
                      <Image
                        src={src.logo}
                        alt={src.label}
                        fill
                        className={`object-contain p-[2px] transition-all duration-500 ${isActive ? "source-chip-logo-on" : "source-chip-logo-off"}`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`source-chip-logo-wrap relative flex h-icon-lg w-icon-lg shrink-0 items-center justify-center rounded-[9px] transition-all duration-500 ${isActive ? "source-chip-logo-wrap-on" : "source-chip-logo-wrap-off"}`}
                    >
                      {src.icon && (
                        <src.icon
                          className="h-[14px] w-[14px] shrink-0 transition-colors duration-500"
                          style={{ color: isActive ? "#2563eb" : "#94a3b8" }}
                          strokeWidth={2}
                        />
                      )}
                    </div>
                  )}
                  <span
                    className="text-[10px] tracking-[0.01em] font-semibold whitespace-nowrap leading-none"
                    style={{
                      color: isActive ? "#1e3a8a" : "#94a3b8",
                    }}
                  >
                    {src.label}
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
                  "linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(59,130,246,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "popup-shimmer 8s linear infinite",
                animationDelay: "-1s",
              }}
            >
              Observaciones
            </p>
            <p
              className="text-[38px] font-black leading-none tracking-[-0.04em]"
              style={{
                background:
                  "linear-gradient(90deg, #1e293b 0%, #334155 25%, #3b82f6 50%, #334155 75%, #1e293b 100%)",
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
              {totalObservations}
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
                  style={{ color: "#3b82f6" }}
                  strokeWidth={2}
                />
              </div>
            )}
          </div>
        </div>
        {/* Divisor — igual que Fauna/Flora */}
        <div
          className="mb-5 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.15) 30%, rgba(59,130,246,0.15) 70%, transparent 100%)",
          }}
        />
      </div>

      <div
        className={`flex flex-col min-h-0 ${isYearMode && !isPickingYearSelector ? "px-6 shrink-0" : "flex-1"}`}
      >
        {isYearMode ? (
          /* ── YEAR MODE ── */
          <div
            className={`flex flex-col gap-5 pt-2 ${isPickingYearSelector ? "flex-1 min-h-0" : ""}`}
          >
            {!isPickingYearSelector ? (
              <div className="flex flex-col gap-5">
                {/* ── Tarjeta principal: selector de año ── */}
                <div
                  className="relative rounded-[28px] overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)",
                    border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                  }}
                >
                  {/* Blob decorativo */}
                  <div
                    className="absolute top-0 right-0 h-40 w-40 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 transition-colors duration-700"
                    style={{ backgroundColor: `${yearPalette.fill}18` }}
                  />

                  {/* Header */}
                  <div className="flex items-center gap-2 px-5 pt-5">
                    <div
                      className="h-4 w-[3px] rounded-full shrink-0 transition-colors duration-500"
                      style={{ backgroundColor: yearPalette.fill }}
                    />
                    <span
                      className="text-[10px] font-black text-slate-400 uppercase tracking-[0.22em]"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(59,130,246,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%)",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "popup-shimmer 8s linear infinite",
                        animationDelay: "-3s",
                      }}
                    >
                      Período Activo
                    </span>
                  </div>

                  {/* Fila: ← AÑO → — botones absolutos, número siempre centrado */}
                  <div className="relative flex items-center justify-center px-5 py-16">
                    <button
                      type="button"
                      onClick={() => onYearChange?.(currentYear - 1)}
                      disabled={currentYear <= minAllowedYear}
                      className="absolute left-5 h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 active:scale-95 group disabled:opacity-25 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPickingYearSelector(true)}
                      aria-label={`Seleccionar año, actualmente ${currentYear}`}
                      className="flex flex-col items-center gap-3 bg-transparent border-0 p-0 cursor-pointer group shrink-0"
                    >
                      <span
                        className="font-black leading-none will-change-transform group-hover:transform-[translateY(-2px)]"
                        style={{
                          fontSize: "3.5rem",
                          display: "block",
                          textAlign: "center",
                          color: "#0f172a",
                          fontFamily: "Poppins, sans-serif",
                          letterSpacing: "-0.03em",
                          width: "200px",
                          transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {currentYear}
                      </span>
                      <div
                        className="h-[3px] w-8 rounded-full transition-colors duration-500"
                        style={{
                          backgroundColor: yearPalette.fill,
                          boxShadow: `0 2px 8px ${yearPalette.fill}60`,
                        }}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onYearChange?.(currentYear + 1)}
                      disabled={currentYear >= maxAllowedYear}
                      className="absolute right-5 h-11 w-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200 active:scale-95 group disabled:opacity-25 disabled:pointer-events-none"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </button>
                  </div>

                  {/* Divisor + periodo */}
                  <div className="flex items-center gap-3 px-5 pb-8 opacity-40">
                    <div className="h-px bg-slate-300 flex-1" />
                    <span className="text-[9px] font-bold tracking-[0.24em] text-slate-500 uppercase whitespace-nowrap">
                      PERIODO {currentYear}
                    </span>
                    <div className="h-px bg-slate-300 flex-1" />
                  </div>
                </div>

                {/* ── Tarjeta Tinte Visual ── */}
                <div
                  className="flex items-center gap-3.5 px-4 py-4 rounded-[22px]"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.9) 100%)",
                    border: "1px solid rgba(226,232,240,0.7)",
                    boxShadow: "0 2px 12px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
                  }}
                >
                  {/* Icono con el color del año como fondo */}
                  <div
                    className="h-10 w-10 shrink-0 rounded-[14px] flex items-center justify-center"
                    style={{
                      background: `linear-gradient(145deg, ${yearPalette.light} 0%, ${yearPalette.fill} 100%)`,
                      boxShadow: `0 4px 12px ${yearPalette.fill}40`,
                    }}
                  >
                    <MapPinned
                      className="h-[17px] w-[17px]"
                      style={{
                        color: "rgba(255,255,255,0.95)",
                        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                      }}
                      strokeWidth={2.5}
                    />
                  </div>

                  {/* Texto */}
                  <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide leading-none">
                      Tinte Visual
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Dot con el color del año */}
                      <div
                        className="h-2 w-2 rounded-full shrink-0 transition-colors duration-500"
                        style={{
                          backgroundColor: yearPalette.fill,
                          boxShadow: `0 0 4px ${yearPalette.fill}80`,
                        }}
                      />
                      <span className="text-[9.5px] font-semibold text-slate-400 leading-none whitespace-nowrap">
                        Filtro activo por año
                      </span>
                    </div>
                  </div>

                  {/* Badge año */}
                  <div
                    className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-black tabular-nums transition-all duration-500 hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: yearPalette.fill,
                      color: "#fff",
                      boxShadow: `0 4px 14px ${yearPalette.fill}45`,
                    }}
                  >
                    {currentYear}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Selector de Ciclo — Premium ── */
              <motion.div
                key="year-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-1 flex-col gap-4 overflow-hidden min-h-0"
              >
                {/* ── Header: título + botón back ── */}
                <div className="flex items-center justify-between px-6 shrink-0">
                  <p
                    className="text-[9.5px] font-bold uppercase tracking-premium"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(15,23,42,0.32) 0%, rgba(15,23,42,0.48) 38%, rgba(59,130,246,0.72) 50%, rgba(15,23,42,0.48) 62%, rgba(15,23,42,0.32) 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "popup-shimmer 8s linear infinite",
                      animationDelay: "-5s",
                    }}
                  >
                    Seleccionar Año
                  </p>

                  {/* Botón volver con contorno */}
                  <button
                    type="button"
                    onClick={() => setIsPickingYearSelector(false)}
                    aria-label="Volver"
                    className="group flex h-9 w-9 items-center justify-center rounded-[14px] text-slate-400 transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 hover:text-blue-500"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.85) 100%)",
                      border: "1px solid rgba(226,232,240,0.8)",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                    }}
                  >
                    <ChevronLeft
                      className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                      strokeWidth={2.5}
                    />
                  </button>
                </div>

                {/* ── Lista scrollable premium ── */}
                <div
                  className="fauna-grid flex-1 overflow-y-auto min-h-0 rounded-b-[28px]"
                  style={{
                    background: "transparent",
                    paddingLeft: "24px",
                    paddingRight: "24px",
                    paddingTop: "4px",
                    paddingBottom: "80px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(148,163,184,0.6) transparent",
                  }}
                >
                  <div className="flex flex-col gap-3">
                    {Array.from(
                      { length: maxAllowedYear - minAllowedYear + 1 },
                      (_, i) => maxAllowedYear - i,
                    ).map((year) => {
                      const isSelected = year === currentYear;
                      const palette = getYearPalette(year);
                      return (
                        <button
                          type="button"
                          key={year}
                          onClick={() => {
                            onYearChange?.(year);
                            setIsPickingYearSelector(false);
                          }}
                          className="group relative flex w-full items-center gap-3.5 rounded-[20px] px-4 py-3.5 text-left transition-all duration-200 focus-visible:outline-none active:scale-[0.98]"
                          style={
                            isSelected
                              ? {
                                  background: "rgba(255,255,255,0.95)",
                                  border: `2px solid ${palette.fill}`,
                                  boxShadow: `0 4px 20px ${palette.fill}25, inset 0 1px 0 rgba(255,255,255,1)`,
                                }
                              : {
                                  background: "rgba(255,255,255,0.85)",
                                  border: "2px solid rgba(226,232,240,0.6)",
                                  boxShadow:
                                    "0 1px 4px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,1)",
                                }
                          }
                        >
                          {/* Swatch con color del año */}
                          <div
                            className="h-10 w-10 shrink-0 rounded-[14px] flex items-center justify-center transition-all duration-200"
                            style={
                              isSelected
                                ? {
                                    background: `linear-gradient(145deg, ${palette.light} 0%, ${palette.fill} 100%)`,
                                    boxShadow: `0 4px 12px ${palette.fill}50`,
                                  }
                                : {
                                    background: "rgba(255,255,255,0.7)",
                                    backdropFilter: "blur(12px)",
                                    WebkitBackdropFilter: "blur(12px)",
                                    border: `1.5px solid rgba(255,255,255,0.9)`,
                                    boxShadow: `0 2px 8px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)`,
                                  }
                            }
                          >
                            <CalendarIcon
                              className="h-[15px] w-[15px] transition-colors duration-200"
                              style={{
                                color: isSelected ? "rgba(255,255,255,0.95)" : palette.fill,
                              }}
                              strokeWidth={2.2}
                            />
                          </div>

                          {/* Año + etiqueta */}
                          <div className="flex flex-1 flex-col gap-[4px] min-w-0">
                            <span
                              className="text-[16px] font-extrabold tracking-tight leading-none tabular-nums"
                              style={{ color: isSelected ? palette.dark : "#0f172a" }}
                            >
                              {year}
                            </span>
                            <span
                              className="text-[9px] font-bold uppercase tracking-[0.16em] leading-none"
                              style={{ color: isSelected ? palette.fill : "#94a3b8" }}
                            >
                              Período
                            </span>
                          </div>

                          {/* Indicador seleccionado */}
                          {isSelected ? (
                            <div
                              className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center"
                              style={{
                                background: `linear-gradient(145deg, ${palette.light} 0%, ${palette.fill} 100%)`,
                                boxShadow: `0 3px 8px ${palette.fill}45`,
                              }}
                            >
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : (
                            <div
                              className="h-5 w-5 shrink-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                              style={{
                                background: `${palette.fill}15`,
                                border: `1px solid ${palette.fill}35`,
                              }}
                            >
                              <ChevronLeft
                                className="h-3 w-3 rotate-180"
                                style={{ color: palette.fill }}
                                strokeWidth={2.5}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col min-h-0 pt-0 pb-4 px-6">
            {/* Interactive Selector Cards */}
            <div className="grid grid-cols-2 gap-3.5 mb-6 shrink-0">
              {[
                { label: "Desde", date: currentRange.from, key: "from" },
                { label: "Hasta", date: currentRange.to, key: "to" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setPicking(item.key as "from" | "to")}
                  className={`flex flex-col items-start p-5 rounded-[20px] transition-all duration-300 border-2 text-left relative overflow-hidden
                    ${
                      picking === item.key
                        ? "bg-white border-blue-400 shadow-premium-lg z-10"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  style={
                    picking !== item.key
                      ? {
                          background:
                            "linear-gradient(160deg, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.7) 100%)",
                          boxShadow:
                            "0 1px 3px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,1)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-premium mb-2 ${picking === item.key ? "text-blue-500" : "text-slate-400"}`}
                  >
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-800 tracking-tight">
                      {item.date.getDate()}
                    </span>
                    <span className="text-[12px] font-bold text-slate-500 uppercase">
                      {getMonthName(item.date).substring(0, 3)}
                    </span>
                    <span className="text-[12px] font-medium text-slate-400">
                      {item.date.getFullYear()}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Premium Calendar Window */}
            <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[28px] shadow-premium-xl overflow-hidden">
              {calendarView === "days" && (
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  {/* Flecha izquierda - Premium pill */}
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-400 shadow-premium-xs transition-all duration-200 hover:border-blue-300 hover:text-blue-500 hover:bg-white hover:shadow-[0_4px_12px_rgba(59,130,246,0.08)] active:scale-95"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  </button>

                  {/* Centro: Mes y Año */}
                  <div className="flex flex-col items-center gap-1.5">
                    {/* Pill del Mes - Premium 2026 Glass */}
                    <button
                      type="button"
                      onClick={() => setCalendarView("months")}
                      className="group relative flex items-center gap-2 rounded-full px-6 py-2.5 bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_4px_20px_rgba(59,130,246,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.12),0_4px_12px_rgba(0,0,0,0.06)] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:rounded-full before:bg-linear-to-b before:from-white/60 before:to-transparent before:pointer-events-none"
                    >
                      <span className="relative z-10 text-[13px] font-black uppercase tracking-[0.08em] text-slate-800">
                        {getMonthName(viewDate)}
                      </span>
                      <ChevronDown
                        className="relative z-10 h-3 w-3 text-slate-500 transition-all duration-300 group-hover:translate-y-0.5 group-hover:text-blue-500"
                        strokeWidth={2.5}
                      />
                    </button>

                    {/* Año - Pill secundario premium */}
                    <button
                      type="button"
                      onClick={() => setCalendarView("years")}
                      className="group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100/70 backdrop-blur-sm border border-slate-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.6)] text-[12px] font-bold text-slate-600 tracking-tight transition-all duration-300 hover:bg-white/60 hover:shadow-[0_4px_12px_rgba(59,130,246,0.06)] hover:border-blue-200/50 hover:text-slate-700 active:scale-95"
                    >
                      {viewDate.getFullYear()}
                      <ChevronDown
                        className="h-3 w-3 text-slate-400 transition-all duration-300 group-hover:translate-y-0.5 group-hover:text-blue-400"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>

                  {/* Flecha derecha - Premium pill */}
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-400 shadow-premium-xs transition-all duration-200 hover:border-blue-300 hover:text-blue-500 hover:bg-white hover:shadow-[0_4px_12px_rgba(59,130,246,0.08)] active:scale-95"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}

              {/* Calendar Body Area */}
              <div className="relative flex flex-col flex-1 min-h-0">
                {calendarView === "days" && (
                  <motion.div
                    key={`days-${viewDate.getFullYear()}-${viewDate.getMonth()}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 flex flex-col will-change-transform"
                    style={{ transform: "translateZ(0)" }}
                  >
                    {/* Day Headings */}
                    <div className="grid grid-cols-7 px-5 pt-3 pb-2">
                      {["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"].map((d) => (
                        <span
                          key={d}
                          className="text-center text-[9.5px] font-black text-slate-300"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                    {/* Calendar Grid - High Interactivity */}
                    <div className="px-5 pb-3">
                      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                        {dayCellData.map((cellData, i) => {
                          if (!cellData.isCurrentMonth) {
                            // biome-ignore lint/suspicious/noArrayIndexKey: Static 42-cell grid with fixed positions
                            return <div key={`empty-${i}`} className="h-7 w-full" />;
                          }

                          return (
                            <button
                              type="button"
                              key={`day-${cellData.dayNumber}`}
                              disabled={cellData.isOutside || cellData.isOutsideSelectedRange}
                              onClick={() => handleDayClick(cellData.dayNumber)}
                              className={`relative h-7 w-full flex items-center justify-center rounded-[6px] text-[10px] font-semibold transition-colors duration-150 will-change-transform
                              ${cellData.isOutside || cellData.isOutsideSelectedRange ? "opacity-20 cursor-not-allowed text-slate-300" : "cursor-pointer"}
                              ${cellData.isSelected ? "bg-blue-500 text-white font-bold shadow-sm" : cellData.isToday ? "bg-slate-100 text-slate-700 ring-1 ring-slate-300" : cellData.hasObservations ? "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}
                            >
                              {cellData.dayNumber}
                              {cellData.showDot && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-[2px] rounded-full bg-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {calendarView === "months" && (
                  <motion.div
                    key="months-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 z-20 flex flex-col bg-white overflow-hidden"
                  >
                    {/* Header con label y botón volver */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Seleccionar Mes
                      </span>

                      {/* Botón volver con animación de flecha */}
                      <motion.button
                        type="button"
                        onClick={() => setCalendarView("days")}
                        whileHover={{ x: -3 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                      </motion.button>
                    </div>

                    {/* Separador sutil */}
                    <div className="mx-5 h-px bg-slate-100" />

                    {/* Grid de meses - Estático sin scroll */}
                    <div className="px-5 py-5">
                      <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const monthDate = new Date(2020, i, 1);
                          const isCurrent = viewDate.getMonth() === i;
                          const shortName = getMonthName(monthDate).substring(0, 3).toUpperCase();

                          return (
                            <button
                              key={shortName}
                              type="button"
                              onClick={() => {
                                setViewDate(new Date(viewDate.getFullYear(), i, 1));
                                setCalendarView("days");
                              }}
                              className={`relative flex h-12 items-center justify-center rounded-xl text-[13px] font-bold tracking-wide transition-all duration-200 ${
                                isCurrent
                                  ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                                  : "relative border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-linear-to-b hover:from-white hover:to-blue-50/30 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_4px_14px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]"
                              }`}
                            >
                              {shortName}
                              {isCurrent && (
                                <div className="absolute bottom-2 h-0.5 w-4 rounded-full bg-white/50" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {calendarView === "years" && (
                  <motion.div
                    key="years-view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 z-20 flex flex-col bg-white overflow-hidden"
                  >
                    {/* Header con label y botón volver */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Seleccionar Año
                      </span>

                      {/* Botón volver con animación de flecha */}
                      <motion.button
                        type="button"
                        onClick={() => setCalendarView("days")}
                        whileHover={{ x: -3 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100/80 text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                      </motion.button>
                    </div>

                    {/* Separador sutil */}
                    <div className="mx-5 h-px bg-slate-100" />

                    {/* Grid de años - Scroll fluido */}
                    <div
                      className="fauna-grid flex-1 overflow-y-auto min-h-0 px-5 py-5"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(148,163,184,0.6) transparent",
                      }}
                    >
                      <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: maxAllowedYear - minAllowedYear + 1 }).map((_, i) => {
                          const year = minAllowedYear + i;
                          const isCurrent = viewDate.getFullYear() === year;

                          return (
                            <button
                              key={year}
                              type="button"
                              onClick={() => {
                                setViewDate(new Date(year, viewDate.getMonth(), 1));
                                setCalendarView("days");
                              }}
                              className={`relative flex h-10 items-center justify-center rounded-lg text-[12px] font-bold tabular-nums transition-all duration-200 ${
                                isCurrent
                                  ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                                  : "relative border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-linear-to-b hover:from-white hover:to-blue-50/30 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_4px_14px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]"
                              }`}
                            >
                              {year}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
