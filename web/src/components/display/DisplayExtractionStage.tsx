"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { LastReveal } from "@/lib/musicpro/extraction";
import { EXTRACTION_COPY } from "@/lib/game/late-game-copy";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { cn } from "@/lib/utils";
import { EXTRACTION_SPIN_DURATION_MS } from "@/lib/game/extraction-timing";
import { PROJECTOR_EXTRACTION_WHEEL_PX } from "@/lib/display/projector-canvas";

const SPIN_DURATION_MS = EXTRACTION_SPIN_DURATION_MS;
const WHEEL_SEGMENT_COUNT = 12;
const WHEEL_LABEL_RADIUS_PERCENT = 38;

interface DisplayExtractionStageProps {
  lastReveal: LastReveal | null;
  /** Show affinity percentage after reveal. */
  showAffinity?: boolean;
}

type ExtractionStage = "idle" | "spinning" | "revealed";

function WheelSegmentLabels() {
  const segmentAngle = 360 / WHEEL_SEGMENT_COUNT;

  return (
    <>
      {Array.from({ length: WHEEL_SEGMENT_COUNT }).map((_, index) => {
        const centerAngle = index * segmentAngle + segmentAngle / 2;
        const rad = ((centerAngle - 90) * Math.PI) / 180;
        const x = 50 + WHEEL_LABEL_RADIUS_PERCENT * Math.cos(rad);
        const y = 50 + WHEEL_LABEL_RADIUS_PERCENT * Math.sin(rad);

        return (
          <span
            key={index}
            className="absolute z-10 font-display text-[22px] font-bold tabular-nums text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${centerAngle}deg)`,
            }}
            aria-hidden
          >
            {index + 1}
          </span>
        );
      })}
    </>
  );
}

function RouletteWheel({ spinning }: { spinning: boolean }) {
  const reduceMotion = useReducedMotion();
  const wheelSize = PROJECTOR_EXTRACTION_WHEEL_PX;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: wheelSize, height: wheelSize }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />

      <div
        className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1"
        aria-hidden
      >
        <div className="size-0 border-x-[16px] border-x-transparent border-t-[26px] border-t-primary drop-shadow-[0_0_12px_rgba(236,72,153,0.9)]" />
      </div>

      <motion.div
        className="relative size-full"
        animate={
          reduceMotion
            ? { rotate: 0 }
            : spinning
              ? { rotate: [0, 1440 + 45] }
              : { rotate: [0, 360] }
        }
        transition={
          spinning
            ? {
                duration: SPIN_DURATION_MS / 1000,
                ease: [0.12, 0.85, 0.18, 1],
              }
            : {
                duration: 18,
                repeat: Infinity,
                ease: "linear",
              }
        }
      >
        <div
          className="absolute inset-0 rounded-full border-4 border-white/20 shadow-[0_0_60px_rgba(236,72,153,0.35),inset_0_0_40px_rgba(0,0,0,0.65)]"
          style={{
            background: `conic-gradient(from -90deg, ${Array.from({ length: WHEEL_SEGMENT_COUNT }, (_, i) => {
              const color =
                i % 2 === 0
                  ? "rgba(236,72,153,0.85)"
                  : "rgba(15,5,20,0.95)";
              const start = (360 / WHEEL_SEGMENT_COUNT) * i;
              const end = (360 / WHEEL_SEGMENT_COUNT) * (i + 1);
              return `${color} ${start}deg ${end}deg`;
            }).join(", ")})`,
          }}
          aria-hidden
        />

        <WheelSegmentLabels />

        <div className="absolute inset-[18%] rounded-full border-2 border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-primary/20 shadow-[inset_0_0_32px_rgba(0,0,0,0.8)]" />

        <div className="absolute inset-[32%] flex items-center justify-center rounded-full border border-primary/40 bg-black/80">
          <span className="font-display text-[28px] font-bold uppercase tracking-[0.35em] text-primary/90">
            Love
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function CoupleReveal({
  reveal,
  showAffinity,
}: {
  reveal: LastReveal;
  showAffinity: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative w-full max-w-6xl text-center"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      {!reduceMotion ? (
        <>
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-1/2 size-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/35"
              initial={{ scale: 0.5, opacity: 0.65 }}
              animate={{ scale: 1.65, opacity: 0 }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: ring * 0.7,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
        </>
      ) : null}

      <div className="relative z-10 mx-auto rounded-[2rem] border border-primary/30 bg-gradient-to-b from-black/90 via-black/80 to-black/90 px-6 py-10 md:px-14 md:py-16 shadow-[0_0_80px_rgba(233,30,140,0.35)]">
        <motion.p
          className="font-display text-xl md:text-3xl font-bold uppercase tracking-[0.35em] text-primary mb-6 md:mb-8"
          style={{
            fontFamily: "var(--font-display), serif",
            textShadow: "0 0 28px rgba(233,30,140,0.8)",
          }}
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          Coppia rivelata
        </motion.p>

        <div className="flex flex-col items-center gap-2 md:gap-4">
          <motion.p
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-none"
            style={{
              fontFamily: "var(--font-display), serif",
              textShadow:
                "0 4px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.9)",
            }}
            initial={reduceMotion ? false : { opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 16 }}
          >
            {reveal.maleNick}
          </motion.p>

          <motion.span
            className="font-display text-4xl md:text-6xl text-primary font-bold"
            style={{ fontFamily: "var(--font-display), serif" }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 14 }}
            aria-hidden
          >
            &
          </motion.span>

          <motion.p
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-none"
            style={{
              fontFamily: "var(--font-display), serif",
              textShadow:
                "0 4px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.9)",
            }}
            initial={reduceMotion ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38, type: "spring", stiffness: 180, damping: 16 }}
          >
            {reveal.femaleNick}
          </motion.p>
        </div>

        {showAffinity && reveal.affinityScore > 0 ? (
          <motion.p
            className="mt-8 md:mt-10 text-lg md:text-2xl text-white/75"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            Affinità{" "}
            <span className="font-display text-3xl md:text-4xl font-bold text-primary tabular-nums">
              {Math.round(reveal.affinityScore)}%
            </span>
          </motion.p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function DisplayExtractionStage({
  lastReveal,
  showAffinity = false,
}: DisplayExtractionStageProps) {
  const [stage, setStage] = useState<ExtractionStage>("idle");
  const prevUpdatedAtRef = useRef<string | null>(null);
  const spinTimerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
    }

    if (!lastReveal) {
      prevUpdatedAtRef.current = null;
      setStage("idle");
      return;
    }

    const previousUpdatedAt = prevUpdatedAtRef.current;

    if (previousUpdatedAt === null) {
      prevUpdatedAtRef.current = lastReveal.updatedAt;
      setStage("revealed");
      return;
    }

    if (previousUpdatedAt === lastReveal.updatedAt) {
      return;
    }

    prevUpdatedAtRef.current = lastReveal.updatedAt;

    if (reduceMotion) {
      setStage("revealed");
      return;
    }

    setStage("spinning");
    spinTimerRef.current = window.setTimeout(() => {
      spinTimerRef.current = null;
      setStage("revealed");
    }, SPIN_DURATION_MS);

    return () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
    };
  }, [lastReveal, reduceMotion]);

  const activeReveal = lastReveal;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      <AnimatePresence mode="wait">
        {stage === "idle" ? (
          <motion.div
            key="idle"
            className="absolute inset-0 flex flex-col items-center justify-center gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <RouletteWheel spinning={false} />
            <DisplayPhaseHero
              kicker={EXTRACTION_COPY.displayKicker}
              headline={EXTRACTION_COPY.displayHeadline}
              subline={EXTRACTION_COPY.displaySubline}
              pulse
              uppercase
            />
          </motion.div>
        ) : null}

        {stage === "spinning" && activeReveal ? (
          <motion.div
            key={`spin-${activeReveal.updatedAt}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RouletteWheel spinning />
            <motion.p
              className={cn(
                "font-display text-[36px] font-bold uppercase tracking-[0.28em] text-primary",
                "drop-shadow-[0_0_24px_rgba(236,72,153,0.75)]",
              )}
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            >
              Estrazione in corso…
            </motion.p>
          </motion.div>
        ) : null}

        {stage === "revealed" && activeReveal ? (
          <motion.div
            key={`reveal-${activeReveal.updatedAt}`}
            className="absolute inset-0 flex items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <CoupleReveal reveal={activeReveal} showAffinity={showAffinity} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
