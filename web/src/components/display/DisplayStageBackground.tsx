"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { QUIZ_PHASE_BACKGROUNDS } from "@/lib/display/quiz-phase-backgrounds";
import {
  DISPLAY_BRAND_CORNER_POSITION,
  DISPLAY_COMPACT_LOGO_CLASS,
  DISPLAY_COMPACT_LOGO_EMBED_CLASS,
} from "@/lib/display/display-brand-metrics";
import { DisplayQuizPhaseOverlay } from "@/components/display/DisplayQuizPhaseOverlay";
import { DisplayQuizHeart } from "@/components/display/DisplayQuizHeart";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/grafiche/video/sfondo-animato.mp4";
const LOGO_SRC = "/grafiche/logo-transparent.png";

export type DisplayLogoScale = "full" | "compact";

type DisplayStageBackgroundProps = {
  logoScale?: DisplayLogoScale;
  /** Iframe preview: avoid vw-based sizing that shifts with scrollbars. */
  stableLayout?: boolean;
  /** Fase quiz attiva — sottofondo, cuore basso-sinistra. */
  quizPhase?: QuizDisplayPhase | null;
};

export function DisplayStageBackground({
  logoScale = "full",
  stableLayout = false,
  quizPhase = null,
}: DisplayStageBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const phaseConfig = quizPhase ? QUIZ_PHASE_BACKGROUNDS[quizPhase] : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    video.muted = true;
    const play = () => {
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [reduceMotion]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0D0D12]"
      aria-hidden
    >
      {reduceMotion ? (
        <div
          className="absolute inset-0 transition-colors duration-500"
          style={{
            background: phaseConfig?.base ?? "#1a0308",
          }}
        />
      ) : (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: phaseConfig?.videoOpacity ?? 0.55 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        </motion.div>
      )}

      {quizPhase ? <DisplayQuizPhaseOverlay phase={quizPhase} /> : (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />
        </>
      )}

      {/* Ruota — grande, centrata, rotazione lenta */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex items-center justify-center"
          animate={
            reduceMotion
              ? { opacity: phaseConfig?.rouletteOpacity ?? 0.78 }
              : {
                  rotate: 360,
                  opacity: phaseConfig?.rouletteOpacity ?? 0.78,
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.5 }
              : {
                  rotate: {
                    duration: phaseConfig?.rouletteDuration ?? 28,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  opacity: { duration: 0.6, ease: "easeInOut" },
                }
          }
        >
          <Image
            src="/grafiche/roulette.png"
            alt=""
            width={900}
            height={900}
            priority
            className={cn(
              "h-auto max-h-[78vh] object-contain mix-blend-screen drop-shadow-[0_20px_60px_rgba(233,30,140,0.35)] transition-opacity duration-500",
              stableLayout ? "w-[min(90%,880px)]" : "w-[min(78vw,880px)]",
            )}
          />
        </motion.div>
      </div>

      {quizPhase ? (
        <DisplayQuizHeart
          variant="floating"
          className={DISPLAY_BRAND_CORNER_POSITION.heart}
        />
      ) : null}

      <div className={DISPLAY_BRAND_CORNER_POSITION.logo}>
        <Image
          src={LOGO_SRC}
          alt="Love Roulette"
          width={320}
          height={140}
          priority
          className={cn(
            "h-auto object-contain transition-[width] duration-500 ease-in-out",
            logoScale === "compact"
              ? stableLayout
                ? DISPLAY_COMPACT_LOGO_EMBED_CLASS
                : DISPLAY_COMPACT_LOGO_CLASS
              : stableLayout
                ? "w-64"
                : "w-[min(28vw,320px)]",
            logoScale === "full" &&
              "drop-shadow-[0_8px_32px_rgba(233,30,140,0.55)]",
          )}
        />
      </div>
    </div>
  );
}
