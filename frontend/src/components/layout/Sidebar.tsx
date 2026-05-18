"use client";

import { Calendar, Languages, Leaf, LineChart, PawPrint } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useLocaleContext } from "@/contexts/LocaleContext";
import type { Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/routing";
import type { FilterSection } from "../../types/navigation.types";
import { LanguageSelectorModal } from "../ui/LanguageSelectorModal";
import { Mascot } from "../ui/Mascot";

interface SidebarProps {
  activeSection: FilterSection;
  onSectionChange: (section: FilterSection) => void;
  showNavigation?: boolean;
  currentLocale?: Locale;
  onLanguageChange?: (newLocale: Locale) => void;
}

export function Sidebar({
  activeSection,
  onSectionChange,
  showNavigation = true,
  currentLocale: propsLocale,
  onLanguageChange: propsOnLanguageChange,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const contextLocale = useLocaleContext();
  const currentLocale = propsLocale || contextLocale || "es";
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [languageModalPosition, setLanguageModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const t = useTranslations("navigation");

  const navItems = [
    { name: t("fauna"), icon: PawPrint, section: "fauna" as const },
    { name: t("flora"), icon: Leaf, section: "flora" as const },
    { name: t("fecha"), icon: Calendar, section: "fecha" as const },
    { name: t("analisis"), icon: LineChart, section: "analisis" as const },
    { name: t("idioma"), icon: Languages },
  ];

  const handleLanguageChange = (newLocale: Locale) => {
    if (propsOnLanguageChange) {
      propsOnLanguageChange(newLocale);
    } else {
      router.replace(pathname, { locale: newLocale });
    }
  };

  return (
    <aside
      data-sidebar
      className="relative z-50 flex h-full w-sidebar-offset flex-col items-center bg-zinc-bg shadow-sidebar-inner border-r border-black/5 font-sans transition-colors duration-600"
    >
      {/* Brand Logo - Aligned with Topbar height (58px) */}
      <div className="flex w-full flex-col items-center justify-center h-14.5 mt-2 mb-6">
        <motion.div
          className="relative h-logo-box w-logo-box cursor-pointer"
          initial={{ scale: 1, y: 0 }}
          whileHover={{
            scale: 1.03,
            y: -1,
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.open("https://www.soyconservacion.org/", "_blank")}
        >
          <Image
            src="/soy_conservacion_logo.png"
            alt="Logo Soy Conservación"
            fill
            sizes="78px"
            className="object-contain"
            priority
          />
        </motion.div>
      </div>

      {/* Navigation */}
      {showNavigation ? (
        <nav className="flex w-full flex-1 flex-col items-center gap-2 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.section ? activeSection === item.section : false;
            const isSelectable = Boolean(item.section);

            return (
              <button
                type="button"
                key={item.name}
                onClick={(e) => {
                  if (item.section) {
                    if (item.section === "analisis") {
                      router.push("/analisis");
                      return;
                    }
                    onSectionChange(item.section);
                  } else if (item.icon === Languages) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    // Alineamos el centro del modal con el centro del botón
                    // pero ajustaremos el modal hacia arriba la mitad de su alto en el modal usando translate o aquí mismo calculando aprox
                    // Por simplicidad calculamos el centro del botón y en el modal le podemos restar aprox 100px para centrarlo (asumiendo ~200px de alto)
                    // o usar translateY(-50%) en css
                    setLanguageModalPosition({
                      top: rect.top + rect.height / 2 - 120, // Centrado aprox verticalmente (120px es mitad del alto del modal aprox)
                      left: rect.right + 16,
                    });
                    setIsLanguageModalOpen(true);
                  }
                }}
                className={`relative group flex w-full flex-col items-center justify-center gap-2 rounded-xl py-4 transition-all duration-300 ${
                  isSelectable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-primary-glow" />
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
                    className={`h-icon-lg w-icon-lg transition-colors duration-300 ${isActive ? "text-primary" : "text-secondary/50 group-hover:text-secondary"}`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                </div>

                <span
                  className={`relative text-[11px] tracking-wide transition-colors duration-300 ${
                    isActive
                      ? "font-semibold text-[#003B46]"
                      : "font-medium text-[#003B46]/60 group-hover:text-[#003B46]"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      ) : (
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="rounded-3xl border border-black/5 bg-white/70 px-4 py-3 text-[12px] font-medium text-[#003B46]/70 shadow-sm">
            Vista de análisis independiente
          </div>
        </div>
      )}

      {/* Bottom Actions - Mascot Animation */}
      <div className="flex flex-col items-center mt-auto pb-8 w-full px-4">
        <Mascot />
      </div>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLocale={currentLocale}
        onLanguageChange={handleLanguageChange}
        position={languageModalPosition}
      />
    </aside>
  );
}
