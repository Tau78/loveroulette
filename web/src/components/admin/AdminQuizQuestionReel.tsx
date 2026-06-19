"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import { cn } from "@/lib/utils";

const VISIBLE_ABOVE = 3;
const VISIBLE_BELOW = 3;
const SLOT_HEIGHT = 52;

interface AdminQuizQuestionReelProps {
  questions: LoveRouletteQuestion[];
  currentIndex: number;
  className?: string;
}

function distanceStyle(offset: number): {
  opacity: number;
  scale: number;
  blur: string;
} {
  const abs = Math.abs(offset);
  if (abs === 0) {
    return { opacity: 1, scale: 1, blur: "0px" };
  }
  if (abs === 1) {
    return { opacity: 0.72, scale: 0.96, blur: "0px" };
  }
  if (abs === 2) {
    return { opacity: 0.45, scale: 0.92, blur: "0.4px" };
  }
  return { opacity: 0.22, scale: 0.88, blur: "0.8px" };
}

export function AdminQuizQuestionReel({
  questions,
  currentIndex,
  className,
}: AdminQuizQuestionReelProps) {
  const reduceMotion = useReducedMotion();

  const viewportHeight = (VISIBLE_ABOVE + 1 + VISIBLE_BELOW) * SLOT_HEIGHT;
  const translateY = (VISIBLE_ABOVE - currentIndex) * SLOT_HEIGHT;

  const slots = useMemo(
    () =>
      questions.map((question, index) => ({
        question,
        index,
        offset: index - currentIndex,
      })),
    [questions, currentIndex],
  );

  if (questions.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-border/40 bg-background/30 text-xs text-muted-foreground",
          className,
        )}
        style={{ height: viewportHeight }}
      >
        Nessuna domanda nel rullo
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-primary/25 bg-gradient-to-b from-background/80 via-background/50 to-background/80 shadow-[inset_0_0_32px_rgba(233,30,140,0.08)]",
        className,
      )}
      style={{ height: viewportHeight }}
      aria-label={`Domanda ${currentIndex + 1} di ${questions.length}`}
    >
      {/* Side rails */}
      <div
        className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-3 right-0 w-1 rounded-full bg-gradient-to-b from-transparent via-primary/35 to-transparent"
        aria-hidden
      />

      {/* Center window highlight */}
      <div
        className="pointer-events-none absolute inset-x-2 top-1/2 z-10 -translate-y-1/2 rounded-md border border-primary/45 bg-primary/10 shadow-[0_0_24px_rgba(236,72,153,0.2)]"
        style={{ height: SLOT_HEIGHT - 4 }}
        aria-hidden
      />

      {/* Top / bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-gradient-to-b from-card via-card/85 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-card via-card/85 to-transparent"
        aria-hidden
      />

      <motion.div
        className="relative z-[5] will-change-transform"
        animate={{ y: translateY }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 340, damping: 32, mass: 0.85 }
        }
      >
        {slots.map(({ question, index, offset }) => {
          const inWindow =
            offset >= -VISIBLE_ABOVE && offset <= VISIBLE_BELOW;
          if (!inWindow) {
            return (
              <div
                key={question.id}
                style={{ height: SLOT_HEIGHT }}
                aria-hidden
              />
            );
          }

          const style = distanceStyle(offset);
          const isCurrent = offset === 0;

          return (
            <motion.div
              key={question.id}
              className="flex items-center px-3"
              style={{ height: SLOT_HEIGHT }}
              animate={{
                opacity: style.opacity,
                scale: style.scale,
                filter: `blur(${style.blur})`,
              }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.35, ease: "easeOut" }
              }
            >
              <div
                className={cn(
                  "flex w-full min-w-0 items-center gap-2",
                  isCurrent ? "px-1" : "px-2",
                )}
              >
                <span
                  className={cn(
                    "shrink-0 tabular-nums font-mono text-[10px] font-bold",
                    isCurrent ? "text-primary" : "text-muted-foreground/70",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate font-semibold leading-tight",
                    isCurrent
                      ? "text-sm text-foreground"
                      : "text-xs text-muted-foreground",
                  )}
                  title={question.body}
                >
                  {question.body}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-primary/90">
        {currentIndex + 1} / {questions.length}
      </div>
    </div>
  );
}

export { VISIBLE_ABOVE, VISIBLE_BELOW, SLOT_HEIGHT };
