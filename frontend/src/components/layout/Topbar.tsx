import { Moon, Sun, HelpCircle } from "lucide-react";
import { SearchBar } from "../ui/SearchBar";
import { useEffect, useState } from "react";

interface TopbarProps {
  isUIHidden?: boolean;
}

export function Topbar({ isUIHidden }: TopbarProps) {
  // Siempre arranca en false (igual que el servidor) para evitar hydration mismatch.
  // useEffect aplica el tema real del cliente después del montaje.
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header
      className={`relative z-30 flex h-[58px] w-full shrink-0 items-center justify-between bg-[#DFDFDF] px-5 shadow-sm transition-opacity duration-600 ${isUIHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Left Area: Title */}
      <div className="flex items-center pl-4">
        <div className="bg-white/40 px-4 py-1.5 rounded-2xl backdrop-blur-[2px]">
          <h1 className="text-[18px] font-bold tracking-tight font-sans whitespace-nowrap bg-linear-to-r from-[#428e93] via-[#002725] to-[#93bb2e] bg-clip-text text-transparent filter-[drop-shadow(0px_1px_2px_rgba(0,0,0,0.05))]">
            Visor de Biodiversidad
          </h1>
        </div>
      </div>

      {/* Absolute Centered Search: Centers relative to the Topbar's width */}
      <div className="absolute left-[50%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[580px] px-4">
        <SearchBar />
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-16 ml-auto pr-4">
        {/* Theme Toggle Switch - Elongated & Shifted Left */}
        <div
          className="relative flex h-8 w-18 items-center rounded-full bg-[#EDEDED] p-1 shadow-inner ring-1 ring-black/5 cursor-pointer overflow-hidden transition-all duration-300"
          onClick={toggleTheme}
          role="button"
          aria-label="Alternar modo oscuro"
        >
          {/* Animated Sliding Circle with Icon - Larger Track, Compact Icon */}
          <div
            className={`absolute h-6 w-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 ease-in-out ${
              isDarkMode ? "translate-x-8" : "translate-x-0"
            }`}
          >
            {isDarkMode ? (
              <Moon className="h-3.5 w-3.5 text-zinc-600 transition-all" strokeWidth={2.5} />
            ) : (
              <Sun className="h-3.5 w-3.5 text-zinc-500 transition-all" strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Help Action */}
        <button
          aria-label="Ayuda"
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition-all hover:bg-black/5 hover:text-zinc-900 active:scale-95"
        >
          <HelpCircle className="h-[28px] w-[28px]" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

// format-sync
