import { PawPrint, Leaf, CloudSun, LineChart, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Sidebar() {
  const navItems = [
    { name: "Fauna", icon: PawPrint, href: "#", active: true },
    { name: "Flora", icon: Leaf, href: "#", active: false },
    { name: "Tiempo", icon: CloudSun, href: "#", active: false },
    { name: "Estadísticas", icon: LineChart, href: "#", active: false },
  ];

  return (
    <aside className="relative z-50 flex h-full w-[95px] flex-col items-center bg-[#F8F9FA] shadow-[1px_0_24px_rgba(0,0,0,0.02)] border-r border-black/4 font-sans transition-colors duration-600">
      {/* Brand Logo - Aligned with Topbar height (58px) */}
      <div className="flex w-full flex-col items-center justify-center h-[58px] mt-2 mb-10">
        <div className="relative h-[78px] w-[78px] group transition-all duration-500 hover:-translate-y-1">
          <Image
            src="/soy_conservacion_logo.png"
            alt="Logo Soy Conservación"
            fill
            sizes="78px"
            className="object-contain transition-transform duration-700 group-hover:scale-110"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex w-full flex-1 flex-col items-center gap-2 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative group flex w-full flex-col items-center justify-center gap-2 rounded-xl py-4 transition-all duration-300"
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-[-12px] top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#5FCE7D] shadow-[0_0_8px_rgba(95,206,125,0.4)]" />
              )}

              {/* Background Highlight */}
              <div
                className={`absolute inset-0 rounded-[14px] transition-all duration-300 ${
                  isActive
                    ? "bg-[#5FCE7D]/10"
                    : "opacity-0 group-hover:opacity-100 group-hover:bg-black/3"
                }`}
              />

              <div className="relative flex items-center justify-center transition-transform duration-500 ease-out group-hover:-translate-y-0.5">
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-300 ${isActive ? "text-[#5FCE7D]" : "text-[#003B46]/50 group-hover:text-[#003B46]"}`}
                  strokeWidth={isActive ? 2 : 1.5}
                />
              </div>

              <span
                className={`relative text-[8.5px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                  isActive
                    ? "font-bold text-[#003B46]"
                    : "font-semibold text-[#003B46]/60 group-hover:text-[#003B46]"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center mt-auto pt-6 border-t border-black/4 w-full px-4 mb-6">
        <button
          className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/3 transition-all hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:scale-95"
          aria-label="Información"
        >
          <Info
            className="h-[22px] w-[22px] text-[#003B46]/70 transition-colors group-hover:text-[#5FCE7D]"
            strokeWidth={2}
          />
        </button>
      </div>
    </aside>
  );
}

// format-sync
