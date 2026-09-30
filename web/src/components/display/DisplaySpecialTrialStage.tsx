"use client";

import { useEffect, useState } from "react";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { specialTrialPresentation } from "@/lib/game/special-trial-challenges";
import {
  formatSpecialTrialClock,
  isSpecialTrialRunningExpired,
  specialTrialRemainingSeconds,
  specialTrialVoteRanking,
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
  const closing =
    trial.status === "closing" || isSpecialTrialRunningExpired(trial);
  const showingResults = trial.status === "results";
  const ranking = specialTrialVoteRanking(trial);
  const maxVotes = Math.max(1, ...ranking.map((r) => r.votes));
  const totalVotes = ranking.reduce((sum, r) => sum + r.votes, 0);

  if (showingResults) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-6">
        <DisplayPhaseHero
          kicker="Prova speciale"
          headline="RISULTATI"
          subline={
            totalVotes > 0
              ? `${totalVotes} vot${totalVotes === 1 ? "o" : "i"} dalla sala`
              : "Voti della sala"
          }
          uppercase
        />

        <div className="mt-10 grid w-full max-w-4xl gap-4">
          {ranking.map((row, index) => {
            const barPct = (row.votes / maxVotes) * 100;
            const isLeader = row.votes === maxVotes && row.votes > 0;
            return (
              <div
                key={row.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border px-6 py-4",
                  "bg-black/55 backdrop-blur-md",
                  isLeader
                    ? "border-primary/50 shadow-[0_0_32px_rgba(233,30,140,0.35)]"
                    : "border-white/15",
                )}
              >
                <div className="relative z-10 flex items-end justify-between gap-4">
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                      {index + 1}°
                    </p>
                    <p
                      className="mt-1 truncate font-display text-[clamp(1.4rem,min(3.5vw,4vh),2.75rem)] font-bold uppercase text-white"
                      style={{
                        textShadow:
                          "0 0 20px rgba(233,30,140,0.4), 0 2px 8px rgba(0,0,0,1)",
                      }}
                    >
                      {row.nickname}
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-[clamp(1.75rem,min(5vw,6vh),3.5rem)] font-bold tabular-nums text-white">
                    {row.votes}
                  </p>
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-primary/25"
                  style={{ width: `${barPct}%` }}
                  aria-hidden
                />
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/45">
          {eventSlug}
        </p>
      </div>
    );
  }

  if (closing) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-6">
        <DisplayPhaseHero
          kicker="Prova speciale"
          headline="FINE PROVA"
          subline={
            names.length > 0
              ? names.join(" · ")
              : presentation?.displayTitle ?? "Tempo scaduto"
          }
          challengeTitle
          uppercase
        />
        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.28em] text-white/60">
          AVANTI → risultati votazione
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/45">
          {eventSlug}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-6">
      <DisplayPhaseHero
        kicker="Prova speciale"
        headline={presentation?.displayTitle ?? "PROVA SPECIALE"}
        subline={
          trial.status === "setup" && presentation
            ? presentation.headline
            : trial.status === "setup"
              ? "In preparazione in plancia"
              : presentation?.headline ?? ""
        }
        challengeTitle
        uppercase
      />
      {trial.status === "setup" && presentation ? (
        <p
          className={cn(
            "relative mt-8 max-w-3xl rounded-2xl border border-white/15",
            "bg-black/55 px-8 py-5 text-center text-lg md:text-2xl",
            "font-semibold uppercase tracking-[0.08em] text-white/85 backdrop-blur-md",
          )}
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.95)" }}
        >
          Prova dichiarata — la plancia sceglie chi va in scena
        </p>
      ) : null}

      {names.length > 0 ? (
        <div
          className={cn(
            "relative mt-8 max-w-4xl rounded-2xl border border-white/15",
            "bg-black/55 px-8 py-5 text-center backdrop-blur-md",
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

      {trial.status === "running" ? (
        <div className="mt-10 flex flex-col items-center gap-4" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/55">
            Countdown · vota dal telefono
          </p>
          <div
            className="relative flex size-[min(42vh,22rem)] items-center justify-center rounded-full border-4 border-primary/50 bg-black/70 shadow-[0_0_48px_rgba(233,30,140,0.35)]"
            style={{
              backgroundImage: `conic-gradient(#e91e8c ${(remaining / Math.max(1, trial.durationSec)) * 360}deg, rgba(255,255,255,0.12) 0)`,
            }}
          >
            <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-black/90">
              <p
                className="font-display text-[clamp(3rem,min(12vw,18vh),8rem)] font-bold tabular-nums text-white"
                style={{
                  textShadow:
                    "0 0 32px rgba(233,30,140,0.55), 0 4px 16px rgba(0,0,0,1)",
                }}
              >
                {formatSpecialTrialClock(remaining)}
              </p>
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
            Totale {formatSpecialTrialClock(trial.durationSec)}
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/45">
        {eventSlug}
      </p>
    </div>
  );
}
