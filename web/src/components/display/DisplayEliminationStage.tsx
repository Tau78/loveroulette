"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FinalistCouple, LastElimination } from "@/lib/musicpro/elimination";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { cn } from "@/lib/utils";

const ELIMINATION_VISIBLE_MS = 8000;

interface DisplayEliminationStageProps {
  lastElimination: LastElimination | null;
  finalists: FinalistCouple[];
  className?: string;
}

export function DisplayFinalistsBar({
  finalists,
  className,
}: {
  finalists: FinalistCouple[];
  className?: string;
}) {
  const slots = [0, 1, 2] as const;

  return (
    <footer
      className={cn(
        "relative z-10 grid grid-cols-3 gap-4 px-8 py-5 border-t border-white/10 bg-black/40 backdrop-blur-sm",
        className,
      )}
    >
      {slots.map((index) => {
        const couple = finalists[index];
        const label = `Finalista ${index + 1}`;

        return (
          <div
            key={label}
            className={cn(
              "rounded-xl py-4 text-center text-lg md:text-xl font-semibold border transition-colors duration-500",
              couple
                ? "bg-primary/15 border-primary/35 text-white"
                : "bg-black/30 border-white/10 text-white/55",
            )}
          >
            {couple ? (
              <>
                <span className="block text-sm font-normal uppercase tracking-wider text-primary/90 mb-1">
                  {label}
                </span>
                {couple.maleNick} & {couple.femaleNick}
              </>
            ) : (
              <>
                {label}
                <span className="block text-sm font-normal text-white/35 mt-1">
                  In attesa
                </span>
              </>
            )}
          </div>
        );
      })}
    </footer>
  );
}

export function DisplayEliminationStage({
  lastElimination,
  finalists,
  className,
}: DisplayEliminationStageProps) {
  const reduceMotion = useReducedMotion();
  const [visibleElimination, setVisibleElimination] =
    useState<LastElimination | null>(null);
  const lastSeenAt = useRef<string | null>(null);

  useEffect(() => {
    if (!lastElimination?.updatedAt) {
      setVisibleElimination(null);
      return;
    }

    if (lastSeenAt.current === lastElimination.updatedAt) {
      return;
    }

    lastSeenAt.current = lastElimination.updatedAt;
    setVisibleElimination(lastElimination);

    const elapsed = Date.now() - new Date(lastElimination.updatedAt).getTime();
    const remaining = ELIMINATION_VISIBLE_MS - elapsed;

    if (remaining <= 0) {
      setVisibleElimination(null);
      return;
    }

    const timer = window.setTimeout(
      () => setVisibleElimination(null),
      remaining,
    );
    return () => window.clearTimeout(timer);
  }, [lastElimination]);

  const showElimination = visibleElimination !== null;

  return (
    <div className={cn("flex flex-1 flex-col min-h-0", className)}>
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 md:pb-20">
        {showElimination && visibleElimination ? (
          <motion.div
            key={visibleElimination.updatedAt}
            className="relative w-full max-w-5xl text-center"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 24 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={{ opacity: 0, scale: 0.88, y: -32, filter: "blur(8px)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-[2rem] border border-destructive/35 bg-gradient-to-b from-black/90 via-black/80 to-black/90 px-6 py-10 md:px-14 md:py-16 shadow-[0_0_60px_rgba(255,71,87,0.25)]">
              <p className="font-display text-xl md:text-3xl font-bold uppercase tracking-[0.35em] text-destructive mb-6 md:mb-8">
                Eliminati
              </p>
              <motion.p
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
                style={{
                  fontFamily: "var(--font-display), serif",
                  textShadow:
                    "0 4px 0 rgba(0,0,0,1), 0 0 36px rgba(255,71,87,0.65)",
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: [1, 1, 0.35],
                        scale: [1, 1, 0.94],
                      }
                }
                transition={{
                  duration: ELIMINATION_VISIBLE_MS / 1000,
                  times: [0, 0.72, 1],
                  ease: "easeInOut",
                }}
              >
                {visibleElimination.maleNick}
                <span className="block text-3xl md:text-5xl text-destructive/90 my-2 md:my-3">
                  &
                </span>
                {visibleElimination.femaleNick}
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <DisplayPhaseHero
            kicker="Sfoltimento"
            headline="Restano solo i finalisti"
            subline={
              finalists.length >= 3
                ? "Top 3 pronti per le finali"
                : "Eliminazione in corso…"
            }
            pulse={finalists.length < 3}
          />
        )}
      </div>

      <DisplayFinalistsBar finalists={finalists} />
    </div>
  );
}
