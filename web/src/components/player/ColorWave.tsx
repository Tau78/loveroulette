"use client";

import { motion, useReducedMotion } from "framer-motion";

export type WaveMode = "idle" | "spin" | "reveal" | "celebration";

interface ColorWaveProps {
  mode: WaveMode;
  className?: string;
}

const MODE_CONFIG: Record<
  WaveMode,
  { speed: number; opacity: number; scale: number }
> = {
  idle: { speed: 8, opacity: 0.35, scale: 1 },
  spin: { speed: 2.5, opacity: 0.55, scale: 1.08 },
  reveal: { speed: 4, opacity: 0.7, scale: 1.12 },
  celebration: { speed: 3, opacity: 0.85, scale: 1.15 },
};

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
          className="absolute inset-0 opacity-30"
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
        className="absolute -inset-[40%] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--wave-accent) 0%, var(--wave-glow) 45%, transparent 70%)",
        }}
        animate={{
          scale: [1, config.scale, 1],
          opacity: [config.opacity * 0.6, config.opacity, config.opacity * 0.6],
          x: ["-5%", "5%", "-5%"],
          y: ["-3%", "3%", "-3%"],
        }}
        transition={{
          duration: config.speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -inset-[30%] rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, var(--wave-secondary) 0%, transparent 60%)",
        }}
        animate={{
          scale: [config.scale, 1, config.scale],
          opacity: [config.opacity * 0.4, config.opacity * 0.7, config.opacity * 0.4],
          x: ["8%", "-8%", "8%"],
          y: ["5%", "-5%", "5%"],
        }}
        transition={{
          duration: config.speed * 1.3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
