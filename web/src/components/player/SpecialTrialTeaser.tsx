"use client";

import type { SpecialTrialState } from "@/lib/musicpro/special-trial";

export function SpecialTrialTeaser({
  trial,
}: {
  trial: SpecialTrialState;
}) {
  if (trial.status !== "booked") return null;

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
