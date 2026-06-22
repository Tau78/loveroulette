"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import { DisplayQuizHeart } from "@/components/display/DisplayQuizHeart";
import { cn } from "@/lib/utils";
import {
  QUIZ_FOOTER_BRAND_HEART_CLASS,
  QUIZ_FOOTER_BRAND_LOGO_CLASS,
  QUIZ_FOOTER_COUNTDOWN_DIGIT_CLASS,
  QUIZ_FOOTER_COUNTDOWN_RING_RADIUS,
  QUIZ_FOOTER_COUNTDOWN_SLOT_CLASS,
  QUIZ_FOOTER_COUNTDOWN_VIEWBOX,
  QUIZ_FOOTER_MASK_BAR_CLASS,
  QUIZ_FOOTER_MASK_PATH,
  QUIZ_FOOTER_MASK_VIEWBOX,
  QUIZ_FOOTER_COUNTDOWN_OFFSET_CLASS,
} from "@/lib/display/quiz-footer-metrics";

const LOGO_SRC = "/grafiche/logo-transparent.png";

interface DisplayQuizFooterProps {
  countdown?: {
    value: number;
    total: number;
  } | null;
  /** 0 = bianco, 1 = rosso acceso — progressione serata. */
  heartProgress?: number;
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
  const gradientId = useId().replace(/:/g, "");
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
          <linearGradient id={`countdown-ring-gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
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
          stroke={`url(#countdown-ring-gradient-${gradientId})`}
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

function FooterMaskShape() {
  const { width, height } = QUIZ_FOOTER_MASK_VIEWBOX;

  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="quiz-footer-fill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(18,8,16,0.72)" />
          <stop offset="100%" stopColor="rgba(8,4,10,0.88)" />
        </linearGradient>
        <linearGradient id="quiz-footer-rim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="18%" stopColor="rgba(236,72,153,0.22)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="82%" stopColor="rgba(236,72,153,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
        </linearGradient>
        <filter id="quiz-footer-glow" x="-20%" y="-40%" width="140%" height="180%">
          <feDropShadow
            dx="0"
            dy="-4"
            stdDeviation="8"
            floodColor="rgba(236,72,153,0.25)"
          />
        </filter>
      </defs>
      <path
        d={QUIZ_FOOTER_MASK_PATH}
        fill="url(#quiz-footer-fill)"
        filter="url(#quiz-footer-glow)"
      />
      <path
        d={QUIZ_FOOTER_MASK_PATH}
        fill="none"
        stroke="url(#quiz-footer-rim)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Maschera unificata: cuore · countdown · logo Love Roulette. */
export function DisplayQuizFooter({
  countdown = null,
  heartProgress = 1,
  className,
}: DisplayQuizFooterProps) {
  return (
    <footer
      className={cn(
        "relative z-20 w-full shrink-0 px-10 pb-3 pt-[52px]",
        className,
      )}
    >
      <div className={cn(QUIZ_FOOTER_MASK_BAR_CLASS, "relative w-full")}>
        <FooterMaskShape />

        <div className="relative z-10 flex h-full items-end justify-between">
          <div className="relative z-20 flex shrink-0 items-end pb-2">
            <DisplayQuizHeart
              variant="inline"
              progress={heartProgress}
              className={QUIZ_FOOTER_BRAND_HEART_CLASS}
            />
          </div>

          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-1/2 z-20 -translate-x-1/2",
              QUIZ_FOOTER_COUNTDOWN_OFFSET_CLASS,
            )}
          >
            {countdown ? (
              <FooterCountdown value={countdown.value} total={countdown.total} />
            ) : (
              <span className="sr-only">Timer non attivo</span>
            )}
          </div>

          <div className="relative z-20 flex shrink-0 items-end pb-2">
            <Image
              src={LOGO_SRC}
              alt=""
              width={312}
              height={137}
              className={QUIZ_FOOTER_BRAND_LOGO_CLASS}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
