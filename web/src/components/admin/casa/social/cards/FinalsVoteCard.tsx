"use client";

import type { FinalsVotePayload, SocialAspect } from "@/lib/social/types";
import { SocialCardShell, SocialPlate } from "../SocialCardShell";

const ACCENTS = [
  "from-fuchsia-950/90 to-fuchsia-900/40 border-fuchsia-400/35",
  "from-rose-950/90 to-rose-900/40 border-rose-400/35",
  "from-pink-950/90 to-pink-900/40 border-pink-400/35",
];

export function FinalsVoteCard({
  payload,
  aspect,
}: {
  payload: FinalsVotePayload;
  aspect: SocialAspect;
}) {
  return (
    <SocialCardShell
      aspect={aspect}
      venueName={payload.venueName}
      kicker="Finale live"
    >
      <SocialPlate className="mb-10 text-center">
        <p className="text-[26px] font-bold uppercase tracking-[0.28em] text-pink-300">
          Prova
        </p>
        <p
          className="mt-3 font-display text-[52px] font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {payload.challengeLabel}
        </p>
      </SocialPlate>

      <ul className="flex flex-1 flex-col gap-5">
        {payload.couples.map((c, i) => (
          <li
            key={c.pairId}
            className={`relative grid flex-1 grid-rows-[auto_1fr_auto] overflow-hidden rounded-[1.5rem] border bg-gradient-to-b px-6 py-5 ${ACCENTS[i % ACCENTS.length]}`}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-black/55 backdrop-blur-sm"
              aria-hidden
            />
            <p className="relative z-10 text-center text-[22px] font-bold uppercase tracking-[0.24em] text-pink-300">
              Coppia {i + 1}
            </p>
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <p
                className="font-display text-[40px] font-bold leading-tight"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {c.maleNick}
              </p>
              <span className="font-display text-[28px] font-bold text-pink-400">
                &
              </span>
              <p
                className="font-display text-[40px] font-bold leading-tight"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {c.femaleNick}
              </p>
            </div>
            <div className="relative z-10">
              <div className="mb-2 flex justify-between text-[22px] font-semibold">
                <span>{c.votes} voti</span>
                <span>{c.barPct}%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full border border-white/12 bg-black/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E91E8C] via-pink-400 to-[#E91E8C]/80"
                  style={{ width: `${c.barPct}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SocialCardShell>
  );
}
