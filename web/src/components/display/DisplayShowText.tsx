"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Titolo prova finale — massimo impatto sul proiettore. */
export const DISPLAY_CHALLENGE_TITLE_CLASS =
  "max-w-full text-[clamp(4rem,11vw,12rem)] leading-[0.92] tracking-wide";

interface DisplayPhaseHeroProps {
  kicker?: string;
  headline: string;
  subline?: string;
  className?: string;
  /** Ripete un leggero pulse sul titolo (estrazione / attesa). */
  pulse?: boolean;
  /** Trasforma headline e subline in maiuscolo (quiz display). */
  uppercase?: boolean;
  /** Titolo prova finale a tutto schermo. */
  challengeTitle?: boolean;
  /** Override dimensioni titolo principale. */
  headlineClassName?: string;
  /** Override dimensioni sottotitolo. */
  sublineClassName?: string;
}

function StaggerWords({
  text,
  className,
  delay = 0,
  stagger = 0.1,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} aria-label={text}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block mr-[0.28em] last:mr-0"
          initial={{ opacity: 0, y: 36, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: delay + index * stagger,
            duration: 0.55,
            ease: EASE_OUT_EXPO,
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/** Titolo fase proiettore — leggibile su video/roulette, stile game show. */
export function DisplayPhaseHero({
  kicker,
  headline,
  subline,
  className,
  pulse = false,
  uppercase = false,
  challengeTitle = false,
  headlineClassName,
  sublineClassName,
}: DisplayPhaseHeroProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative w-full max-w-6xl text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-x-4 -inset-y-6 md:-inset-x-10 md:-inset-y-8 rounded-[2rem] bg-gradient-to-b from-black/80 via-black/70 to-black/80 backdrop-blur-md border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-5 px-4 py-8 md:gap-7 md:py-12">
        {kicker ? (
          <motion.p
            className={cn(
              "font-semibold uppercase text-white/90",
              challengeTitle
                ? "text-2xl md:text-4xl tracking-[0.38em]"
                : "text-sm md:text-lg tracking-[0.45em]",
            )}
            style={{
              textShadow:
                "0 0 24px rgba(233,30,140,0.55), 0 2px 12px rgba(0,0,0,0.95)",
            }}
            initial={reduceMotion ? false : { opacity: 0, letterSpacing: "0.65em" }}
            animate={{ opacity: 1, letterSpacing: "0.45em" }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            {kicker}
          </motion.p>
        ) : null}

        <motion.h1
          className={cn(
            "font-display font-bold",
            challengeTitle
              ? cn(
                  "uppercase text-white max-w-full",
                  headlineClassName ?? DISPLAY_CHALLENGE_TITLE_CLASS,
                )
              : cn(
                  "text-4xl md:text-6xl lg:text-7xl leading-[1.08] text-transparent bg-clip-text bg-gradient-to-b from-white via-primary to-primary/85 max-w-5xl",
                  uppercase && "uppercase",
                  headlineClassName,
                ),
          )}
          style={{
            fontFamily: "var(--font-display), serif",
            filter: challengeTitle
              ? "drop-shadow(0 6px 0 rgba(0,0,0,1)) drop-shadow(0 0 48px rgba(233,30,140,0.9))"
              : "drop-shadow(0 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 32px rgba(233,30,140,0.75))",
          }}
          animate={
            reduceMotion || !pulse
              ? undefined
              : {
                  scale: [1, 1.02, 1],
                  filter: [
                    "drop-shadow(0 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 28px rgba(233,30,140,0.65))",
                    "drop-shadow(0 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 48px rgba(233,30,140,1))",
                    "drop-shadow(0 4px 0 rgba(0,0,0,0.95)) drop-shadow(0 0 28px rgba(233,30,140,0.65))",
                  ],
                }
          }
          transition={
            pulse
              ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <StaggerWords text={headline} delay={kicker ? 0.15 : 0} stagger={0.11} />
        </motion.h1>

        {subline ? (
          <motion.p
            className={cn(
              "text-lg md:text-2xl text-white/85 max-w-3xl leading-relaxed",
              uppercase && "uppercase",
              sublineClassName,
            )}
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.95)" }}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            {subline}
          </motion.p>
        ) : null}
      </div>
    </div>
  );
}

interface DisplayRevealSplashProps {
  title?: string;
  body?: string;
}

/** Overlay reveal coppia — impatto stile Love Island / Wheel of Fortune. */
export function DisplayRevealSplash({ title, body }: DisplayRevealSplashProps) {
  const reduceMotion = useReducedMotion();
  const coupleParts = body?.includes("&")
    ? body.split("&").map((part) => part.trim())
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12">
      <motion.div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        aria-hidden
      />

      {!reduceMotion ? (
        <>
          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-1/2 size-[min(90vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40"
              initial={{ scale: 0.4, opacity: 0.7 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                delay: ring * 0.75,
                ease: "easeOut",
              }}
              aria-hidden
            />
          ))}
        </>
      ) : null}

      <motion.div
        className="relative z-10 w-full max-w-6xl text-center"
        initial={reduceMotion ? false : { scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <div className="mx-auto rounded-[2rem] border border-primary/30 bg-gradient-to-b from-black/90 via-black/80 to-black/90 px-6 py-10 md:px-14 md:py-16 shadow-[0_0_80px_rgba(233,30,140,0.35)]">
          {title ? (
            <motion.p
              className="font-display text-2xl md:text-4xl font-bold uppercase tracking-[0.35em] text-primary mb-6 md:mb-8"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow: "0 0 28px rgba(233,30,140,0.8)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45, ease: EASE_OUT_EXPO }}
            >
              {title}
            </motion.p>
          ) : null}

          {coupleParts && coupleParts.length >= 2 ? (
            <div className="flex flex-col items-center gap-2 md:gap-4">
              <motion.p
                className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-none"
                style={{
                  fontFamily: "var(--font-display), serif",
                  textShadow:
                    "0 4px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.9)",
                }}
                initial={reduceMotion ? false : { opacity: 0, x: -48, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 16 }}
              >
                {coupleParts[0]}
              </motion.p>
              <motion.span
                className="font-display text-4xl md:text-6xl text-primary font-bold"
                style={{ fontFamily: "var(--font-display), serif" }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 14 }}
                aria-hidden
              >
                &
              </motion.span>
              <motion.p
                className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-none"
                style={{
                  fontFamily: "var(--font-display), serif",
                  textShadow:
                    "0 4px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.9)",
                }}
                initial={reduceMotion ? false : { opacity: 0, x: 48, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 180, damping: 16 }}
              >
                {coupleParts[1]}
              </motion.p>
            </div>
          ) : body ? (
            <motion.p
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white"
              style={{
                fontFamily: "var(--font-display), serif",
                textShadow:
                  "0 4px 0 rgba(0,0,0,1), 0 0 36px rgba(233,30,140,0.85)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT_EXPO }}
            >
              <StaggerWords text={body} delay={0.35} stagger={0.08} />
            </motion.p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
