"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Fauna } from "../components/filters/Fauna";
import { Fecha } from "../components/filters/Fecha";
import { Flora } from "../components/filters/Flora";
import { HydrationFix } from "../components/layout/HydrationFix";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { SearchBar } from "../components/ui/SearchBar";
import { fetchObservationDateBounds } from "../lib/observations-api";
import { getObservationYear, getYearRange } from "../lib/year-visualization";
import type { DateRange } from "../types/map.types";
import type { FilterSection } from "../types/navigation.types";
import { MapViewNoSSR } from "./components/MapViewNoSSR";

export type SourceType = "iNaturalist" | "ODK" | "Ubicacion";

const getTodayInputValue = (): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${currentYear}-${month}-${day}`;
};

export default function Home() {
  const [isUIHidden, setIsUIHidden] = useState(false);

  // Panel de filtros: null = cerrado, string = sección activa
  const [activeFilterSection, setActiveFilterSection] = useState<FilterSection | null>(null);
  const [lastActiveSection, setLastActiveSection] = useState<FilterSection>("fauna");

  // Grupo seleccionado independiente por sección
  const [selectedGroups, setSelectedGroups] = useState<Record<FilterSection, string | null>>({
    fauna: null,
    flora: null,
    fecha: null,
    analisis: null,
  });

  // Fuentes activas
  const [activeSources, setActiveSources] = useState<Set<SourceType>>(
    new Set(["iNaturalist", "ODK"]),
  );

  // Fecha
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [dateBounds, setDateBounds] = useState<{
    minDate: string | null;
    maxDate: string | null;
  } | null>(null);
  const [isDateBoundsLoading, setIsDateBoundsLoading] = useState(true);
  const [isYearsMode, setIsYearsMode] = useState(false);

  // Refs para cerrar el panel al hacer click fuera
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSectionChange = (section: FilterSection) => {
    setLastActiveSection(section);
    // Si ya está activa la misma sección, la cierra (toggle)
    setActiveFilterSection((prev) => (prev === section ? null : section));
  };

  const handleGroupSelected = (section: FilterSection) => (groupName: string | null) => {
    setSelectedGroups((prev) => ({ ...prev, [section]: groupName }));
  };

  const handleSourceToggle = (source: SourceType) => {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(source) && next.size === 1) return prev;
      if (next.has(source)) {
        next.delete(source);
      } else {
        next.add(source);
      }
      return next;
    });
  };

  const getBackendSource = (): "all" | "drive" | "inaturalist" => {
    const hasINat = activeSources.has("iNaturalist");
    const hasDrive = activeSources.has("ODK") || activeSources.has("Ubicacion");
    if (hasINat && hasDrive) return "all";
    if (hasINat) return "inaturalist";
    if (hasDrive) return "drive";
    return "all";
  };

  const defaultYear =
    (() => {
      if (dateBounds?.maxDate) {
        const maxYear = getObservationYear(dateBounds.maxDate);
        if (maxYear !== null) return maxYear;
      }
      return new Date().getUTCFullYear();
    })() ?? new Date().getUTCFullYear();

  const activeYear = selectedYear ?? defaultYear;
  const effectiveDateRange = isYearsMode ? getYearRange(activeYear) : selectedDateRange;
  // En modo año el grupo taxonómico sigue activo — ambas dimensiones son ortogonales
  const effectiveSelectedGroup = selectedGroups[lastActiveSection];
  const visibleFilterSection = activeFilterSection;
  const backendSource = getBackendSource();

  // Reset específico por filtro — cada uno limpia solo su propia dimensión
  const resetDateRange = () => {
    setSelectedDateRange(
      dateBounds?.minDate ? { from: dateBounds.minDate, to: getTodayInputValue() } : null,
    );
    setSelectedYear(null);
    setIsYearsMode(false);
  };

  const resetYearSelection = () => {
    // Salir del modo año y restaurar el rango histórico completo
    setIsYearsMode(false);
    setSelectedYear(null);
    setSelectedDateRange(
      dateBounds?.minDate ? { from: dateBounds.minDate, to: getTodayInputValue() } : null,
    );
  };

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    if (year !== null) {
      setSelectedDateRange(getYearRange(year));
    }
  };

  // ── Efectos ───────────────────────────────────────────────────────────────

  // Cerrar panel al hacer click fuera del sidebar y del panel
  useEffect(() => {
    if (!activeFilterSection || isUIHidden) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (filterPanelRef.current?.contains(target)) return;
      if (sidebarRef.current?.contains(target)) return;
      setActiveFilterSection(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [activeFilterSection, isUIHidden]);

  // Cargar límites de fecha reales desde el backend
  useEffect(() => {
    let cancelled = false;

    const loadDateBounds = async () => {
      try {
        setIsDateBoundsLoading(true);
        const bounds = await fetchObservationDateBounds();
        if (cancelled) return;
        setDateBounds(bounds);
        if (bounds.minDate) {
          setSelectedDateRange({ from: bounds.minDate, to: getTodayInputValue() });
        }
      } catch {
        // Error no crítico: el componente Fecha usará la fecha de hoy como fallback
      } finally {
        if (!cancelled) setIsDateBoundsLoading(false);
      }
    };

    void loadDateBounds();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const renderActiveFilter = () => {
    return (
      <>
        <div className={visibleFilterSection === "fauna" ? "contents" : "hidden"}>
          <Fauna
            onClose={() => setActiveFilterSection(null)}
            onReset={() => setSelectedGroups((prev) => ({ ...prev, fauna: null }))}
            onGroupSelected={handleGroupSelected("fauna")}
            activeSources={activeSources}
            onSourceToggle={handleSourceToggle}
            initialSelectedGroup={selectedGroups.fauna}
            backendSource={backendSource}
            dateFrom={effectiveDateRange?.from}
            dateTo={effectiveDateRange?.to}
          />
        </div>
        <div className={visibleFilterSection === "flora" ? "contents" : "hidden"}>
          <Flora
            onClose={() => setActiveFilterSection(null)}
            onReset={() => setSelectedGroups((prev) => ({ ...prev, flora: null }))}
            onGroupSelected={handleGroupSelected("flora")}
            activeSources={activeSources}
            onSourceToggle={handleSourceToggle}
            initialSelectedGroup={selectedGroups.flora}
            backendSource={backendSource}
            dateFrom={effectiveDateRange?.from}
            dateTo={effectiveDateRange?.to}
          />
        </div>
        <div className={visibleFilterSection === "fecha" ? "contents" : "hidden"}>
          <Fecha
            minDate={dateBounds?.minDate ?? null}
            maxDate={getTodayInputValue()}
            value={effectiveDateRange ?? selectedDateRange}
            isLoading={isDateBoundsLoading}
            activeSources={activeSources}
            onSourceToggle={handleSourceToggle}
            isYearMode={isYearsMode}
            onYearModeToggle={() => setIsYearsMode(!isYearsMode)}
            onYearChange={handleYearChange}
            onChange={setSelectedDateRange}
            onReset={isYearsMode ? resetYearSelection : resetDateRange}
            onClose={() => setActiveFilterSection(null)}
          />
        </div>
      </>
    );
  };

  return (
    <HydrationFix>
      <div className="relative h-screen w-screen overflow-hidden bg-zinc-100">
        {/* Map is always full screen in the background */}
        <div className="absolute inset-0 z-0">
          <MapViewNoSSR
            isUIHidden={isUIHidden}
            isFilterOpen={Boolean(activeFilterSection)}
            selectedGroup={effectiveSelectedGroup}
            source={backendSource}
            dateFrom={effectiveDateRange?.from}
            dateTo={effectiveDateRange?.to}
            isYearMode={isYearsMode}
          />
        </div>

        {/* Sidebar - sliding out to the left */}
        <div
          ref={sidebarRef}
          className={`absolute left-0 top-0 bottom-0 z-50 transition-transform duration-600 ease-premium will-change-transform ${
            isUIHidden ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <Sidebar activeSection={lastActiveSection} onSectionChange={handleSectionChange} />
        </div>

        <div
          ref={filterPanelRef}
          data-filter-panel
          className={`filter-panel-window absolute z-20 flex flex-col transition-all duration-600 ease-premium will-change-transform ${
            isUIHidden || !activeFilterSection
              ? "-translate-x-8 opacity-0 pointer-events-none"
              : "translate-x-0 opacity-100"
          }`}
        >
          {renderActiveFilter()}
        </div>

        {/* Topbar - sliding up */}
        <div
          className={`absolute top-0 left-sidebar-offset right-0 z-40 transition-transform duration-600 ease-premium will-change-transform ${
            isUIHidden ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <Topbar isUIHidden={isUIHidden} isSearchDisabled={isYearsMode} />
        </div>

        {/* Floating UI Elements Overlay */}
        <div className="pointer-events-none absolute inset-0 z-50">
          {/* Floating Search Bar (Visible only when UI is hidden) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-full max-w-md px-4 transition-all duration-600 ease-premium ${
              isUIHidden
                ? "top-3 opacity-100 pointer-events-auto"
                : "top-3 opacity-0 pointer-events-none"
            }`}
          >
            <div data-searchbar-float className="rounded-full shadow-premium-lg backdrop-blur-md">
              <SearchBar className="!bg-white/90 border-white/40" disabled={isYearsMode} />
            </div>
          </div>

          {/* Floating UI Toggle Button (Centered vertically on the left edge) */}
          <button
            type="button"
            onClick={() => setIsUIHidden(!isUIHidden)}
            className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 left-0 flex h-14 w-6 items-center justify-center rounded-r-xl bg-white/95 backdrop-blur-md shadow-sidebar border border-l-0 border-black/5 text-zinc-400 transition-all duration-600 ease-premium will-change-transform hover:bg-white hover:text-emerald-soft hover:w-7 active:scale-90 group ${
              isUIHidden ? "translate-x-0" : "translate-x-[95px]"
            }`}
            aria-label="Alternar Interfaz"
          >
            <div className="transition-transform duration-500">
              {isUIHidden ? (
                <ChevronsRight className="h-5 w-5" strokeWidth={2.5} />
              ) : (
                <ChevronsLeft className="h-5 w-5" strokeWidth={2.5} />
              )}
            </div>
          </button>
        </div>
      </div>
    </HydrationFix>
  );
}
