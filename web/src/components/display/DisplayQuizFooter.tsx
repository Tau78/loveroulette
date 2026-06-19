"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  QUIZ_FOOTER_BAR_CLASS,
  QUIZ_FOOTER_COUNTDOWN_DIGIT_CLASS,
  QUIZ_FOOTER_COUNTDOWN_RING_RADIUS,
  QUIZ_FOOTER_COUNTDOWN_SLOT_CLASS,
  QUIZ_FOOTER_COUNTDOWN_VIEWBOX,
} from "@/lib/display/quiz-footer-metrics";

interface DisplayQuizFooterProps {
  countdown?: {
    value: number;
    total: number;
  } | null;
  className?: string;
}

function FooterCountdown({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  const reduceMotion = useReducedMotion();
  const prevValueRef = useRef(value);
  const ticked = prevValueRef.current !== value;

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const progress = total > 0 ? (total - value) / total : 0;
  const r = QUIZ_FOOTER_COUNTDOWN_RING_RADIUS;
  const circumference = 2 * Math.PI * r;
  const urgent = value <= 5;
  const critical = value <= 3;
  const center = QUIZ_FOOTER_COUNTDOWN_VIEWBOX / 2;

  return (
    <div
      className={cn(QUIZ_FOOTER_COUNTDOWN_SLOT_CLASS, "relative overflow-visible")}
      aria-live="polite"
      aria-label={`${value} secondi`}
    >
      {!reduceMotion ? (
        <motion.span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full",
            urgent
              ? "bg-primary/35 shadow-[0_0_24px_rgba(236,72,153,0.65)]"
              : "bg-primary/15 shadow-[0_0_18px_rgba(236,72,153,0.35)]",
          )}
          animate={
            urgent
              ? { opacity: [0.45, 0.95, 0.45], scale: [0.92, 1.08, 0.92] }
              : { opacity: [0.35, 0.65, 0.35], scale: [0.96, 1.04, 0.96] }
          }
          transition={{
            duration: urgent ? 0.75 : 1.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-hidden
        />
      ) : null}

      <svg
        className="absolute inset-0 size-full -rotate-90"
        viewBox={`0 0 ${QUIZ_FOOTER_COUNTDOWN_VIEWBOX} ${QUIZ_FOOTER_COUNTDOWN_VIEWBOX}`}
        aria-hidden
      >
        <defs>
          <linearGradient id="countdown-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(244, 114, 182)" />
            <stop offset="50%" stopColor="rgb(236, 72, 153)" />
            <stop offset="100%" stopColor="rgb(219, 39, 119)" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="3"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#countdown-ring-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
          style={{
            filter: urgent
              ? "drop-shadow(0 0 10px rgba(236,72,153,0.9))"
              : "drop-shadow(0 0 8px rgba(236,72,153,0.5))",
          }}
        />
      </svg>

      <motion.span
        key={value}
        className={cn(
          QUIZ_FOOTER_COUNTDOWN_DIGIT_CLASS,
          urgent && "text-primary",
          critical && "drop-shadow-[0_0_12px_rgba(236,72,153,0.95)]",
        )}
        initial={
          reduceMotion
            ? false
            : { scale: ticked ? 1.28 : 1, opacity: ticked ? 0.7 : 1 }
        }
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: urgent ? 520 : 380,
          damping: urgent ? 14 : 18,
        }}
      >
        {value}
      </motion.span>

      {!reduceMotion && ticked ? (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary/70"
          initial={{ scale: 0.85, opacity: 0.85 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

/** Solo countdown — cuore e logo sono sullo sfondo (angoli bassi). */
export function DisplayQuizFooter({
  countdown = null,
  className,
}: DisplayQuizFooterProps) {
  return (
    <footer className={cn("relative z-10 shrink-0 px-3 pb-2 md:px-6 md:pb-3", className)}>
      <div className={QUIZ_FOOTER_BAR_CLASS}>
        {countdown ? (
          <FooterCountdown value={countdown.value} total={countdown.total} />
        ) : (
          <span className="sr-only">Timer non attivo</span>
        )}
      </div>
    </footer>
  );
}
