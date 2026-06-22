"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
import { DisplayFinalsSafeStage } from "@/components/display/DisplayFinalsSafeStage";

interface DisplayFinalsVotePrepStageProps {
  remaining: number;
}

export function DisplayFinalsVotePrepStage({
  remaining,
}: DisplayFinalsVotePrepStageProps) {
  const reduceMotion = useReducedMotion();
  const seconds = Math.max(0, remaining);

  return (
    <DisplayFinalsSafeStage className="relative min-h-0 flex-1 px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2vh,1.5rem)]">
      {!reduceMotion ? (
        <>
          {[0, 1].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[min(72vh,620px)] w-[min(88vw,980px)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-2 border-primary/25"
              initial={{ scale: 0.88, opacity: 0.5 }}
              animate={{ scale: 1.06, opacity: 0 }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: ring * 0.85,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
        </>
      ) : null}

      <div className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[2rem] border border-primary/35 bg-gradient-to-b from-black/92 via-black/88 to-black/92 px-[clamp(1.25rem,3.5vw,3rem)] py-[clamp(1rem,2.5vh,2rem)] shadow-[0_0_72px_rgba(233,30,140,0.35),0_20px_56px_rgba(0,0,0,0.6)]">
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-primary/10 via-transparent to-primary/8"
          aria-hidden
        />

        <div className="relative z-10 grid h-full min-h-0 grid-rows-[minmax(0,0.3fr)_minmax(0,0.24fr)_minmax(0,0.46fr)] gap-[clamp(0.35rem,1.2vh,0.9rem)] text-center">
          <div className="flex min-h-0 items-end justify-center overflow-hidden pb-[clamp(0.25rem,0.8vh,0.5rem)]">
            <motion.p
              className="font-display max-w-full font-bold uppercase leading-[1.02] tracking-wide text-white line-clamp-2 text-[clamp(2rem,min(5.5vh,6vw),4.5rem)]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow:
                  "0 4px 0 rgba(0,0,0,1), 0 0 48px rgba(233,30,140,0.85)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              {FINALS_COPY.displayVotePrepHeadline}
            </motion.p>
          </div>

          <div className="flex min-h-0 items-center justify-center overflow-hidden">
            <motion.p
              className="font-display max-w-full font-bold uppercase leading-[1.05] tracking-[0.08em] text-primary line-clamp-2 text-[clamp(1.5rem,min(4.2vh,4.5vw),3.25rem)]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow:
                  "0 3px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.75)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
            >
              {FINALS_COPY.displayVotePrepSubline}
            </motion.p>
          </div>

          <div className="flex min-h-0 items-center justify-center overflow-hidden">
            <motion.div
              className="font-display flex max-h-full max-w-full items-center justify-center font-bold tabular-nums leading-none text-primary text-[clamp(5rem,min(26vh,20vw),13rem)]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow:
                  "0 6px 0 rgba(0,0,0,1), 0 0 64px rgba(233,30,140,0.95), 0 0 120px rgba(233,30,140,0.35)",
              }}
              key={seconds}
              initial={reduceMotion ? false : { scale: 1.12, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              aria-live="polite"
              aria-label={`${seconds} secondi alla votazione`}
            >
              {seconds}
            </motion.div>
          </div>
        </div>
      </div>
    </DisplayFinalsSafeStage>
  );
}
