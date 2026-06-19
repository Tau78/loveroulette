"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISPLAY_FLOATING_HEART_CLASS } from "@/lib/display/display-brand-metrics";

const HEART_RED = "#ef4444";

interface DisplayQuizHeartProps {
  className?: string;
  /** floating = angolo basso-sinistra sullo sfondo. */
  variant?: "floating" | "inline";
  size?: "default" | "compact";
}

export function DisplayQuizHeart({
  className,
  variant = "floating",
  size = "default",
}: DisplayQuizHeartProps) {
  const reduceMotion = useReducedMotion();
  const compact = size === "compact";

  return (
    <motion.div
      className={cn(
        "pointer-events-none",
        variant === "floating" &&
          "absolute bottom-4 left-4 z-[8] md:bottom-6 md:left-6",
        className,
      )}
      aria-hidden
      animate={
        reduceMotion
          ? undefined
          : {
              scale: [1, 1.1, 1],
              opacity: [0.78, 1, 0.78],
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
    >
      <Heart
        className={cn(
          "fill-[#ef4444] text-[#ef4444]",
          compact ? "size-8" : DISPLAY_FLOATING_HEART_CLASS,
        )}
        style={{
          color: HEART_RED,
          filter:
            "drop-shadow(0 0 18px rgba(239,68,68,0.7)) drop-shadow(0 0 36px rgba(233,30,140,0.45))",
        }}
      />
    </motion.div>
  );
}
