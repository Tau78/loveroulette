"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { STACCO_CANVAS_SRC } from "@/lib/display/stacco";
import { cn } from "@/lib/utils";

const EASE_ZOOM = [0.16, 1, 0.3, 1] as const;
const EASE_BURST = [0.18, 0.85, 0.25, 1] as const;

const BURST = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2 + 0.15;
  const dist = 220 + (i % 5) * 48;
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
    heart: i % 4 === 0,
    gold: i % 3 === 1,
  };
});

const SHARDS = [
  { x: -220, y: -140, r: -28 },
  { x: 240, y: -110, r: 24 },
  { x: -160, y: 180, r: 16 },
  { x: 190, y: 200, r: -22 },
  { x: 0, y: -240, r: 8 },
  { x: 40, y: 260, r: -12 },
] as const;

type DisplayStaccoStageProps = {
  value: number;
  className?: string;
};

/** Stacco 5–4–3–2–1: canvas di scena + cifra che zoomma dal fondo ed esplode. */
export function DisplayStaccoStage({ value, className }: DisplayStaccoStageProps) {
  const reduce = useReducedMotion();

  return (
    <div
      className={cn("absolute inset-0 z-[2] overflow-hidden", className)}
      aria-live="polite"
      aria-label={`${value} secondi al via`}
    >
      <StaccoCanvas />
      <div className="absolute inset-0 grid place-items-center">
        <AnimatePresence>
          <StaccoDigit key={value} value={value} reduce={Boolean(reduce)} />
        </AnimatePresence>
      </div>
    </div>
  );
}

function StaccoCanvas() {
  const [hasStill, setHasStill] = useState(true);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[#120308]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(233,30,140,0.28) 0%, transparent 62%), radial-gradient(ellipse 45% 35% at 18% 20%, rgba(201,169,110,0.16) 0%, transparent 55%), radial-gradient(ellipse 40% 30% at 82% 78%, rgba(255,71,87,0.18) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 22% 30%, rgba(233,30,140,0.35) 0 3px, transparent 4px), radial-gradient(circle at 78% 24%, rgba(245,200,75,0.28) 0 2px, transparent 3px), radial-gradient(circle at 64% 72%, rgba(233,30,140,0.3) 0 2px, transparent 3px), radial-gradient(circle at 36% 78%, rgba(255,255,255,0.18) 0 2px, transparent 3px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 42% 38% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {hasStill ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STACCO_CANVAS_SRC}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setHasStill(false)}
        />
      ) : null}
    </div>
  );
}

function StaccoDigit({
  value,
  reduce,
}: {
  value: number;
  reduce: boolean;
}) {
  const digitClass =
    "font-sans font-black tabular-nums leading-none text-white text-[min(42vw,384px)]";
  const digitShadow = {
    textShadow:
      "0 0 28px rgba(233,30,140,0.55), 0 3px 0 rgba(0,0,0,1), 0 8px 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.75)",
  };

  return (
    <motion.div
      className="relative grid place-items-center"
      initial="hidden"
      animate="show"
      exit="leave"
      variants={{
        hidden: {},
        show: {},
        leave: { transition: { duration: 0.42, when: "afterChildren" } },
      }}
    >
      <div
        className="pointer-events-none absolute size-[min(70vw,720px)] rounded-full bg-black/55 blur-3xl"
        aria-hidden
      />

      {!reduce ? <StaccoBurst /> : null}

      <motion.span
        className={cn("relative z-10", digitClass)}
        style={digitShadow}
        variants={
          reduce
            ? {
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.16 } },
                leave: { opacity: 0, transition: { duration: 0.14 } },
              }
            : {
                hidden: { opacity: 0, scale: 0.12, filter: "blur(18px)" },
                show: {
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { duration: 0.28, ease: EASE_ZOOM },
                },
                leave: {
                  opacity: 0,
                  scale: 1.75,
                  filter: "blur(10px)",
                  transition: { duration: 0.38, ease: [0.4, 0, 1, 1] },
                },
              }
        }
      >
        {value}
      </motion.span>

      {!reduce
        ? SHARDS.map((shard, i) => (
            <motion.span
              key={i}
              className={cn(
                "pointer-events-none absolute z-20",
                digitClass,
              )}
              style={digitShadow}
              variants={{
                hidden: { opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 },
                show: { opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 },
                leave: {
                  opacity: [0, 0.85, 0],
                  scale: [1, 0.7, 0.25],
                  x: shard.x,
                  y: shard.y,
                  rotate: shard.r,
                  transition: { duration: 0.42, ease: EASE_BURST },
                },
              }}
            >
              {value}
            </motion.span>
          ))
        : null}
    </motion.div>
  );
}

function StaccoBurst() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-0"
      variants={{ hidden: {}, show: {}, leave: {} }}
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-1/2 size-[min(80vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl"
        variants={{
          hidden: { opacity: 0, scale: 0.15 },
          show: { opacity: 0, scale: 0.15 },
          leave: {
            opacity: [0.9, 0],
            scale: [0.2, 2.1],
            transition: { duration: 0.3, ease: "easeOut" },
          },
        }}
      />
      {[0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 size-[min(50vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/80"
          variants={{
            hidden: { opacity: 0, scale: 0.2 },
            show: { opacity: 0, scale: 0.2 },
            leave: {
              opacity: [0.95, 0],
              scale: [0.3, 2.6 + ring * 0.45],
              transition: {
                duration: 0.44,
                delay: ring * 0.05,
                ease: "easeOut",
              },
            },
          }}
        />
      ))}
      {BURST.map((spark, i) => (
        <motion.span
          key={i}
          className={cn(
            "absolute left-1/2 top-1/2 -ml-2 -mt-2 font-display leading-none",
            spark.heart ? "text-4xl" : "size-3 rounded-full",
            spark.heart
              ? spark.gold
                ? "text-[#f5c84b]"
                : "text-primary"
              : spark.gold
                ? "bg-[#f5c84b]"
                : "bg-primary",
          )}
          style={{
            textShadow: spark.heart
              ? "0 0 18px rgba(233,30,140,0.9)"
              : undefined,
            boxShadow: spark.heart
              ? undefined
              : "0 0 16px rgba(233,30,140,0.75)",
          }}
          variants={{
            hidden: { opacity: 0, scale: 0, x: 0, y: 0 },
            show: { opacity: 0, scale: 0, x: 0, y: 0 },
            leave: {
              opacity: [0, 1, 0],
              scale: [0.25, 1.25, 0.1],
              x: spark.x,
              y: spark.y,
              transition: { duration: 0.46, ease: EASE_BURST },
            },
          }}
        >
          {spark.heart ? "♥" : null}
        </motion.span>
      ))}
    </motion.div>
  );
}
