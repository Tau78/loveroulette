"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAME_SHADOW =
  "0 3px 0 rgba(0,0,0,1), 0 0 28px rgba(233,30,140,0.8)";

export interface DisplayFinalsCoupleCardProps {
  index: number;
  maleNick: string;
  femaleNick: string;
  votes: number;
  votesLabel?: string;
  barPct: number;
  accentClass: string;
  isLeader?: boolean;
  pulse?: boolean;
  barAnimateInitial?: boolean;
}

/** Card coppia — font scalati sulla altezza della card (cqh), riempiono l'area senza overflow. */
export function DisplayFinalsCoupleCard({
  index,
  maleNick,
  femaleNick,
  votes,
  votesLabel = "voti",
  barPct,
  accentClass,
  isLeader = false,
  pulse = false,
  barAnimateInitial = false,
}: DisplayFinalsCoupleCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={cn(
        "finals-couple-card relative grid h-full min-h-0 overflow-hidden rounded-[1.5rem] border bg-gradient-to-b",
        "grid-rows-[minmax(0,0.11fr)_minmax(0,0.36fr)_minmax(0,0.53fr)] shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
        accentClass,
        isLeader && "ring-4 ring-primary/65",
        pulse && !reduceMotion && "animate-[pulse_2.4s_ease-in-out_infinite]",
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[1.5rem] bg-black/55 backdrop-blur-sm"
        aria-hidden
      />

      <p
        className="finals-card-coppia relative z-10 flex shrink-0 items-end justify-center font-bold uppercase tracking-[0.24em] text-primary"
        style={{ textShadow: "0 2px 6px rgba(0,0,0,1)" }}
      >
        Coppia {index + 1}
      </p>

      <div className="relative z-10 flex min-h-0 flex-col items-center justify-center gap-[0.1em] text-center overflow-hidden">
        <p
          className="finals-card-name font-display font-bold text-white line-clamp-2"
          style={{
            fontFamily: "var(--font-display), serif",
            textShadow: NAME_SHADOW,
          }}
        >
          {maleNick}
        </p>
        <span
          className="finals-card-amp font-display shrink-0 text-primary font-bold"
          style={{ fontFamily: "var(--font-display), serif" }}
          aria-hidden
        >
          &
        </span>
        <p
          className="finals-card-name font-display font-bold text-white line-clamp-2"
          style={{
            fontFamily: "var(--font-display), serif",
            textShadow: NAME_SHADOW,
          }}
        >
          {femaleNick}
        </p>
      </div>

      <div className="relative z-10 flex min-h-0 flex-col overflow-hidden pt-1.5">
        <div className="finals-card-bar shrink-0 rounded-full bg-black/50 overflow-hidden border border-white/12">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-pink-400 to-primary/80"
            initial={barAnimateInitial ? { width: 0 } : false}
            animate={{ width: `${barPct}%` }}
            transition={
              barAnimateInitial
                ? { type: "spring", stiffness: 140, damping: 20 }
                : { duration: 0.4, ease: "easeOut" }
            }
          />
        </div>

        <div className="finals-card-votes-block flex min-h-0 flex-1 flex-col items-center justify-center gap-[0.1em] py-1.5">
          <span
            className="finals-card-votes-num font-display font-bold tabular-nums text-white"
            style={{
              fontFamily: "var(--font-display), serif",
              textShadow:
                "0 3px 0 rgba(0,0,0,1), 0 0 36px rgba(233,30,140,0.85)",
            }}
          >
            {votes}
          </span>
          <span className="finals-card-votes-label uppercase tracking-[0.2em] text-white/75">
            {votesLabel}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export const FINALS_CARD_ACCENTS = [
  "from-primary/25 via-primary/10 to-transparent border-primary/45",
  "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent border-fuchsia-400/40",
  "from-pink-400/20 via-pink-400/5 to-transparent border-pink-300/35",
] as const;
