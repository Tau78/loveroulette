"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart, Sparkles, Trophy, Users } from "lucide-react";
import type { EventState } from "@/lib/types";
import { LottieHeartsSpin } from "@/components/player/LottieHeartsSpin";

interface PlayerRuntimeGlowProps {
  runtimeState: EventState;
}

/** Animazione centrale per fasi non-quiz (matching, estrazione, finali…). */
export function PlayerRuntimeGlow({ runtimeState }: PlayerRuntimeGlowProps) {
  const reduceMotion = useReducedMotion();

  if (runtimeState === "lobby" || runtimeState === "quiz" || runtimeState === "closed") {
    return null;
  }

  if (reduceMotion) {
    return (
      <div className="flex justify-center py-4" aria-hidden>
        <Heart className="size-12 fill-primary/40 text-primary" />
      </div>
    );
  }

  if (runtimeState === "matching") {
    return (
      <div className="py-2">
        <LottieHeartsSpin className="mx-auto h-28 w-28" />
      </div>
    );
  }

  if (runtimeState === "extraction") {
    return (
      <motion.div
        className="relative mx-auto flex size-32 items-center justify-center"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary/50"
            animate={{ scale: [0.8, 1.4], opacity: [0.6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: ring * 0.45,
              ease: "easeOut",
            }}
            aria-hidden
          />
        ))}
        <Sparkles className="size-14 text-primary drop-shadow-[0_0_24px_rgba(236,72,153,0.8)]" />
      </motion.div>
    );
  }

  if (runtimeState === "elimination") {
    return (
      <motion.div
        className="mx-auto flex size-24 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/40 shadow-[0_0_40px_rgba(236,72,153,0.45)]"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <Users className="size-11 text-primary" />
      </motion.div>
    );
  }

  if (runtimeState === "finals" || runtimeState === "winner") {
    return (
      <motion.div
        className="mx-auto flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-fuchsia-600/10 ring-2 ring-primary/50 shadow-[0_0_48px_rgba(236,72,153,0.55)]"
        animate={{
          boxShadow: [
            "0 0 32px rgba(236,72,153,0.4)",
            "0 0 56px rgba(236,72,153,0.75)",
            "0 0 32px rgba(236,72,153,0.4)",
          ],
          rotate: [0, 4, -4, 0],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <Trophy className="size-12 text-primary fill-primary/25" />
      </motion.div>
    );
  }

  return null;
}
