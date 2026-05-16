"use client";

import { Eye, Home, Medal, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpeciesRegisteredModal } from "../../components/analisis_modals/SpeciesRegisteredModal";
import { UserRankingModal } from "../../components/analisis_modals/UserRankingModal";
import { HydrationFix } from "../../components/layout/HydrationFix";

type RankingItem = {
  name: string;
  role: string;
  value: string;
  accent: string;
};

type SpeciesItem = {
  name: string;
  value: string;
  progress: number;
};

const rankingItems: RankingItem[] = [
  {
    name: "Elena Salazar",
    role: "Bióloga marina",
    value: "1,284",
    accent: "#D9A520",
  },
  { name: "Carlos Mendoza", role: "Profesor", value: "956", accent: "#B8B8B8" },
  {
    name: "Sofía Villalobos",
    role: "Investigadora",
    value: "842",
    accent: "#D97A22",
  },
];

const speciesItems: SpeciesItem[] = [
  { name: "Mamíferos", value: "742 Registros", progress: 66 },
  { name: "Aves", value: "1,120 Registros", progress: 86 },
  { name: "Reptiles", value: "456 Registros", progress: 52 },
];

const topSpecies = [
  { name: "Panthera onca", value: "4.2k" },
  { name: "Morpho menelaus", value: "3.8k" },
  { name: "Ara Macao", value: "3.5k" },
];

export default function AnalisisPage() {
  const router = useRouter();
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);

  return (
    <HydrationFix>
      <div className="min-h-screen w-screen overflow-hidden bg-[#f3f4f3] text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%)]" />

        <main className="relative z-10 flex min-h-screen flex-col px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          <header className="mb-4 flex flex-col gap-4 rounded-[28px] bg-white/80 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <a
                href="https://www.soyconservacion.org"
                target="_blank"
                rel="noreferrer"
                className="relative flex h-18 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_14px_28px_rgba(15,118,110,0.14)] transition-transform hover:scale-[1.02]"
                aria-label="Ir a Soy Conservación"
                title="Ir a Soy Conservación"
              >
                <Image
                  src="/soy_conservacion_logo.png"
                  alt="Soy Conservación"
                  fill
                  sizes="96px"
                  className="object-contain p-1"
                  priority
                />
              </a>

              <div>
                <h1 className="text-[1.7rem] font-black tracking-tight sm:text-[2rem]">
                  Estadísticas
                </h1>
                <p className="text-[0.95rem] font-medium text-slate-600 sm:text-base">
                  Impacto colectivo en la biodiversidad
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4.5 py-3.5 text-[0.95rem] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-zinc-200"
              >
                <Sparkles className="h-4.5 w-4.5" />
                Restablecer filtros
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4.5 py-3.5 text-[0.95rem] font-semibold text-slate-800 shadow-sm transition-colors hover:bg-zinc-200"
              >
                <Home className="h-4.5 w-4.5" />
                Inicio
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 gap-3 md:gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start xl:gap-5">
            <div className="grid h-fit min-h-0 content-start gap-3 md:gap-4">
              <section className="h-fit rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.05rem] font-semibold text-slate-800">
                    Usuarios con mayor registros
                  </h2>
                </div>

                <div className="space-y-3">
                  {rankingItems.slice(0, 3).map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: item.accent }}
                      >
                        <Medal className="h-4.5 w-4.5" strokeWidth={2.2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.9rem] font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="truncate text-[0.78rem] text-slate-500">{item.role}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[0.92rem] font-bold text-slate-800">{item.value}</div>
                        <div className="text-[0.7rem] uppercase tracking-[0.16em] text-slate-400">
                          Registros
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsRankingModalOpen(true)}
                  className="mt-4 w-full rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:bg-slate-100"
                >
                  Ver ranking completo
                </button>
              </section>

              <section className="h-fit rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.05rem] font-semibold text-slate-800">
                    Especies con mayor visualización
                  </h2>
                </div>

                <div className="space-y-3">
                  {topSpecies.slice(0, 3).map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.9rem] font-semibold text-slate-900">
                          {item.name}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-[#c8d7ff] px-3 py-1.5 text-[0.8rem] font-semibold text-slate-700 shadow-sm">
                        <Eye className="mr-1 inline-block h-3.5 w-3.5" />
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:bg-slate-100"
                >
                  Ver ranking completo
                </button>
              </section>
            </div>

            <div className="grid min-h-0 gap-3 md:gap-4">
              <section className="min-h-[200px] rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:min-h-[220px] md:p-5">
                <h2 className="mb-4 text-[1.05rem] font-semibold text-slate-800 md:mb-5 md:text-lg">
                  Especies por registro de fecha
                </h2>
                <div className="flex min-h-[140px] items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 text-center text-[0.8rem] font-semibold text-slate-500 md:min-h-[160px] md:text-sm">
                  Falta ver como se va a manejar por fecha
                </div>
              </section>

              <section className="rounded-[26px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] md:p-5">
                <h2 className="mb-4 text-[1.05rem] font-semibold text-slate-800 md:mb-5 md:text-lg">
                  Especies registradas
                </h2>
                <div className="space-y-4 md:space-y-5">
                  {speciesItems.slice(0, 3).map((item) => (
                    <div key={item.name}>
                      <div className="mb-1.5 flex items-center justify-between text-[0.85rem] md:text-sm">
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="font-semibold text-slate-800">{item.value}</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-200 md:h-4">
                        <div
                          className="h-3 rounded-full bg-[#083b3a] md:h-4"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSpeciesModalOpen(true)}
                  className="mt-4 w-full rounded-lg bg-slate-50 px-3.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.16em] text-[#0f766e] transition-colors hover:bg-slate-100 md:mt-5"
                >
                  Ver ranking completo
                </button>
              </section>
            </div>
          </div>

          <UserRankingModal
            open={isRankingModalOpen}
            onClose={() => setIsRankingModalOpen(false)}
          />
          <SpeciesRegisteredModal
            open={isSpeciesModalOpen}
            onClose={() => setIsSpeciesModalOpen(false)}
          />
        </main>
      </div>
    </HydrationFix>
  );
}
