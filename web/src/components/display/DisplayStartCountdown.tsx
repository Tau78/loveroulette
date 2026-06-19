"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface DisplayStartCountdownProps {
  value: number;
}

/** Countdown pre-quiz: numeri grandi al centro schermo. */
export function DisplayStartCountdown({ value }: DisplayStartCountdownProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="flex h-full min-h-0 items-center justify-center"
      aria-live="polite"
      aria-label={`${value} secondi al via`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          className="font-display font-bold tabular-nums leading-none text-white drop-shadow-[0_12px_80px_rgba(236,72,153,0.85)] text-[min(28vw,320px)]"
          initial={
            reduceMotion ? false : { scale: 0.35, opacity: 0, filter: "blur(8px)" }
          }
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          exit={
            reduceMotion
              ? undefined
              : { scale: 1.25, opacity: 0, filter: "blur(6px)" }
          }
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
