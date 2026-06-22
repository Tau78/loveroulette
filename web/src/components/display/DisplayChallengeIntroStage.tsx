"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChallengePresentation } from "@/lib/game/finals-challenges";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { DisplayFinalsSafeStage } from "@/components/display/DisplayFinalsSafeStage";
import { DISPLAY_CHALLENGE_TITLE_CLASS } from "@/components/display/DisplayShowText";
import { cn } from "@/lib/utils";

interface DisplayChallengeIntroStageProps {
  presentation: ChallengePresentation;
}

/** Intro prova — nome prova enorme al centro (testo bianco pieno, no gradient clip). */
export function DisplayChallengeIntroStage({
  presentation,
}: DisplayChallengeIntroStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <DisplayFinalsSafeStage className="items-center justify-center px-8">
      <div className="relative w-full max-w-6xl text-center">
        <div
          className="pointer-events-none absolute -inset-x-8 -inset-y-10 rounded-[2.5rem] bg-gradient-to-b from-black/88 via-black/78 to-black/88 backdrop-blur-lg border border-white/12 shadow-[0_32px_100px_rgba(0,0,0,0.75)]"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center gap-8 px-8 py-14 md:py-16">
          <motion.p
            className="text-2xl md:text-4xl font-semibold uppercase tracking-[0.38em] text-white/90"
            style={{
              textShadow:
                "0 0 24px rgba(233,30,140,0.55), 0 2px 12px rgba(0,0,0,0.95)",
            }}
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {FINALS_COPY.displayChallengePrefix}
          </motion.p>

          <motion.h1
            className={cn(
              "font-display font-bold uppercase text-white",
              DISPLAY_CHALLENGE_TITLE_CLASS,
            )}
            style={{
              fontFamily: "var(--font-display), serif",
              textShadow:
                "0 6px 0 rgba(0,0,0,1), 0 0 56px rgba(233,30,140,0.9), 0 0 96px rgba(233,30,140,0.35)",
              WebkitTextStroke: "1px rgba(0,0,0,0.4)",
            }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 200, damping: 22 }}
          >
            {presentation.displayTitle}
          </motion.h1>

          <motion.p
            className="max-w-4xl text-2xl md:text-4xl text-white/85 leading-relaxed uppercase tracking-[0.06em]"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.95)" }}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {presentation.explanation}
          </motion.p>
        </div>
      </div>
    </DisplayFinalsSafeStage>
  );
}
