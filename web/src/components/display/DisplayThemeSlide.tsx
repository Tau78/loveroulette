"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { categoryThemeLabel } from "@/lib/musicpro/quiz-display";
import { resolveThemeSlideSrc } from "@/lib/display/quiz-theme-slides";
import {
  resolveThemeArtMotion,
  resolveThemeTextMotion,
} from "@/lib/display/theme-slide-motion";
import { QUIZ_THEME_TITLE_CLASS } from "@/lib/display/quiz-display-typography";

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
 * Slide grafica pre-domanda: art 16:9 con Ken Burns per categoria +
 * titolo grosso in ingresso scenico (Framer, niente video loop).
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
  const artMotion = resolveThemeArtMotion(category);
  const textMotion = resolveThemeTextMotion(category);
  const defaults = category ? categoryThemeLabel(category) : null;
  const resolvedSubtitle =
    subtitle?.trim() ||
    (defaults &&
    title.trim().localeCompare(defaults.title, "it", { sensitivity: "accent" }) ===
      0
      ? defaults.subtitle
      : undefined);

  const still = Boolean(reduceMotion);

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
          <motion.div
            key={`art-${category ?? "default"}`}
            className="absolute inset-0"
            initial={still ? false : artMotion.initial}
            animate={still ? undefined : artMotion.animate}
            transition={still ? undefined : artMotion.transition}
          >
            <div className={cn("absolute inset-0", artMotion.className)}>
              <Image
                src={artSrc}
                alt=""
                fill
                priority
                unoptimized
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </motion.div>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/65"
            aria-hidden
          />
          {!still ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.12 }}
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse 55% 45% at 50% 42%, rgba(233,30,140,0.28) 0%, transparent 70%)",
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

      <div className="relative z-10 flex h-full min-h-0 flex-col items-center justify-center px-4 py-6 md:px-10">
        <div className="relative w-full max-w-6xl text-center">
          <motion.div
            key={`plate-${category ?? "default"}-${title}`}
            className={cn(
              "pointer-events-none absolute -inset-x-3 -inset-y-5 rounded-[2rem] border border-white/15 bg-gradient-to-b from-black/85 via-black/75 to-black/85 shadow-[0_28px_90px_rgba(0,0,0,0.75)] backdrop-blur-md md:-inset-x-12 md:-inset-y-10",
            )}
            initial={still ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden
          />
          <div
            className={cn(
              "relative z-10 flex flex-col items-center",
              compact ? "gap-2 px-3 py-5" : "gap-4 px-4 py-10 md:gap-5 md:py-14",
            )}
          >
            {kicker ? (
              <motion.p
                key={`kicker-${category}-${kicker}`}
                className={cn(
                  "font-semibold uppercase text-white/90",
                  compact
                    ? "text-xs tracking-[0.35em]"
                    : "text-base tracking-[0.45em] md:text-xl",
                )}
                style={{
                  textShadow:
                    "0 0 28px rgba(233,30,140,0.65), 0 2px 12px rgba(0,0,0,0.95)",
                }}
                initial={still ? false : textMotion.kicker.initial}
                animate={textMotion.kicker.animate}
                transition={still ? { duration: 0 } : textMotion.kicker.transition}
              >
                {kicker}
              </motion.p>
            ) : null}
            <motion.h1
              key={`title-${category}-${title}`}
              className={cn(
                QUIZ_THEME_TITLE_CLASS,
                "text-center text-white",
                compact && "text-[clamp(2.9rem,7.2vw,4.6rem)] leading-[0.95]",
              )}
              style={{
                textShadow:
                  "0 3px 0 rgba(0,0,0,0.95), 0 0 48px rgba(0,0,0,0.85), 0 0 36px rgba(233,30,140,0.45)",
              }}
              initial={still ? false : textMotion.title.initial}
              animate={textMotion.title.animate}
              transition={still ? { duration: 0 } : textMotion.title.transition}
            >
              {title}
            </motion.h1>
            {resolvedSubtitle ? (
              <motion.p
                key={`sub-${category}-${resolvedSubtitle}`}
                className={cn(
                  "max-w-4xl font-sans font-semibold uppercase tracking-wide text-white/85",
                  compact
                    ? "text-sm"
                    : "text-2xl md:text-[34px] md:leading-snug",
                )}
                style={{
                  textShadow: "0 2px 14px rgba(0,0,0,0.95)",
                }}
                initial={still ? false : textMotion.subtitle.initial}
                animate={textMotion.subtitle.animate}
                transition={
                  still ? { duration: 0 } : textMotion.subtitle.transition
                }
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
