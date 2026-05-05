"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { Fauna } from "../components/filters/Fauna";
import { Fecha } from "../components/filters/Fecha";
import { Flora } from "../components/filters/Flora";
import { HydrationFix } from "../components/layout/HydrationFix";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { SearchBar } from "../components/ui/SearchBar";
import type { DateRange } from "../types/map.types";
import type { FilterSection } from "../types/navigation.types";
import { MapViewNoSSR } from "./components/MapViewNoSSR";

export default function Home() {
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<FilterSection>("fauna");

  // State for Fecha filter
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isYearMode, setIsYearMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const renderActiveFilter = () => {
    switch (activeFilterSection) {
      case "fauna":
        return <Fauna />;
      case "flora":
        return <Flora />;
      case "fecha":
        return (
          <Fecha
            minDate="2023-01-01"
            maxDate={new Date().toISOString().slice(0, 10)}
            value={dateRange}
            isYearMode={isYearMode}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onChange={setDateRange}
            onReset={() => {
              setDateRange(null);
              setSelectedYear(null);
              setIsYearMode(false);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <HydrationFix>
      <div className="relative h-screen w-screen overflow-hidden bg-zinc-100">
        {/* Map is always full screen in the background */}
        <div className="absolute inset-0 z-0">
          <MapViewNoSSR isUIHidden={isUIHidden} />
        </div>

        {/* Sidebar - sliding out to the left */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-50 transition-transform duration-600 ease-premium will-change-transform ${
            isUIHidden ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <Sidebar activeSection={activeFilterSection} onSectionChange={setActiveFilterSection} />
        </div>

        {/* Filter panel - appears next to the sidebar */}
        <div
          className={`absolute left-sidebar-offset top-topbar-height bottom-0 z-20 w-90 px-4 pb-4 pt-4 transition-all duration-600 ease-premium ${
            isUIHidden
              ? "-translate-x-8 opacity-0 pointer-events-none"
              : "translate-x-0 opacity-100"
          }`}
        >
          <div className="flex h-full flex-col rounded-7 border border-white/60 bg-white/75 p-4 shadow-premium-xl backdrop-blur-xl">
            {renderActiveFilter()}
          </div>
        </div>

        {/* Topbar - sliding up */}
        <div
          className={`absolute top-0 left-sidebar-offset right-0 z-40 transition-transform duration-600 ease-premium will-change-transform ${
            isUIHidden ? "-translate-y-full" : "translate-y-0"
          }`}
        >
          <Topbar isUIHidden={isUIHidden} />
        </div>

        {/* Floating UI Elements Overlay */}
        <div className="pointer-events-none absolute inset-0 z-50">
          {/* Floating Search Bar (Visible only when UI is hidden) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-full max-w-120 px-4 transition-all duration-600 ease-premium ${
              isUIHidden
                ? "top-2.75 opacity-100 pointer-events-auto"
                : "top-2.75 opacity-0 pointer-events-none"
            }`}
          >
            <div data-searchbar-float className="rounded-full shadow-premium-lg backdrop-blur-md">
              <SearchBar className="bg-white/90! border-white/40" />
            </div>
          </div>

          {/* Floating UI Toggle Button (Centered vertically on the left edge) */}
          <button
            type="button"
            onClick={() => setIsUIHidden(!isUIHidden)}
            className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 left-0 flex h-14 w-6 items-center justify-center rounded-r-xl bg-white/95 backdrop-blur-md shadow-sidebar border border-l-0 border-black/5 text-zinc-400 transition-all duration-600 ease-premium will-change-transform hover:bg-white hover:text-emerald-soft hover:w-7 active:scale-90 group ${
              isUIHidden ? "translate-x-0" : "translate-x-sidebar-offset"
            }`}
            aria-label={isUIHidden ? "Mostrar Interfaz" : "Ocultar Interfaz"}
            title={isUIHidden ? "Mostrar Interfaz" : "Ocultar Interfaz"}
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

// format-sync
