"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/grafiche/logo-transparent.png";
const ROULETTE_SRC = "/grafiche/roulette.png";

/**
 * Hold sigla senza video: logo a tutto campo + roulette/glow in motion.
 * L’audio è gestito dal parent (`CasaProjector`).
 */
export function DisplaySiglaAudioStage({
  className,
}: {
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-[6] flex items-center justify-center overflow-hidden",
        className,
      )}
      aria-label="Sigla Love Roulette"
    >
      <div className="absolute inset-0 bg-[#0D0D12]" />

      <motion.div
        className="absolute inset-0"
        animate={
          reduceMotion
            ? { opacity: 0.55 }
            : {
                opacity: [0.35, 0.55, 0.4],
                scale: [1, 1.04, 1],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(233,30,140,0.45), transparent 70%)",
        }}
      />

      <motion.div
        className="absolute flex items-center justify-center"
        animate={
          reduceMotion
            ? { opacity: 0.28 }
            : { rotate: 360, opacity: [0.22, 0.38, 0.22] }
        }
        transition={
          reduceMotion
            ? { duration: 0.4 }
            : {
                rotate: { duration: 42, repeat: Infinity, ease: "linear" },
                opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        <Image
          src={ROULETTE_SRC}
          alt=""
          width={980}
          height={980}
          priority
          className="h-auto w-[min(92vmin,980px)] max-h-[90%] object-contain mix-blend-screen drop-shadow-[0_20px_80px_rgba(233,30,140,0.4)]"
        />
      </motion.div>

      <motion.div
        className="relative z-[1] flex flex-col items-center gap-6 px-10"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.88 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: 1,
                scale: [1, 1.04, 1],
              }
        }
        transition={
          reduceMotion
            ? { duration: 0.35 }
            : {
                opacity: { duration: 0.7, ease: "easeOut" },
                scale: {
                  duration: 3.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                },
              }
        }
      >
        <Image
          src={LOGO_SRC}
          alt="Love Roulette"
          width={720}
          height={320}
          priority
          className="h-auto w-[min(62vw,720px)] object-contain drop-shadow-[0_12px_48px_rgba(233,30,140,0.65)]"
        />
        <motion.p
          className="font-display text-[clamp(1.1rem,2.4vw,1.75rem)] font-bold uppercase tracking-[0.28em] text-white/90"
          animate={
            reduceMotion
              ? { opacity: 0.85 }
              : { opacity: [0.55, 1, 0.55] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          Si parte
        </motion.p>
      </motion.div>
    </div>
  );
}
