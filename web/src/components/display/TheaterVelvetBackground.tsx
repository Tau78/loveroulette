"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Velvet curtain folds — visible red, soft motion, non-repetitive timing. */
const CURTAIN_FOLDS = [
  { dur: 19, delay: 0, skew: 0.55, drift: 5, x: 0 },
  { dur: 24, delay: 2.1, skew: -0.45, drift: -4, x: 1 },
  { dur: 21, delay: 4.3, skew: 0.35, drift: 6, x: 2 },
  { dur: 27, delay: 1.4, skew: -0.5, drift: -5, x: 3 },
  { dur: 22, delay: 3.8, skew: 0.4, drift: 4, x: 4 },
  { dur: 29, delay: 5.6, skew: -0.38, drift: -6, x: 5 },
  { dur: 25, delay: 2.9, skew: 0.48, drift: 5, x: 6 },
] as const;

export function TheaterVelvetBackground() {
  const reduceMotion = useReducedMotion();
  const folds = useMemo(() => CURTAIN_FOLDS, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a0206]"
      aria-hidden
    >
      {/* Base — deep burgundy stage */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 65% at 50% 105%, rgba(72, 8, 22, 0.55) 0%, transparent 50%),
            radial-gradient(ellipse 70% 45% at 50% -5%, rgba(48, 6, 16, 0.4) 0%, transparent 45%),
            linear-gradient(180deg, #0f0308 0%, #1a0610 40%, #120408 100%)
          `,
        }}
      />

      {/* Curtain folds — medium visibility, light blur */}
      <div className="absolute inset-0 flex">
        {folds.map((fold, i) => {
          const light = i % 2 === 0;
          return (
            <motion.div
              key={i}
              className="relative h-full flex-1 origin-top"
              style={{
                background: light
                  ? `linear-gradient(90deg,
                      rgba(28, 4, 10, 0.92) 0%,
                      rgba(58, 8, 20, 0.85) 20%,
                      rgba(95, 14, 32, 0.55) 48%,
                      rgba(52, 8, 18, 0.82) 75%,
                      rgba(22, 3, 8, 0.95) 100%)`
                  : `linear-gradient(90deg,
                      rgba(18, 2, 6, 0.96) 0%,
                      rgba(42, 6, 14, 0.88) 28%,
                      rgba(78, 12, 26, 0.5) 52%,
                      rgba(38, 5, 12, 0.9) 78%,
                      rgba(15, 2, 5, 1) 100%)`,
                boxShadow: light
                  ? "inset -10px 0 28px rgba(0,0,0,0.5), inset 6px 0 14px rgba(180,40,70,0.04)"
                  : "inset -6px 0 22px rgba(0,0,0,0.55)",
              }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      skewX: [
                        0,
                        fold.skew,
                        -fold.skew * 0.4,
                        fold.skew * 0.6,
                        0,
                      ],
                      x: [0, fold.drift, -fold.drift * 0.5, fold.drift * 0.3, 0],
                      scaleY: [1, 1.006, 1.003, 1.008, 1],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: fold.dur,
                      delay: fold.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                      times: [0, 0.25, 0.5, 0.75, 1],
                    }
              }
            />
          );
        })}
      </div>

      {/* Slow ambient drift — breaks sync between folds */}
      {!reduceMotion && (
        <motion.div
          className="absolute inset-[-15%] opacity-[0.22] blur-[60px]"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 35% 55%, rgba(120, 18, 38, 0.5) 0%, transparent 65%)",
          }}
          animate={{
            x: ["-2%", "3%", "-1%", "2%", "-2%"],
            y: ["-1%", "2%", "1%", "-2%", "-1%"],
          }}
          transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Top pelmet shadow */}
      <div
        className="absolute inset-x-0 top-0 h-[7vh] min-h-[40px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(20,4,10,0.35) 65%, transparent 100%)",
        }}
      />

      {/* Vignette — softer center for logo/QR */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 45% at 50% 50%, transparent 0%, rgba(0,0,0,0.42) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.35) 100%)
          `,
        }}
      />
    </div>
  );
}
