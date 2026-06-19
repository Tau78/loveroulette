"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { QUIZ_PHASE_BACKGROUNDS } from "@/lib/display/quiz-phase-backgrounds";

interface DisplayQuizPhaseOverlayProps {
  phase: QuizDisplayPhase;
}

export function DisplayQuizPhaseOverlay({ phase }: DisplayQuizPhaseOverlayProps) {
  const reduceMotion = useReducedMotion();
  const config = QUIZ_PHASE_BACKGROUNDS[phase];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
        aria-hidden
      >
        <div className="absolute inset-0" style={{ background: config.base }} />

        {!reduceMotion ? (
          <>
            <motion.div
              className="absolute inset-[-10%] blur-[48px]"
              style={{ background: config.glow }}
              animate={{
                scale: phase === "answers" ? [1, 1.08, 1] : [1, 1.04, 1],
                opacity: phase === "answers" ? [0.7, 1, 0.7] : [0.85, 1, 0.85],
              }}
              transition={{
                duration: phase === "answers" ? 2.2 : 5.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-[-5%] blur-[32px]"
              style={{ background: config.accent }}
              animate={{
                x:
                  phase === "next_question"
                    ? ["-4%", "4%", "-4%"]
                    : ["-2%", "2%", "-2%"],
                y: ["-1%", "2%", "-1%"],
              }}
              transition={{
                duration: phase === "next_question" ? 4 : 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-90"
              style={{ background: config.glow }}
            />
            <div
              className="absolute inset-0 opacity-70"
              style={{ background: config.accent }}
            />
          </>
        )}

        <div className="absolute inset-0" style={{ background: config.vignette }} />
      </motion.div>
    </AnimatePresence>
  );
}
