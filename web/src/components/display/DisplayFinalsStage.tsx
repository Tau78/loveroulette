"use client";

import { motion } from "framer-motion";
import { CHALLENGE_LABELS, type ChallengeId } from "@/lib/types";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { cn } from "@/lib/utils";

interface DisplayFinalsStageProps {
  session: VotingSessionState | null;
  runtimeState: "finals" | "winner";
}

function coupleLabel(finalist: VotingSessionState["finalists"][number]): string {
  return `${finalist.maleNick} & ${finalist.femaleNick}`;
}

export function DisplayFinalsStage({
  session,
  runtimeState,
}: DisplayFinalsStageProps) {
  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 md:pb-20">
        <DisplayPhaseHero
          kicker="Finali"
          headline="In attesa della prossima prova"
          subline="L'animatore avvierà la votazione"
        />
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 pb-20 md:pb-24 gap-8 md:gap-10">
      <DisplayPhaseHero
        kicker={runtimeState === "winner" ? "Vincitori" : "Votazione"}
        headline={challengeLabel}
        subline={
          session.status === "open"
            ? "Votate dal telefono!"
            : winner
              ? `${coupleLabel(winner)} in testa`
              : "Votazione chiusa"
        }
        pulse={session.status === "open"}
      />

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
