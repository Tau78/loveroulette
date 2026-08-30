"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { categoryThemeLabel } from "@/lib/musicpro/quiz-display";
import { resolveThemeSlideSrc } from "@/lib/display/quiz-theme-slides";
import {
  QUIZ_THEME_TITLE_CLASS,
} from "@/lib/display/quiz-display-typography";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

type DisplayThemeSlideProps = {
  title: string;
  subtitle?: string;
  category?: string | null;
  /** Kicker sopra il titolo (es. «Manche»). */
  kicker?: string;
  className?: string;
  /** Variante più compatta (anteprima Casa). */
  compact?: boolean;
};

/**
 * Slide grafica pre-domanda: art 16:9 per categoria + piastra titolo
 * (il copy resta dinamico per manche Generatore / override).
 */
export function DisplayThemeSlide({
  title,
  subtitle,
  category,
  kicker = "Manche",
  className,
  compact = false,
}: DisplayThemeSlideProps) {
  const reduceMotion = useReducedMotion();
  const artSrc = resolveThemeSlideSrc(category);
  const defaults = category ? categoryThemeLabel(category) : null;
  const resolvedSubtitle =
    subtitle?.trim() ||
    (defaults &&
    title.trim().localeCompare(defaults.title, "it", { sensitivity: "accent" }) ===
      0
      ? defaults.subtitle
      : undefined);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
        compact ? "rounded-xl" : "rounded-2xl",
        className,
      )}
    >
      {artSrc ? (
        <>
          <Image
            src={artSrc}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/60"
            aria-hidden
          />
          {!reduceMotion ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: [0.12, 0.28, 0.12] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 55% 45% at 50% 42%, rgba(233,30,140,0.22) 0%, transparent 70%)",
              }}
              aria-hidden
            />
          ) : null}
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #0f0308 0%, #1a0610 45%, #120408 100%)",
          }}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex h-full min-h-0 flex-col items-center justify-center px-6 py-8 md:px-12">
        <div className="relative w-full max-w-5xl text-center">
          <div
            className={cn(
              "pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-black/80 via-black/70 to-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-md md:-inset-x-10 md:-inset-y-8",
            )}
            aria-hidden
          />
          <div
            className={cn(
              "relative z-10 flex flex-col items-center",
              compact ? "gap-3 px-4 py-6" : "gap-5 px-4 py-10 md:gap-6",
            )}
          >
            {kicker ? (
              <motion.p
                className="text-sm font-semibold uppercase tracking-[0.45em] text-white/90 md:text-lg"
                style={{
                  textShadow:
                    "0 0 24px rgba(233,30,140,0.55), 0 2px 12px rgba(0,0,0,0.95)",
                }}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              >
                {kicker}
              </motion.p>
            ) : null}
            <motion.h1
              className={cn(
                QUIZ_THEME_TITLE_CLASS,
                "text-center text-white",
                compact && "text-[clamp(2rem,5vw,3.5rem)]",
              )}
              style={{
                textShadow:
                  "0 2px 0 rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.8), 0 0 24px rgba(233,30,140,0.35)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: 0.05 }}
            >
              {title}
            </motion.h1>
            {resolvedSubtitle ? (
              <motion.p
                className={cn(
                  "max-w-3xl font-sans font-medium uppercase tracking-wide text-white/80",
                  compact ? "text-base" : "text-xl md:text-2xl",
                )}
                style={{
                  textShadow: "0 2px 12px rgba(0,0,0,0.95)",
                }}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.12 }}
              >
                {resolvedSubtitle}
              </motion.p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
