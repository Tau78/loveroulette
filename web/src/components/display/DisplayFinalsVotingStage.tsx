"use client";

import { useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { useSimulatedVoteCounts } from "@/hooks/useSimulatedVoteCounts";
import {
  DisplayFinalsCoupleCard,
  FINALS_CARD_ACCENTS,
} from "@/components/display/DisplayFinalsCoupleCard";
import { DisplayFinalsZoneLayout } from "@/components/display/DisplayFinalsZoneLayout";

interface DisplayFinalsVotingStageProps {
  session: VotingSessionState;
  remaining: number;
  challengeLabel?: string;
}

function DisplayFinalsVotingHeader({
  remaining,
  challengeLabel,
}: {
  remaining: number;
  challengeLabel?: string;
}) {
  const locked = remaining <= 0;

  return (
    <div className="finals-header-band grid h-full min-h-0 w-full max-w-6xl mx-auto grid-rows-[minmax(0,1fr)_auto] gap-2 overflow-hidden">
      <div className="finals-header-band flex min-h-0 flex-col items-center justify-center rounded-2xl border border-white/12 bg-black/82 text-center overflow-hidden">
        <p
          className="finals-header-kicker shrink-0 font-semibold uppercase tracking-[0.32em] text-white/85"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}
        >
          {FINALS_COPY.displayKicker}
        </p>
        <p
          className="finals-header-title font-display mt-0.5 font-bold uppercase text-white line-clamp-2"
          style={{
            fontFamily: "var(--font-display), serif",
            textShadow: "0 2px 12px rgba(0,0,0,1), 0 0 28px rgba(233,30,140,0.45)",
          }}
        >
          {FINALS_COPY.displayVoteSubline}
        </p>
        {challengeLabel ? (
          <p className="finals-header-sub mt-0.5 shrink-0 uppercase tracking-[0.12em] text-primary/90 line-clamp-1">
            {challengeLabel}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-5 md:gap-8">
        <div
          className="finals-vote-countdown font-display font-bold tabular-nums text-primary"
          style={{
            fontFamily: "var(--font-display), serif",
            textShadow:
              "0 4px 0 rgba(0,0,0,1), 0 0 48px rgba(233,30,140,0.85)",
          }}
          aria-live="polite"
          aria-label={`${remaining} secondi`}
        >
          {Math.max(0, remaining)}
          <span className="ml-1 align-top text-[0.35em] text-primary/80">s</span>
        </div>
        <p
          className="finals-vote-cta font-semibold uppercase tracking-[0.14em] text-white/90"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}
        >
          {locked ? "Votazione chiusa" : "Vota dal telefono!"}
        </p>
      </div>
    </div>
  );
}

export function DisplayFinalsVotingStage({
  session,
  remaining,
  challengeLabel,
}: DisplayFinalsVotingStageProps) {
  const reduceMotion = useReducedMotion();
  const locked = remaining <= 0;
  const displayCounts = useSimulatedVoteCounts(
    session.finalists,
    remaining,
    session.counts,
    session.status === "open",
  );

  const maxDisplay = useMemo(
    () =>
      Math.max(
        1,
        ...session.finalists.map((f) => displayCounts[f.pairId] ?? 0),
      ),
    [displayCounts, session.finalists],
  );

  return (
    <DisplayFinalsZoneLayout
      headerHeightPx={268}
      header={
        <DisplayFinalsVotingHeader
          remaining={remaining}
          challengeLabel={challengeLabel}
        />
      }
    >
      <div className="grid h-full min-h-0 w-full max-w-[1680px] mx-auto grid-cols-3 gap-5 md:gap-6">
        {session.finalists.slice(0, 3).map((finalist, index) => {
          const votes = displayCounts[finalist.pairId] ?? 0;
          const barPct = (votes / maxDisplay) * 100;

          return (
            <DisplayFinalsCoupleCard
              key={finalist.pairId}
              index={index}
              maleNick={finalist.maleNick}
              femaleNick={finalist.femaleNick}
              votes={votes}
              votesLabel={locked ? "voti" : "voti · live"}
              barPct={barPct}
              accentClass={FINALS_CARD_ACCENTS[index % FINALS_CARD_ACCENTS.length]}
              pulse={!locked && !reduceMotion}
            />
          );
        })}
      </div>
    </DisplayFinalsZoneLayout>
  );
}
