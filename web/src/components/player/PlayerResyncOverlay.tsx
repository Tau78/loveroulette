"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PLAYER_RESUME_OVERLAY_COPY } from "@/lib/player/player-resume-sync";

interface PlayerResyncOverlayProps {
  visible: boolean;
}

export function PlayerResyncOverlay({ visible }: PlayerResyncOverlayProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-6 backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/15 bg-black/55 px-6 py-7 text-center shadow-[0_0_40px_rgba(236,72,153,0.18)] backdrop-blur-md">
            <motion.div
              className="size-10 rounded-full border-2 border-primary/40 border-t-primary"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 1, repeat: Infinity, ease: "linear" }
              }
              aria-hidden
            />
            <p className="font-display text-lg font-semibold tracking-wide text-white">
              {PLAYER_RESUME_OVERLAY_COPY}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
