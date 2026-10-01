"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { LastReveal } from "@/lib/musicpro/extraction";
import { EXTRACTION_COPY } from "@/lib/game/late-game-copy";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { cn } from "@/lib/utils";
import { EXTRACTION_SPIN_DURATION_MS } from "@/lib/game/extraction-timing";
import { PROJECTOR_EXTRACTION_WHEEL_PX } from "@/lib/display/projector-canvas";
import { DisplayCoupleRevealPanel } from "@/components/display/DisplayCoupleRevealPanel";

const SPIN_DURATION_MS = EXTRACTION_SPIN_DURATION_MS;
const WHEEL_SEGMENT_COUNT = 12;
const WHEEL_LABEL_RADIUS_PERCENT = 38;

interface DisplayExtractionStageProps {
  lastReveal: LastReveal | null;
  /** Show affinity percentage after reveal. */
  showAffinity?: boolean;
}

type ExtractionStage = "idle" | "spinning" | "revealed";

/** Pure helper for tests — when to run the roulette spin before reveal. */
export function shouldSpinExtractionReveal(
  previousUpdatedAt: string | null,
  nextUpdatedAt: string,
  spinOnFirstReveal: boolean,
): boolean {
  if (previousUpdatedAt === null) return spinOnFirstReveal;
  if (previousUpdatedAt === nextUpdatedAt) return false;
  return true;
}

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
            className="absolute z-10 font-display text-[26px] font-bold tabular-nums text-white/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
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
          <span className="font-display text-[34px] font-bold uppercase tracking-[0.35em] text-primary/90">
            Love
          </span>
        </div>
      </motion.div>
    </div>
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
      const spin = shouldSpinExtractionReveal(null, lastReveal.updatedAt, true);
      if (!spin || reduceMotion) {
        setStage("revealed");
        return;
      }
      setStage("spinning");
      spinTimerRef.current = window.setTimeout(() => {
        spinTimerRef.current = null;
        setStage("revealed");
      }, SPIN_DURATION_MS);
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
                "font-display text-[43px] font-bold uppercase tracking-[0.28em] text-primary",
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
            className="absolute inset-0 flex min-h-0 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <DisplayCoupleRevealPanel
              reveal={activeReveal}
              showAffinity={showAffinity}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
