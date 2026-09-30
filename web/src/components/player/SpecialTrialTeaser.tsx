"use client";

import type { SpecialTrialState } from "@/lib/musicpro/special-trial";

export function SpecialTrialTeaser({
  trial,
}: {
  trial: SpecialTrialState;
}) {
  if (trial.status === "booked") {
    return (
      <div
        className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-center backdrop-blur-sm"
        role="status"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Prova speciale in arrivo…
        </p>
      </div>
    );
  }

  if (trial.status === "results") {
    return (
      <div
        className="mb-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-center backdrop-blur-sm"
        role="status"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Guarda i risultati sul maxischermo
        </p>
      </div>
    );
  }

  if (trial.status === "setup") {
    return (
      <div
        className="mb-3 rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-center backdrop-blur-sm"
        role="status"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
          Prova speciale — preparativi
        </p>
      </div>
    );
  }

  return null;
}
