"use client";

import { useEffect, useRef, useState } from "react";
import { MapView } from "../components/map/MapView";
import { Sidebar } from "../components/layout/Sidebar";
import { Topbar } from "../components/layout/Topbar";
import { SearchBar } from "../components/ui/SearchBar";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Fauna } from "../components/filters/Fauna";
import { Flora } from "../components/filters/Flora";

export type FilterSection = "fauna" | "flora";
export type SourceType = "iNaturalist" | "ODK" | "Ubicacion";

export default function Home() {
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<FilterSection | null>(null);
  const [lastActiveSection, setLastActiveSection] = useState<FilterSection>("fauna");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<Set<SourceType>>(
    new Set(["iNaturalist", "ODK", "Ubicacion"]),
  );
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const filterPanelRef = useRef<HTMLDivElement | null>(null);

  const getBackendSource = (): "all" | "drive" | "inaturalist" => {
    const hasINat = activeSources.has("iNaturalist");
    const hasODK = activeSources.has("ODK");
    const hasUbicacion = activeSources.has("Ubicacion");
    const hasDrive = hasODK || hasUbicacion;

    if (hasINat && hasDrive) return "all";
    if (hasINat) return "inaturalist";
    if (hasDrive) return "drive";
    return "all";
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

  useEffect(() => {
    if (activeFilterSection !== null) {
      setLastActiveSection(activeFilterSection);
    }
  }, [activeFilterSection]);

  useEffect(() => {
    if (!activeFilterSection || isUIHidden) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (filterPanelRef.current?.contains(target)) {
        return;
      }

      if (sidebarRef.current?.contains(target)) {
        return;
      }

      setActiveFilterSection(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activeFilterSection, isUIHidden]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-100">
      {/* Map is always full screen in the background */}
      <div className="absolute inset-0 z-0">
        <MapView
          isUIHidden={isUIHidden}
          selectedGroup={selectedGroup}
          source={getBackendSource()}
        />
      </div>

      {/* Sidebar - sliding out to the left */}
      <div
        ref={sidebarRef}
        className={`absolute left-0 top-0 bottom-0 z-50 transition-transform duration-600 cubic-bezier-[0.4,0,0.2,1] will-change-transform ${
          isUIHidden ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <Sidebar activeSection={activeFilterSection} onSectionChange={setActiveFilterSection} />
      </div>

      {/* Filter panel - appears next to the sidebar */}
      <div
        ref={filterPanelRef}
        className={`absolute left-[95px] top-[58px] bottom-0 z-20 w-[360px] px-4 pb-4 pt-4 transition-all duration-[600ms] cubic-bezier-[0.4,0,0.2,1] ${
          isUIHidden || !activeFilterSection
            ? "-translate-x-8 opacity-0 pointer-events-none"
            : "translate-x-0 opacity-100"
        }`}
      >
        <div className="flex h-full flex-col rounded-[28px] border border-white/60 bg-white/72 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          {lastActiveSection === "fauna" ? (
            <Fauna
              onGroupSelected={setSelectedGroup}
              activeSources={activeSources}
              onSourceToggle={handleSourceToggle}
            />
          ) : (
            <Flora
              onGroupSelected={setSelectedGroup}
              activeSources={activeSources}
              onSourceToggle={handleSourceToggle}
            />
          )}
        </div>
      </div>

      {/* Topbar - sliding up */}
      <div
        className={`absolute top-0 left-[95px] right-0 z-40 transition-transform duration-600 cubic-bezier-[0.4,0,0.2,1] will-change-transform ${
          isUIHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <Topbar isUIHidden={isUIHidden} />
      </div>

      {/* Floating UI Elements Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50">
        {/* Floating Search Bar (Visible only when UI is hidden) */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 transition-all duration-600 cubic-bezier-[0.4,0,0.2,1] ${
            isUIHidden
              ? "top-[11px] opacity-100 pointer-events-auto"
              : "top-[11px] opacity-0 pointer-events-none"
          }`}
        >
          <div className="rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <SearchBar className="bg-white/90! border-white/40" />
          </div>
        </div>

        {/* Floating UI Toggle Button (Centered vertically on the left edge) */}
        <button
          onClick={() => setIsUIHidden(!isUIHidden)}
          className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 left-0 flex h-14 w-6 items-center justify-center rounded-r-xl bg-white/95 backdrop-blur-md shadow-[4px_0_12px_rgba(0,0,0,0.08)] border border-l-0 border-black/5 text-zinc-400 transition-all duration-600 cubic-bezier-[0.4,0,0.2,1] will-change-transform hover:bg-white hover:text-[#5FCE7D] hover:w-7 active:scale-90 group ${
            isUIHidden ? "translate-x-0" : "translate-x-[95px]"
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
  );
}

// format-sync