"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type Locale, localeConfig } from "@/i18n/config";

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale?: Locale;
  onLanguageChange?: (newLocale: Locale) => void;
  position?: { top: number; left: number } | null;
}

export function LanguageSelectorModal({
  isOpen,
  onClose,
  currentLocale = "es",
  onLanguageChange,
  position,
}: LanguageSelectorModalProps) {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("topbar"); // Usamos topbar porque tiene "seleccionar_idioma"

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleLanguageChange = (newLocale: Locale) => {
    if (onLanguageChange) {
      onLanguageChange(newLocale);
    }
    onClose();
  };

  if (!isOpen || !mounted) return null;

  // Estilos de posición responsivos y adaptativos
  const modalStyle: React.CSSProperties = position
    ? {
        top: `${Math.max(20, position.top)}px`,
        left: `${position.left}px`,
      }
    : {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return createPortal(
    <>
      {/* Backdrop sutil y elegante */}
      <div
        className="fixed inset-0 z-[9998] bg-slate-900/5 backdrop-blur-[2px] transition-all duration-500 ease-premium"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Glassmorphism */}
      <div
        className="fixed z-[9999] min-w-[280px] max-w-[300px] overflow-hidden rounded-[24px] border border-white/80 bg-white/95 font-sans shadow-premium-xl backdrop-blur-xl transition-all duration-500 ease-premium animate-in fade-in zoom-in-95"
        style={modalStyle}
        role="dialog"
        aria-labelledby="language-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100/80 px-5 pb-3.5 pt-5">
          <div className="flex flex-col">
            <p className="mb-0.5 text-[9.5px] font-bold uppercase tracking-premium text-emerald-500">
              {t("seleccionar_idioma")}
            </p>
            <h2
              id="language-modal-title"
              className="text-[17px] font-extrabold leading-tight tracking-tight text-slate-900"
            >
              Idioma / Language
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[14px] border border-slate-200/80 bg-white text-slate-400 shadow-[0_2px_4px_rgba(15,23,42,0.04)] transition-all duration-300 hover:scale-105 hover:border-transparent hover:bg-emerald-500 hover:text-white hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)] active:scale-95 active:bg-emerald-600"
            aria-label={t("cerrar")}
          >
            <X className="h-[16px] w-[16px]" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2.5 p-4">
          {(["es", "en"] as const).map((code: Locale) => {
            const config = localeConfig[code];
            if (!config) return null;
            const isSelected = currentLocale === code;

            return (
              <button
                type="button"
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`group relative flex w-full items-center gap-3.5 rounded-[16px] p-3.5 text-left transition-all duration-400 ease-premium ${
                  isSelected
                    ? "bg-emerald-50/50 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
                    : "bg-white ring-1 ring-slate-200/80 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-premium-sm hover:ring-slate-300"
                }`}
                aria-current={isSelected ? "true" : "false"}
              >
                {/* Badge de Idioma (Reemplaza los emojis de banderas problemáticos en Windows) */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[13px] font-black tracking-wide transition-all duration-400 ${
                    isSelected
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                  }`}
                >
                  {code.toUpperCase()}
                </div>

                {/* Textos */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={`text-[14.5px] font-bold leading-tight transition-colors duration-300 ${
                      isSelected ? "text-emerald-900" : "text-slate-700 group-hover:text-slate-900"
                    }`}
                  >
                    {config.native}
                  </span>
                  <span
                    className={`mt-[1px] text-[11.5px] font-medium transition-colors duration-300 ${
                      isSelected
                        ? "text-emerald-600/80"
                        : "text-slate-400 group-hover:text-slate-500"
                    }`}
                  >
                    {config.name}
                  </span>
                </div>

                {/* Indicador de check */}
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-400 ${
                    isSelected
                      ? "scale-100 bg-emerald-500 opacity-100 shadow-sm shadow-emerald-500/40"
                      : "scale-75 bg-slate-200 opacity-0 group-hover:scale-90 group-hover:opacity-100"
                  }`}
                >
                  <Check
                    className={`h-[11px] w-[11px] text-white transition-opacity duration-300 ${
                      isSelected ? "opacity-100" : "opacity-0"
                    }`}
                    strokeWidth={3.5}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
