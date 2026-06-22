"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FinalsShowState } from "@/lib/musicpro/finals-show";
import {
  coupleLabel,
  podiumFromShow,
  WINNER_SPECTACLE_SECONDS,
} from "@/lib/musicpro/finals-show";

interface DisplayWinnerSpectacleProps {
  show: FinalsShowState;
  runtimeState: "finals" | "winner";
  phase: "winner_spectacle" | "winner_podium";
}

export function DisplayWinnerSpectacle({
  show,
  phase,
}: DisplayWinnerSpectacleProps) {
  const podium = useMemo(() => podiumFromShow(show), [show]);
  const winner = podium[0];
  const [spinIndex, setSpinIndex] = useState(0);
  const [spectacleDone, setSpectacleDone] = useState(phase === "winner_podium");

  useEffect(() => {
    if (phase !== "winner_spectacle" || show.finalists.length === 0) {
      setSpectacleDone(true);
      return;
    }

    setSpectacleDone(false);
    const started = Date.parse(show.phaseStartedAt);
    const elapsed = Number.isNaN(started)
      ? 0
      : Math.max(0, Date.now() - started);
    const remainingMs = Math.max(
      0,
      WINNER_SPECTACLE_SECONDS * 1000 - elapsed,
    );

    const spinInterval = window.setInterval(() => {
      setSpinIndex((i) => (i + 1) % show.finalists.length);
    }, 120);

    const finishTimer = window.setTimeout(() => {
      setSpectacleDone(true);
      window.clearInterval(spinInterval);
    }, remainingMs);

    return () => {
      window.clearInterval(spinInterval);
      window.clearTimeout(finishTimer);
    };
  }, [phase, show.finalists.length, show.phaseStartedAt]);

  if (!winner) {
    return (
      <div className="flex flex-1 items-center justify-center text-white/70">
        Nessun finalista da proclamare.
      </div>
    );
  }

  if (!spectacleDone) {
    const current = show.finalists[spinIndex] ?? winner.finalist;
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(236,72,153,0.35),transparent_55%)]" />
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-40"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "conic-gradient(from 0deg, transparent, rgba(255,215,0,0.25), transparent, rgba(236,72,153,0.3), transparent)",
          }}
        />
        <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-6">
          Proclama vincitore
        </p>
        <AnimatePresence mode="wait">
          <motion.h2
            key={current.pairId + spinIndex}
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 1.05 }}
            transition={{ duration: 0.12 }}
            className="relative z-10 font-display text-4xl md:text-6xl font-bold text-center text-white drop-shadow-[0_0_48px_rgba(255,215,0,0.35)]"
          >
            {coupleLabel(current)}
          </motion.h2>
        </AnimatePresence>
        <motion.p
          className="relative z-10 mt-8 text-sm text-white/50 uppercase tracking-[0.2em]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          Chi vincerà stasera?
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-20 gap-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,215,0,0.2),transparent_60%)]" />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 14 }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <motion.div
          className="relative flex items-center justify-center size-48 md:size-56 rounded-full border-4 border-amber-300/80 bg-gradient-to-br from-amber-200/30 via-primary/40 to-amber-500/20 shadow-[0_0_80px_rgba(255,215,0,0.45)]"
          animate={{
            boxShadow: [
              "0 0 60px rgba(255,215,0,0.35)",
              "0 0 100px rgba(255,215,0,0.65)",
              "0 0 60px rgba(255,215,0,0.35)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-6xl" aria-hidden>
            ♥
          </span>
        </motion.div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
          Vincitori
        </p>
        <h2 className="font-display text-4xl md:text-6xl font-bold text-center text-white">
          {coupleLabel(winner.finalist)}
        </h2>
        <p className="text-2xl font-display text-amber-200 tabular-nums">
          {winner.score} voti totali
        </p>
      </motion.div>

      {podium.length > 1 ? (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {podium.slice(1, 3).map((entry) => (
            <div
              key={entry.finalist.pairId}
              className="rounded-xl border border-white/15 bg-black/40 px-5 py-4 text-center"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                {entry.place}° posto
              </p>
              <p className="mt-1 font-semibold text-lg text-white/90">
                {coupleLabel(entry.finalist)}
              </p>
              <p className="text-primary tabular-nums font-display text-xl mt-1">
                {entry.score} voti
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
