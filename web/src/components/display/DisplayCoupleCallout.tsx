"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DisplayCoupleCalloutProps {
  kicker: string;
  maleNick: string;
  femaleNick: string;
  actionLabel?: string;
  footerLabel?: string;
  className?: string;
}

const NAME_SHADOW =
  "0 4px 0 rgba(0,0,0,1), 0 0 64px rgba(233,30,140,0.95), 0 8px 32px rgba(0,0,0,0.92)";

/** Callout coppia chiamata in sala — piastra orizzontale compatta, nomi al centro. */
export function DisplayCoupleCallout({
  kicker,
  maleNick,
  femaleNick,
  actionLabel,
  footerLabel,
  className,
}: DisplayCoupleCalloutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative w-full max-w-6xl text-center",
        className,
      )}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      {!reduceMotion ? (
        <>
          {[0, 1].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[min(42vh,320px)] w-[min(92vw,980px)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-2 border-primary/30"
              initial={{ scale: 0.85, opacity: 0.55 }}
              animate={{ scale: 1.08, opacity: 0 }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: ring * 0.65,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
        </>
      ) : null}

      <div className="relative overflow-hidden rounded-[2rem] border border-primary/45 bg-gradient-to-b from-black/92 via-black/88 to-black/92 px-[clamp(1.5rem,4vw,3rem)] py-[clamp(1.25rem,3vh,2rem)] shadow-[0_0_80px_rgba(233,30,140,0.4),0_24px_64px_rgba(0,0,0,0.65)]">
        <div
          className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-primary/12 via-transparent to-primary/8"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center gap-[clamp(0.75rem,2vh,1.25rem)]">
          <div className="flex flex-col items-center gap-2">
            <motion.p
              className="font-display shrink-0 font-bold uppercase text-primary line-clamp-2 text-[clamp(1.25rem,3.2vh,2.25rem)] tracking-[0.12em]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow:
                  "0 3px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.85)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.35 }}
            >
              {kicker}
            </motion.p>

            {actionLabel ? (
              <motion.p
                className="shrink-0 font-bold uppercase tracking-[0.22em] text-white/90 line-clamp-2 text-[clamp(0.95rem,2.2vh,1.5rem)]"
                style={{
                  textShadow:
                    "0 2px 0 rgba(0,0,0,1), 0 0 24px rgba(233,30,140,0.55)",
                }}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {actionLabel}
              </motion.p>
            ) : null}
          </div>

          <motion.p
            className="shrink-0 font-semibold uppercase tracking-[0.28em] text-primary/95 text-[clamp(0.75rem,1.6vh,1rem)]"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.3 }}
          >
            In sala
          </motion.p>

          <div className="flex w-full flex-col items-center justify-center gap-[clamp(0.15rem,0.8vh,0.5rem)]">
            <motion.p
              className="font-display font-bold uppercase text-white leading-[0.95] line-clamp-2 text-[clamp(2.75rem,min(9vh,11vw),6.5rem)]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow: NAME_SHADOW,
              }}
              initial={reduceMotion ? false : { opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.14,
                type: "spring",
                stiffness: 180,
                damping: 16,
              }}
            >
              {maleNick}
            </motion.p>

            <motion.span
              className="font-display shrink-0 text-primary font-bold text-[clamp(1.5rem,4vh,3rem)]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow:
                  "0 3px 0 rgba(0,0,0,1), 0 0 32px rgba(233,30,140,0.85)",
              }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.22,
                type: "spring",
                stiffness: 300,
                damping: 14,
              }}
              aria-hidden
            >
              &
            </motion.span>

            <motion.p
              className="font-display font-bold uppercase text-white leading-[0.95] line-clamp-2 text-[clamp(2.75rem,min(9vh,11vw),6.5rem)]"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow: NAME_SHADOW,
              }}
              initial={reduceMotion ? false : { opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.28,
                type: "spring",
                stiffness: 180,
                damping: 16,
              }}
            >
              {femaleNick}
            </motion.p>
          </div>

          {footerLabel ? (
            <motion.p
              className="shrink-0 font-semibold text-white/85 tabular-nums uppercase tracking-[0.14em] line-clamp-1 text-[clamp(0.85rem,1.8vh,1.25rem)]"
              style={{
                textShadow: "0 2px 0 rgba(0,0,0,1), 0 2px 12px rgba(0,0,0,0.95)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.35 }}
            >
              {footerLabel}
            </motion.p>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
