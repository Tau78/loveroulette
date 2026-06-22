"use client";

import { motion } from "framer-motion";
import { CHALLENGE_LABELS, type ChallengeId } from "@/lib/types";
import type { FinalistCouple } from "@/lib/musicpro/elimination";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { cn } from "@/lib/utils";

interface DisplayFinalsStageProps {
  session: VotingSessionState | null;
  runtimeState: "finals" | "winner";
  finalists?: FinalistCouple[];
}

function coupleLabel(finalist: VotingSessionState["finalists"][number]): string {
  return `${finalist.maleNick} & ${finalist.femaleNick}`;
}

export function DisplayFinalsStage({
  session,
  runtimeState,
  finalists = [],
}: DisplayFinalsStageProps) {
  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 md:pb-20 gap-8">
        <DisplayPhaseHero
          kicker={FINALS_COPY.displayKicker}
          headline={FINALS_COPY.displayHeadline}
          subline={FINALS_COPY.displayWaitingSubline}
          uppercase
        />
        {finalists.length > 0 ? (
          <div className="w-full max-w-2xl space-y-3">
            {finalists.map((finalist, index) => (
              <div
                key={finalist.pairId}
                className="rounded-xl border border-white/15 bg-black/35 px-5 py-4 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
                  Finalista {index + 1}
                </p>
                <p className="mt-1 text-xl font-display font-semibold text-white">
                  {finalist.maleNick} & {finalist.femaleNick}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const challengeLabel = CHALLENGE_LABELS[session.challengeId as ChallengeId];
  const maxCount = Math.max(
    1,
    ...session.finalists.map((f) => session.counts[f.pairId] ?? 0),
  );
  const winner =
    session.status === "closed" && session.winnerPairId
      ? session.finalists.find((f) => f.pairId === session.winnerPairId)
      : null;

  const heroSubline =
    runtimeState === "winner" && winner
      ? coupleLabel(winner)
      : session.status === "open"
        ? FINALS_COPY.displayVoteSubline
        : winner
          ? coupleLabel(winner)
          : FINALS_COPY.displayVoteClosed;

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-20 md:pb-24 gap-8 md:gap-10">
      <DisplayPhaseHero
        kicker={
          runtimeState === "winner"
            ? FINALS_COPY.displayWinnerKicker
            : FINALS_COPY.displayKicker
        }
        headline={
          runtimeState === "winner"
            ? FINALS_COPY.displayWinnerHeadline
            : FINALS_COPY.displayHeadline
        }
        subline={heroSubline}
        pulse={session.status === "open"}
        uppercase
      />

      {runtimeState !== "winner" && challengeLabel ? (
        <p className="-mt-4 text-center text-sm font-semibold uppercase tracking-[0.22em] text-primary/90">
          {FINALS_COPY.displayChallengePrefix}: {challengeLabel}
        </p>
      ) : null}

      <div className="w-full space-y-4 md:space-y-5">
        {session.finalists.map((finalist, index) => {
          const count = session.counts[finalist.pairId] ?? 0;
          const widthPct = (count / maxCount) * 100;
          const isWinner =
            session.status === "closed" &&
            session.winnerPairId === finalist.pairId;

          return (
            <div key={finalist.pairId} className="space-y-2">
              <div className="flex items-end justify-between gap-3 text-sm md:text-base">
                <span
                  className={cn(
                    "font-semibold truncate",
                    isWinner ? "text-primary" : "text-white/90",
                  )}
                >
                  {index + 1}. {coupleLabel(finalist)}
                </span>
                <motion.span
                  key={count}
                  initial={{ scale: 1.2, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="tabular-nums font-display text-xl md:text-2xl text-white"
                >
                  {count}
                </motion.span>
              </div>
              <div className="h-3 md:h-4 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isWinner
                      ? "bg-gradient-to-r from-primary to-pink-400"
                      : "bg-gradient-to-r from-white/50 to-white/30",
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
