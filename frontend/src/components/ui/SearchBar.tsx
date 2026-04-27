import { Search } from "lucide-react";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = "" }: SearchBarProps) {
  return (
    <div
      className={`group relative flex h-[36px] w-full items-center rounded-full bg-white px-3.5 border border-black/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] focus-within:border-transparent focus-within:shadow-[0_8px_20px_rgba(0,0,0,0.1)] focus-within:ring-[4px] focus-within:ring-white/60 ${className}`}
    >
      <Search
        className="mr-1.5 h-[16px] w-[16px] shrink-0 text-zinc-400 transition-colors group-focus-within:text-zinc-600"
        strokeWidth={2.5}
      />
      <div className="relative flex-1 flex items-center overflow-hidden">
        <input
          type="text"
          placeholder=" "
          className="peer w-full bg-transparent text-[13px] font-medium text-zinc-800 outline-none transition-all duration-300 text-left"
        />
        {/* Smooth left-aligned placeholder with a small gap */}
        <div
          className="absolute left-[6px] translate-x-0 pointer-events-none text-zinc-400/80 text-[13px] font-medium transition-all duration-500 whitespace-nowrap
          peer-focus:opacity-0 peer-focus:translate-x-[-15px] 
          peer-[:not(:placeholder-shown)]:opacity-0"
        >
          Buscar especies, ubicaciones o coordenadas...
        </div>
      </div>
    </div>
  );
}
