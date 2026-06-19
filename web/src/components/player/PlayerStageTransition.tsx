"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface PlayerStageTransitionProps {
  stageKey: string;
  children: ReactNode;
  className?: string;
}

/** Transizione luminosa tra sezioni / fasi del giocatore mobile. */
export function PlayerStageTransition({
  stageKey,
  children,
  className,
}: PlayerStageTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={stageKey}
        className={className}
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: [
            "drop-shadow(0 0 0px rgba(236,72,153,0))",
            "drop-shadow(0 0 22px rgba(236,72,153,0.35))",
            "drop-shadow(0 0 0px rgba(236,72,153,0))",
          ],
        }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{
          duration: 0.42,
          ease: [0.16, 1, 0.3, 1],
          filter: { duration: 0.9, ease: "easeInOut" },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
