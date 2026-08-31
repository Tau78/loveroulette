"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { QUIZ_PRESENT_NAME_CLASS } from "@/lib/display/quiz-display-typography";

const AVATAR_M = "/grafiche/avatar-m.png";
const AVATAR_F = "/grafiche/avatar-f.png";
const EASE = [0.16, 1, 0.3, 1] as const;

export type DisplayPlayerPresentProps = {
  nick: string;
  gender: "M" | "F";
  photo?: string | null;
  className?: string;
  /** Anteprima widget Casa più compatta. */
  compact?: boolean;
};

function sexLabel(gender: "M" | "F") {
  return gender === "F" ? "Lei" : "Lui";
}

function faceSrc(gender: "M" | "F", photo?: string | null) {
  if (photo?.trim()) return photo.trim();
  return gender === "F" ? AVATAR_F : AVATAR_M;
}

/**
 * Presentazione giocatore in sala: NOME (grosso) → FOTO → SESSO.
 */
export function DisplayPlayerPresent({
  nick,
  gender,
  photo,
  className,
  compact = false,
}: DisplayPlayerPresentProps) {
  const reduce = useReducedMotion();
  const name = nick.trim().toUpperCase() || "—";

  return (
    <div
      className={cn(
        "relative flex w-full max-w-5xl flex-col items-center text-center",
        compact ? "gap-5 px-4 py-6" : "gap-8 px-6 py-10",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-[2rem] border border-white/12 bg-gradient-to-b from-black/85 via-black/75 to-black/85 shadow-[0_28px_90px_rgba(0,0,0,0.7)] backdrop-blur-md md:-inset-x-12 md:-inset-y-10",
        )}
        aria-hidden
      />

      <motion.h1
        className={cn(
          "relative z-10",
          compact
            ? "font-sans font-black uppercase leading-[0.92] tracking-wide text-white text-[clamp(2.8rem,7vw,4.5rem)]"
            : QUIZ_PRESENT_NAME_CLASS,
        )}
        style={{
          textShadow:
            "0 3px 0 rgba(0,0,0,0.95), 0 0 48px rgba(0,0,0,0.85), 0 0 36px rgba(233,30,140,0.45)",
        }}
        initial={reduce ? false : { opacity: 0, scale: 2.1, filter: "blur(16px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {name}
      </motion.h1>

      <motion.div
        className={cn(
          "relative z-10 overflow-hidden rounded-full border-[6px] border-primary/85 bg-[#14171d] shadow-[0_0_48px_rgba(233,30,140,0.45)]",
          compact ? "size-[160px]" : "lr-dt-face",
        )}
        initial={reduce ? false : { opacity: 0, scale: 0.35, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 16,
          delay: reduce ? 0 : 0.12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faceSrc(gender, photo)}
          alt=""
          className="size-full object-cover"
        />
      </motion.div>


      <motion.p
        className={cn(
          "relative z-10 font-sans font-extrabold uppercase tracking-[0.32em] text-[#f5c84b]",
          compact ? "text-xl" : "lr-dt-sex",
        )}
        style={{
          textShadow: "0 2px 12px rgba(0,0,0,0.95)",
        }}
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.28, duration: 0.35, ease: EASE }}
      >
        {sexLabel(gender)}
      </motion.p>
    </div>
  );
}
