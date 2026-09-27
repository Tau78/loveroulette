"use client";

import { useEffect, useState } from "react";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { specialTrialPresentation } from "@/lib/game/special-trial-challenges";
import {
  isSpecialTrialRunningExpired,
  specialTrialRemainingSeconds,
  type SpecialTrialState,
} from "@/lib/musicpro/special-trial";
import { cn } from "@/lib/utils";

interface DisplaySpecialTrialStageProps {
  trial: SpecialTrialState;
  eventSlug: string;
  onTick?: () => void;
}

export function DisplaySpecialTrialStage({
  trial,
  eventSlug,
  onTick,
}: DisplaySpecialTrialStageProps) {
  const [remaining, setRemaining] = useState(() =>
    specialTrialRemainingSeconds(trial),
  );

  useEffect(() => {
    setRemaining(specialTrialRemainingSeconds(trial));
  }, [trial.updatedAt, trial.status, trial.phaseStartedAt, trial.durationSec]);

  useEffect(() => {
    if (trial.status !== "running") return;
    const id = window.setInterval(() => {
      const next = specialTrialRemainingSeconds(trial);
      setRemaining(next);
      if (next <= 0 && onTick) {
        void onTick();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [trial, onTick]);

  const presentation =
    trial.challengeId != null
      ? specialTrialPresentation(trial.challengeId)
      : null;

  const names = trial.participants.map((p) => p.nickname.toUpperCase());
  const closing = trial.status === "closing" || isSpecialTrialRunningExpired(trial);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-6">
      <DisplayPhaseHero
        kicker="Prova speciale"
        headline={presentation?.displayTitle ?? "PROVA SPECIALE"}
        subline={
          closing
            ? "Tempo scaduto — in chiusura"
            : trial.status === "setup"
              ? "In preparazione in plancia"
              : presentation?.headline ?? ""
        }
        challengeTitle
        uppercase
      />

      {names.length > 0 ? (
        <div
          className={cn(
            "relative mt-10 max-w-4xl rounded-2xl border border-white/15",
            "bg-black/55 px-8 py-6 text-center backdrop-blur-md",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/90">
            In scena
          </p>
          <p
            className="mt-3 font-display text-[clamp(1.5rem,min(4vw,5vh),3.5rem)] font-bold uppercase leading-tight text-white"
            style={{
              textShadow:
                "0 0 24px rgba(233,30,140,0.45), 0 2px 8px rgba(0,0,0,1)",
            }}
          >
            {names.join(" · ")}
          </p>
        </div>
      ) : null}

      {trial.status === "running" || closing ? (
        <p
          className="mt-12 font-display text-[clamp(3rem,min(12vw,18vh),9rem)] font-bold tabular-nums text-white"
          aria-live="polite"
          style={{
            textShadow:
              "0 0 32px rgba(233,30,140,0.55), 0 4px 16px rgba(0,0,0,1)",
          }}
        >
          {closing ? "0" : remaining}
        </p>
      ) : null}

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/45">
        {eventSlug}
      </p>
    </div>
  );
}
