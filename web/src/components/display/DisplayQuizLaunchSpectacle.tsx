"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DISPLAY_COUNTDOWN_DIGIT_CLASS,
  DISPLAY_TEXT_PLATE_CLASS,
  DISPLAY_TEXT_SHADOW_BROADCAST,
  DISPLAY_TEXT_SHADOW_HERO,
} from "@/lib/display/display-text-legibility";

const LAUNCH_REVEAL_MS = 3200;

interface DisplayQuizLaunchSpectacleProps {
  /** Secondi rimanenti dal sync server (5 → 1, poi 0). */
  remaining: number;
  /** Chiamato una volta dopo countdown + reveal (tick fase successiva). */
  onComplete: () => void;
  /** Numero fase mostrato nel reveal (default 1). */
  phaseNumber?: number;
  className?: string;
}

/** Countdown spettacolare lobby → Q&A, poi reveal «VIA ALLA FASE N · Q&A». */
export function DisplayQuizLaunchSpectacle({
  remaining,
  onComplete,
  phaseNumber = 1,
  className,
}: DisplayQuizLaunchSpectacleProps) {
  const reduceMotion = useReducedMotion();
  const completedRef = useRef(false);
  const [stage, setStage] = useState<"countdown" | "reveal">(
    remaining > 0 ? "countdown" : "reveal",
  );
  const displayValue = remaining > 0 ? remaining : null;

  useEffect(() => {
    if (remaining > 0) {
      setStage("countdown");
      return;
    }
    setStage("reveal");
  }, [remaining]);

  useEffect(() => {
    if (stage !== "reveal" || completedRef.current) return;

    const timer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, LAUNCH_REVEAL_MS);

    return () => window.clearTimeout(timer);
  }, [stage, onComplete]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-hidden",
        className,
      )}
      aria-live="polite"
    >
      {/* Pulse rings */}
      {!reduceMotion ? (
        <>
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-1/2 size-[min(85vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
              initial={{ scale: 0.35, opacity: 0.7 }}
              animate={{ scale: 1.55, opacity: 0 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: ring * 0.55,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_50%,rgba(236,72,153,0.35),transparent_70%)]"
            animate={{ opacity: [0.35, 0.75, 0.35] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      ) : null}

      <AnimatePresence mode="wait">
        {stage === "countdown" && displayValue != null ? (
          <motion.div
            key={`cd-${displayValue}`}
            className="relative z-10 flex flex-col items-center"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.2 }}
          >
            {!reduceMotion ? (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 size-[min(42vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
                initial={{ scale: 0.5, opacity: 0.9 }}
                animate={{ scale: 1.35, opacity: 0 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                aria-hidden
              />
            ) : null}
            <motion.span
              className={cn(
                DISPLAY_COUNTDOWN_DIGIT_CLASS,
                "text-[min(32vw,380px)]",
              )}
              initial={
                reduceMotion
                  ? false
                  : { scale: 0.2, opacity: 0, rotate: -8, filter: "blur(12px)" }
              }
              animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 280, damping: 16 }}
            >
              {displayValue}
            </motion.span>
          </motion.div>
        ) : null}

        {stage === "reveal" ? (
          <motion.div
            key="reveal"
            className="relative z-10 w-full max-w-5xl px-6 text-center"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <div className={DISPLAY_TEXT_PLATE_CLASS} aria-hidden />
            <div className="relative z-10 flex flex-col items-center gap-4 py-10 md:py-14">
              {!reduceMotion ? (
                <motion.div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,120,0.18),transparent_55%)]"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 1, 0.6], scale: [0.6, 1.2, 1] }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  aria-hidden
                />
              ) : null}

              <motion.p
                className="relative font-sans text-[clamp(1.25rem,3.5vw,2.5rem)] font-semibold uppercase tracking-[0.35em] text-white"
                style={{ textShadow: DISPLAY_TEXT_SHADOW_BROADCAST }}
                initial={reduceMotion ? false : { opacity: 0, y: 40, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, y: 0, letterSpacing: "0.35em" }}
                transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.05 }}
              >
                Via alla fase {phaseNumber}
              </motion.p>

              <motion.p
                className="relative font-display text-[clamp(3.5rem,12vw,8rem)] font-bold uppercase leading-none tracking-tight text-white"
                style={{ textShadow: DISPLAY_TEXT_SHADOW_HERO }}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, scale: 0.55, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.22 }}
              >
                Q&amp;A
              </motion.p>

              {!reduceMotion ? (
                <motion.div
                  className="relative mt-2 h-1 w-[min(60vw,420px)] origin-center rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.45, ease: "easeOut" }}
                  aria-hidden
                />
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Interstitial locale quando la fase quiz è attiva ma lo stato quiz non è ancora arrivato. */
export function DisplayQuizLaunchInterstitial({
  onFinished,
  className,
}: {
  onFinished?: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [remaining, setRemaining] = useState(5);
  const finishedRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((value) => (value <= 0 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinished?.();
  };

  if (reduceMotion && remaining <= 0) {
    handleComplete();
    return null;
  }

  return (
    <DisplayQuizLaunchSpectacle
      remaining={remaining}
      onComplete={handleComplete}
      className={className}
    />
  );
}
