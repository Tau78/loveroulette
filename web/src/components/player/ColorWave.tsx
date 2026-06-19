"use client";

import { motion, useReducedMotion } from "framer-motion";

export type WaveMode = "idle" | "pulse" | "spin" | "reveal" | "celebration";

interface ColorWaveProps {
  mode: WaveMode;
  className?: string;
}

const MODE_CONFIG: Record<
  WaveMode,
  { speed: number; opacity: number; scale: number }
> = {
  idle: { speed: 8, opacity: 0.4, scale: 1 },
  pulse: { speed: 4.5, opacity: 0.72, scale: 1.12 },
  spin: { speed: 2.5, opacity: 0.58, scale: 1.1 },
  reveal: { speed: 4, opacity: 0.75, scale: 1.14 },
  celebration: { speed: 3, opacity: 0.9, scale: 1.18 },
};

const SPARKLE_POSITIONS = [
  { left: "12%", top: "18%", delay: 0 },
  { left: "78%", top: "22%", delay: 0.4 },
  { left: "24%", top: "62%", delay: 0.8 },
  { left: "86%", top: "58%", delay: 1.1 },
  { left: "50%", top: "38%", delay: 0.6 },
  { left: "68%", top: "78%", delay: 1.4 },
];

export function ColorWave({ mode, className = "" }: ColorWaveProps) {
  const reduceMotion = useReducedMotion();
  const config = MODE_CONFIG[mode];

  if (reduceMotion) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, var(--wave-accent) 0%, transparent 65%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <motion.div
        className="absolute -inset-[45%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--wave-accent) 0%, var(--wave-glow) 40%, transparent 72%)",
        }}
        animate={{
          scale: [1, config.scale, 1],
          opacity: [config.opacity * 0.55, config.opacity, config.opacity * 0.55],
          x: ["-6%", "6%", "-6%"],
          y: ["-4%", "4%", "-4%"],
        }}
        transition={{
          duration: config.speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -inset-[32%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, var(--wave-secondary) 0%, transparent 62%)",
        }}
        animate={{
          scale: [config.scale, 1, config.scale],
          opacity: [config.opacity * 0.35, config.opacity * 0.75, config.opacity * 0.35],
          x: ["10%", "-10%", "10%"],
          y: ["6%", "-6%", "6%"],
        }}
        transition={{
          duration: config.speed * 1.25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 blur-3xl"
        style={{
          background:
            "linear-gradient(to top, rgba(236,72,153,0.22) 0%, transparent 100%)",
        }}
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: config.speed * 0.9, repeat: Infinity }}
      />

      {SPARKLE_POSITIONS.map((pos, index) => (
        <motion.span
          key={index}
          className="absolute size-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(236,72,153,0.9)]"
          style={{ left: pos.left, top: pos.top }}
          animate={{
            opacity: [0.15, 0.95, 0.15],
            scale: [0.6, 1.4, 0.6],
          }}
          transition={{
            duration: 2.2 + index * 0.15,
            repeat: Infinity,
            delay: pos.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
