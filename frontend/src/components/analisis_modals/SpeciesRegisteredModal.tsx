"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type SpeciesItem = {
  name: string;
  value: string;
  progress: number;
};

type SpeciesRegisteredModalProps = {
  open: boolean;
  onClose: () => void;
};

const defaultItems: SpeciesItem[] = [
  { name: "Mamíferos", value: "742 Registros", progress: 66 },
  { name: "Aves", value: "1,120 Registros", progress: 86 },
  { name: "Reptiles", value: "456 Registros", progress: 52 },
  { name: "Anfibios", value: "356 Registros", progress: 44 },
  { name: "Otra especie", value: "356 Registros", progress: 44 },
];

export function SpeciesRegisteredModal({ open, onClose }: SpeciesRegisteredModalProps) {
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-[6px]"
        onClick={onClose}
      />

      <section className="relative flex h-[min(80vh,720px)] w-[min(92vw,820px)] flex-col overflow-hidden rounded-[20px] bg-white p-5 shadow-[0_28px_60px_rgba(2,6,23,0.16)]">
        <header className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
              >
                Exportar Reporte
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900">Especies registradas</h3>
            <p className="mt-1 text-sm text-slate-500">Distribución por grupo taxonómico</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="Cerrar especies"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pt-1">
          {defaultItems.map((it) => (
            <div key={it.name} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{it.name}</span>
                  <span className="font-semibold text-slate-800">{it.value}</span>
                </div>

                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-[#083b3a]"
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SpeciesRegisteredModal;
