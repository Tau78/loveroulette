"use client";

import type { SocialAspect, QuizShockPayload } from "@/lib/social/types";
import { SocialCardShell, SocialPlate } from "../SocialCardShell";

const LETTERS = ["A", "B", "C", "D"];

export function QuizShockCard({
  payload,
  aspect,
}: {
  payload: QuizShockPayload;
  aspect: SocialAspect;
}) {
  const sorted = [...payload.options].sort((a, b) => a.sortOrder - b.sortOrder);
  const maxPct = Math.max(1, ...sorted.map((o) => o.percent));

  return (
    <SocialCardShell
      aspect={aspect}
      venueName={payload.venueName}
      kicker="Quiz shock"
    >
      <SocialPlate>
        <p
          className="text-center text-[42px] font-bold uppercase leading-tight tracking-wide"
          style={{
            textShadow:
              "0 2px 0 rgba(0,0,0,0.95), 0 0 32px rgba(0,0,0,0.8)",
          }}
        >
          {payload.questionBody}
        </p>
      </SocialPlate>

      <ul className="mt-12 flex flex-col gap-5">
        {sorted.map((opt, i) => (
          <li
            key={opt.optionId}
            className="rounded-2xl border border-white/15 bg-black/55 px-6 py-5 backdrop-blur-md"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="min-w-0 flex-1 text-[30px] font-bold uppercase leading-snug">
                <span className="mr-3 text-pink-400">{LETTERS[i] ?? "·"}</span>
                {opt.label}
              </p>
              <span className="shrink-0 font-display text-[48px] font-bold text-pink-300">
                {opt.percent}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#E91E8C] via-pink-400 to-[#FF4757]"
                style={{ width: `${Math.round((opt.percent / maxPct) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-center text-[24px] text-white/55">
        {payload.totalAnswers} risposte in sala
      </p>
    </SocialCardShell>
  );
}
