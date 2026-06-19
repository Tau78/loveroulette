"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { QUIZ_PHASE_BACKGROUNDS } from "@/lib/display/quiz-phase-backgrounds";
import { DISPLAY_BRAND_CORNER_POSITION } from "@/lib/display/display-brand-metrics";
import {
  PROJECTOR_LOBBY_LOGO_CLASS,
  PROJECTOR_LOBBY_LOGO_FULL_CLASS,
  PROJECTOR_ROULETTE_CLASS,
} from "@/lib/display/projector-canvas";
import { DisplayQuizPhaseOverlay } from "@/components/display/DisplayQuizPhaseOverlay";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/grafiche/video/sfondo-animato.mp4";
const LOGO_SRC = "/grafiche/logo-transparent.png";

export type DisplayLogoScale = "full" | "compact";

type DisplayStageBackgroundProps = {
  logoScale?: DisplayLogoScale;
  /** Fase quiz attiva — cuore/logo nel footer unificato. */
  quizPhase?: QuizDisplayPhase | null;
  /** Nasconde la roulette PNG di sfondo (estrazione / matching). */
  hideBackgroundRoulette?: boolean;
};

export function DisplayStageBackground({
  logoScale = "full",
  quizPhase = null,
  hideBackgroundRoulette = false,
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

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex items-center justify-center"
          animate={
            reduceMotion
              ? { opacity: hideBackgroundRoulette ? 0 : (phaseConfig?.rouletteOpacity ?? 0.78) }
              : {
                  rotate: hideBackgroundRoulette ? 0 : 360,
                  opacity: hideBackgroundRoulette ? 0 : (phaseConfig?.rouletteOpacity ?? 0.78),
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.5 }
              : {
                  rotate: {
                    duration: phaseConfig?.rouletteDuration ?? 28,
                    repeat: hideBackgroundRoulette ? 0 : Infinity,
                    ease: "linear",
                  },
                  opacity: { duration: 0.45, ease: "easeInOut" },
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
              PROJECTOR_ROULETTE_CLASS,
              "mix-blend-screen drop-shadow-[0_20px_60px_rgba(233,30,140,0.35)] transition-opacity duration-500",
            )}
          />
        </motion.div>
      </div>

      {quizPhase ? null : (
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
                ? PROJECTOR_LOBBY_LOGO_CLASS
                : PROJECTOR_LOBBY_LOGO_FULL_CLASS,
            )}
          />
        </div>
      )}
    </div>
  );
}
