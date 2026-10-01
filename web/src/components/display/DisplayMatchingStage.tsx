"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { MATCHING_COPY } from "@/lib/game/late-game-copy";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

interface DisplayMatchingStageProps {
  className?: string;
}

/** Fine quiz: slide «STOP ALLE DOMANDE» prima dell’estrazione. */
export function DisplayMatchingStage({ className }: DisplayMatchingStageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-4 pb-16 md:pb-20",
        className,
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
      aria-live="polite"
      aria-label="Stop alle domande"
    >
      <DisplayPhaseHero
        kicker={MATCHING_COPY.displayKicker}
        headline={MATCHING_COPY.displayHeadline}
        subline={MATCHING_COPY.displaySubline}
        pulse
        uppercase
      />
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none mt-12 size-[min(42vw,220px)] rounded-full border-2 border-primary/40"
          initial={{ scale: 0.7, opacity: 0.8 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      ) : null}
    </motion.div>
  );
}
