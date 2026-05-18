"use client";

import { Award, Crown, Download, Medal, Trophy, X } from "lucide-react";
import { useEffect } from "react";

export type UserRankingItem = {
  position: number;
  name: string;
  role: string;
  value: number;
  accent: string;
};

type UserRankingModalProps = {
  open: boolean;
  onClose: () => void;
  items?: UserRankingItem[];
  totalUsers?: number;
  averageRecords?: number;
  leaderName?: string;
  leaderRecords?: number;
};

export function UserRankingModal({
  open,
  onClose,
  items,
  totalUsers,
  averageRecords,
  leaderName,
  leaderRecords,
}: UserRankingModalProps) {
  const getRankIcon = (position: number) => {
    if (position === 1) return Crown;
    if (position === 2) return Trophy;
    if (position === 3) return Award;
    return Medal;
  };
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const data = items ?? [];

  const totalUsersValue = totalUsers ?? data.length;
  const totalRecords = data.reduce((acc, item) => acc + item.value, 0);
  const averageRecordsValue =
    averageRecords ?? (data.length > 0 ? Math.round(totalRecords / data.length) : 0);
  const leaderNameValue = leaderName ?? data[0]?.name ?? "Sin datos";
  const leaderRecordsValue = leaderRecords ?? data[0]?.value ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-[6px]"
        onClick={onClose}
      />

      <section className="relative flex h-[min(90vh,920px)] w-[min(94vw,1120px)] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.26)] ring-1 ring-black/5">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0f766e]">
              Ranking extendido
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Usuarios con mayor registros
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label="Cerrar ranking"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-3">
              {data.map((entry) => {
                const Icon = getRankIcon(entry.position);

                return (
                  <div
                    key={entry.position}
                    className="flex items-center gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/60 px-4 py-4"
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                        entry.position <= 3 ? "ring-2 ring-white/35" : ""
                      }`}
                      style={{ backgroundColor: entry.accent }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          #{entry.position}
                        </span>
                        <h3 className="truncate text-[0.95rem] font-semibold text-slate-900 sm:text-base">
                          {entry.name}
                        </h3>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{entry.role}</p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-base font-black text-slate-900 sm:text-lg">
                        {entry.value.toLocaleString("es-CO")}
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Registros
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="border-t border-slate-200/80 bg-[#f8faf9] px-5 py-5 lg:border-l lg:border-t-0 sm:px-6">
            <div className="rounded-[28px] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                Resumen
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-sm text-slate-500">Total de usuarios</div>
                  <div className="mt-1 text-3xl font-black text-slate-900">
                    {totalUsersValue.toLocaleString("es-CO")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Promedio de registros</div>
                  <div className="mt-1 text-3xl font-black text-[#0f766e]">
                    {averageRecordsValue.toLocaleString("es-CO")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Usuario líder</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{leaderNameValue}</div>
                  <div className="text-sm text-slate-500">
                    {leaderRecordsValue.toLocaleString("es-CO")} registros
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
