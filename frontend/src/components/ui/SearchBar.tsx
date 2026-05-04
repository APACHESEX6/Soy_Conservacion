import { Search } from "lucide-react";
import { memo } from "react";

interface SearchBarProps {
  className?: string;
  disabled?: boolean;
}

export const SearchBar = memo(function SearchBar({
  className = "",
  disabled = false,
}: SearchBarProps) {
  return (
    <div
      className={`group relative flex h-9 w-full items-center rounded-full bg-white px-3.5 border border-black/10 shadow-sm transition-all duration-300 hover:shadow-premium-sm focus-within:border-transparent focus-within:shadow-premium-md focus-within:ring-4 focus-within:ring-white/60 ${className}`}
    >
      <label htmlFor="species-search" className="sr-only">
        Buscar especies, ubicaciones o coordenadas
      </label>
      <Search
        className="mr-1.5 h-4 w-4 shrink-0 text-zinc-400 transition-colors group-focus-within:text-zinc-600"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <div className="relative flex-1 flex items-center overflow-hidden">
        <input
          id="species-search"
          type="text"
          placeholder=" "
          disabled={disabled}
          className="peer w-full bg-transparent text-xs-plus font-medium text-zinc-800 outline-none transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Buscar especies, ubicaciones o coordenadas"
        />
        {/* Smooth left-aligned placeholder with a small gap */}
        <div
          className="absolute left-1.5 translate-x-0 pointer-events-none text-zinc-400/80 text-xs-plus font-medium transition-all duration-500 whitespace-nowrap
          peer-focus:opacity-0 peer-focus:-translate-x-3.75
          peer-[:not(:placeholder-shown)]:opacity-0"
          aria-hidden="true"
        >
          Buscar especies, ubicaciones o coordenadas...
        </div>
      </div>
    </div>
  );
});

// format-sync
