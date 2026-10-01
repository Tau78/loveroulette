"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { heartColorAtProgress } from "@/lib/display/evening-heart-progress";

const AVATAR_M = "/grafiche/avatar-m.png";
const AVATAR_F = "/grafiche/avatar-f.png";

function affinityProgress(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(1, Math.max(0, score / 100));
}

function pulseDurationSec(progress: number): number {
  return 2.6 - progress * 2.1;
}

interface DisplayCoupleRevealHeartProps {
  affinityScore: number;
  className?: string;
}

export function DisplayCoupleRevealHeart({
  affinityScore,
  className,
}: DisplayCoupleRevealHeartProps) {
  const reduceMotion = useReducedMotion();
  const progress = affinityProgress(affinityScore);
  const { fill, glow } = heartColorAtProgress(progress);
  const pulseSec = pulseDurationSec(progress);
  const showConfetti = progress >= 0.55 && !reduceMotion;
  const showFire = progress >= 0.88 && !reduceMotion;

  const confetti = useMemo(() => {
    if (!showConfetti) return [];
    const count = 8 + Math.floor(progress * 10);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 220,
      delay: (i % 5) * 0.22,
      size: 10 + Math.random() * 14,
      duration: 1.4 + Math.random() * 0.8,
    }));
  }, [showConfetti, progress]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-end pb-2",
        className,
      )}
      aria-hidden
    >
      {showFire ? (
        <motion.div
          className="pointer-events-none absolute bottom-[52%] left-1/2 h-24 w-32 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0.5, 0.95, 0.55],
            scale: [0.85, 1.15, 0.9],
          }}
          transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-x-4 bottom-0 h-16 rounded-full bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200 blur-md opacity-90" />
          <div className="absolute inset-x-8 bottom-2 h-10 rounded-full bg-gradient-to-t from-red-600 to-orange-300 blur-sm" />
        </motion.div>
      ) : null}

      {showConfetti
        ? confetti.map((piece) => (
            <motion.span
              key={piece.id}
              className="pointer-events-none absolute bottom-[38%] text-primary"
              style={{ fontSize: piece.size }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
              animate={{
                opacity: [0, 1, 0],
                x: piece.x,
                y: [-20, -90 - progress * 40],
                rotate: piece.x > 0 ? 25 : -25,
              }}
              transition={{
                duration: piece.duration,
                repeat: Infinity,
                delay: piece.delay,
                ease: "easeOut",
              }}
            >
              ♥
            </motion.span>
          ))
        : null}

      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.06 + progress * 0.14, 1],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: pulseSec,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
        style={{ transformOrigin: "50% 100%" }}
      >
        <Heart
          className="size-[clamp(72px,12vh,120px)]"
          style={{
            color: fill,
            fill,
            filter: glow,
          }}
        />
      </motion.div>
    </div>
  );
}

export function coupleRevealPlayerPhoto(
  photoUrl: string | undefined,
  genderFallback: "M" | "F",
): string {
  if (photoUrl?.trim()) return photoUrl.trim();
  return genderFallback === "F" ? AVATAR_F : AVATAR_M;
}
