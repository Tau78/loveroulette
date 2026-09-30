"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISPLAY_BRAND_CORNER_POSITION, DISPLAY_FLOATING_HEART_CLASS } from "@/lib/display/display-brand-metrics";
import { heartColorAtProgress } from "@/lib/display/evening-heart-progress";

interface DisplayQuizHeartProps {
  className?: string;
  /** floating = angolo (legacy). inline = integrato nel footer quiz. */
  variant?: "floating" | "inline";
  size?: "default" | "compact";
  /** 0 = bianco (inizio serata), 1 = rosso acceso. */
  progress?: number;
}

export function DisplayQuizHeart({
  className,
  variant = "floating",
  size = "default",
  progress = 1,
}: DisplayQuizHeartProps) {
  const reduceMotion = useReducedMotion();
  const compact = size === "compact";
  const { fill, glow } = heartColorAtProgress(progress);

  return (
    <motion.div
      className={cn(
        "pointer-events-none",
        variant === "floating" && DISPLAY_BRAND_CORNER_POSITION.heart,
        variant === "inline" && "relative",
        className,
      )}
      aria-hidden
      animate={
        reduceMotion
          ? undefined
          : {
              scale: [1, 1.08 + progress * 0.04, 1],
              opacity: [0.82 + progress * 0.1, 1, 0.82 + progress * 0.1],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 1.9,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      style={
        variant === "floating" || variant === "inline"
          ? { transformOrigin: "50% 100%" }
          : undefined
      }
    >
      <Heart
        className={cn(
          "size-full",
          variant === "inline"
            ? "size-full"
            : compact
              ? "size-8"
              : DISPLAY_FLOATING_HEART_CLASS,
        )}
        style={{
          color: fill,
          fill,
          filter: glow,
        }}
      />
    </motion.div>
  );
}
