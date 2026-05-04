"use client";

import { HelpCircle, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { SearchBar } from "../ui/SearchBar";

interface TopbarProps {
  isUIHidden?: boolean;
  isSearchDisabled?: boolean;
}

function getThemeSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("theme");
  return (
    saved === "dark" ||
    (saved !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

export function Topbar({ isUIHidden, isSearchDisabled = false }: TopbarProps) {
  const isDarkMode = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => false, // Server snapshot
  );

  const mounted = useSyncExternalStore(
    () => () => {
      // No external subscription needed - returns cleanup function
    },
    () => true,
    () => false,
  );

  useEffect(() => {
    // Aplicar el tema inicial al documento de forma imperativa al montar
    if (getThemeSnapshot()) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    // Notificar a useSyncExternalStore en la misma ventana
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <header
      data-topbar
      className={`relative z-30 flex h-topbar-height w-full shrink-0 items-center justify-between bg-zinc-light px-5 shadow-sm transition-opacity duration-600 ${isUIHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Left Area: Title */}
      <div className="flex items-center pl-4">
        <div className="bg-white/40 px-4 py-1.5 rounded-2xl backdrop-blur-xs">
          <h1 className="text-lg font-bold tracking-tight font-sans whitespace-nowrap bg-linear-to-r from-[#428e93] via-[#002725] to-[#93bb2e] bg-clip-text text-transparent filter-premium-shadow">
            Visor de Biodiversidad
          </h1>
        </div>
      </div>

      {/* Absolute Centered Search */}
      <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-145 px-4">
        <SearchBar disabled={isSearchDisabled} />
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-16 ml-auto pr-4">
        {/* Theme Toggle */}
        <button
          type="button"
          className="relative flex h-8 w-18 items-center rounded-full bg-zinc-extra-light p-1 shadow-inner ring-1 ring-black/5 cursor-pointer overflow-hidden transition-all duration-300"
          onClick={toggleTheme}
          aria-label="Alternar modo oscuro"
        >
          <div
            className={`absolute h-6 w-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 ease-in-out ${
              mounted && isDarkMode ? "translate-x-8" : "translate-x-0"
            }`}
          >
            {mounted &&
              (isDarkMode ? (
                <Moon className="h-3.5 w-3.5 text-zinc-600 transition-all" strokeWidth={2.5} />
              ) : (
                <Sun className="h-3.5 w-3.5 text-zinc-500 transition-all" strokeWidth={2.5} />
              ))}
          </div>
        </button>

        {/* Help Action */}
        <button
          type="button"
          aria-label="Ayuda"
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-all hover:bg-black/5 hover:text-zinc-900 active:scale-95"
        >
          <HelpCircle className="h-7 w-7" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

// format-sync
