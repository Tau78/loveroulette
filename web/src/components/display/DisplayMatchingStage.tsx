"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { MATCHING_COPY } from "@/lib/game/late-game-copy";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const ORBIT_HEARTS = [
  { angle: 0, radius: 72, delay: 0 },
  { angle: 72, radius: 72, delay: 0.25 },
  { angle: 144, radius: 72, delay: 0.5 },
  { angle: 216, radius: 72, delay: 0.75 },
  { angle: 288, radius: 72, delay: 1 },
] as const;
const PROGRESS_DOTS = 5;

function SpinningAffinityWheel() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className="relative mx-auto mt-10 flex size-32 md:size-40 items-center justify-center"
        aria-hidden
      >
        <div className="size-full rounded-full border-4 border-primary/35" />
        <Heart className="absolute size-12 fill-primary text-primary" />
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto mt-10 size-36 md:size-44"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/45"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-white/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-8 rounded-full bg-primary/10 blur-sm"
        animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {ORBIT_HEARTS.map((heart, index) => {
        const rad = (heart.angle * Math.PI) / 180;
        const x = Math.cos(rad) * heart.radius;
        const y = Math.sin(rad) * heart.radius;

        return (
          <motion.div
            key={index}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: 360 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
              delay: heart.delay,
            }}
          >
            <motion.div
              style={{ x, y }}
              animate={{
                scale: [0.85, 1.15, 0.85],
                opacity: [0.55, 1, 0.55],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: heart.delay,
              }}
            >
              <Heart className="size-5 md:size-6 fill-primary/90 text-primary drop-shadow-[0_0_12px_rgba(233,30,140,0.75)]" />
            </motion.div>
          </motion.div>
        );
      })}

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="size-14 md:size-16 fill-primary text-primary drop-shadow-[0_0_28px_rgba(233,30,140,0.9)]" />
        </motion.div>
      </div>
    </div>
  );
}

function MatchingProgressDots() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="mt-8 flex items-center justify-center gap-3"
      aria-hidden
    >
      {Array.from({ length: PROGRESS_DOTS }, (_, index) => (
        <motion.span
          key={index}
          className={cn(
            "size-2.5 md:size-3 rounded-full bg-primary/75",
            reduceMotion && "opacity-70",
          )}
          animate={
            reduceMotion
              ? undefined
              : {
                  scale: [1, 1.45, 1],
                  opacity: [0.3, 1, 0.3],
                }
          }
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.18,
          }}
        />
      ))}
    </div>
  );
}

interface DisplayMatchingStageProps {
  className?: string;
}

/** Schermata proiettore durante il calcolo affinità (fase matching). */
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
      aria-busy="true"
      aria-label="Calcolo affinità in corso"
    >
      <DisplayPhaseHero
        kicker={MATCHING_COPY.displayKicker}
        headline={MATCHING_COPY.displayHeadline}
        subline={MATCHING_COPY.displaySubline}
        pulse
        uppercase
      />
      <SpinningAffinityWheel />
      <MatchingProgressDots />
    </motion.div>
  );
}
