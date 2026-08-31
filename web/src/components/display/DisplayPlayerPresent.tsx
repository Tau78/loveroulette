"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { playerPresentKey } from "@/lib/display/player-present";
import { QUIZ_PRESENT_NAME_CLASS } from "@/lib/display/quiz-display-typography";

const AVATAR_M = "/grafiche/avatar-m.png";
const AVATAR_F = "/grafiche/avatar-f.png";
const EASE_IN = [0.16, 1, 0.3, 1] as const;
const EASE_BURST = [0.22, 0.9, 0.3, 1] as const;

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

const BURST = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + 0.2;
  const dist = 150 + (i % 4) * 36;
  return {
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist),
    heart: i % 5 === 0,
    gold: i % 3 === 1,
  };
});

/**
 * Presentazione giocatore in sala: NOME → FOTO → SESSO.
 * Entrata: zoom veloce dal fondo. Uscita: burst (onde + scintille).
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
    <motion.div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        className,
      )}
      initial="hidden"
      animate="show"
      exit="leave"
      variants={{
        hidden: {},
        show: {},
        leave: {
          transition: { duration: 0.46, when: "afterChildren" },
        },
      }}
    >
      {!reduce ? <PresentBurst compact={compact} /> : null}

      <motion.div
        className={cn(
          "relative flex w-full max-w-5xl flex-col items-center text-center",
          compact ? "gap-5 px-4 py-6" : "gap-8 px-6 py-10",
        )}
        variants={
          reduce
            ? {
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.18 } },
                leave: { opacity: 0, transition: { duration: 0.16 } },
              }
            : {
                hidden: { opacity: 0, scale: 0.22, filter: "blur(16px)" },
                show: {
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { duration: 0.36, ease: EASE_IN },
                },
                leave: {
                  opacity: 0,
                  scale: 1.55,
                  rotate: 4,
                  filter: "blur(12px)",
                  transition: { duration: 0.4, ease: [0.4, 0, 1, 1] },
                },
              }
        }
      >
        <div
          className="pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-[2rem] border border-white/12 bg-gradient-to-b from-black/85 via-black/75 to-black/85 shadow-[0_28px_90px_rgba(0,0,0,0.7)] backdrop-blur-md md:-inset-x-12 md:-inset-y-10"
          aria-hidden
        />

        <h1
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
        >
          {name}
        </h1>

        <div
          className={cn(
            "relative z-10 overflow-hidden rounded-full border-[6px] border-primary/85 bg-[#14171d] shadow-[0_0_48px_rgba(233,30,140,0.45)]",
            compact ? "size-[160px]" : "lr-dt-face",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={faceSrc(gender, photo)}
            alt=""
            className="size-full object-cover"
          />
        </div>

        <p
          className={cn(
            "relative z-10 font-sans font-extrabold uppercase tracking-[0.32em] text-[#f5c84b]",
            compact ? "text-xl" : "lr-dt-sex",
          )}
          style={{
            textShadow: "0 2px 12px rgba(0,0,0,0.95)",
          }}
        >
          {sexLabel(gender)}
        </p>
      </motion.div>
    </motion.div>
  );
}

/** Cambio giocatore: esce il precedente, entra il nuovo (overlap). */
export function DisplayPlayerPresentSwitch(props: DisplayPlayerPresentProps) {
  const id = playerPresentKey(props.nick, props.gender, props.photo);

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        <DisplayPlayerPresent key={id} {...props} />
      </AnimatePresence>
    </div>
  );
}

function PresentBurst({ compact }: { compact: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      variants={{ hidden: {}, show: {}, leave: {} }}
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-1/2 size-[min(70vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-2xl"
        variants={{
          hidden: { opacity: 0, scale: 0.2 },
          show: { opacity: 0, scale: 0.2 },
          leave: {
            opacity: [0.75, 0],
            scale: [0.25, 1.8],
            transition: { duration: 0.32, ease: "easeOut" },
          },
        }}
      />
      {[0, 1].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 size-[min(55vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70"
          variants={{
            hidden: { opacity: 0, scale: 0.25 },
            show: { opacity: 0, scale: 0.25 },
            leave: {
              opacity: [0.9, 0],
              scale: [0.35, 2.4 + ring * 0.35],
              transition: {
                duration: 0.46,
                delay: ring * 0.06,
                ease: "easeOut",
              },
            },
          }}
        />
      ))}
      {BURST.map((spark, i) => (
        <motion.span
          key={i}
          className={cn(
            "absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 font-display leading-none",
            spark.heart
              ? compact
                ? "text-xl"
                : "text-3xl"
              : compact
                ? "size-2 rounded-full"
                : "size-2.5 rounded-full",
            spark.heart
              ? spark.gold
                ? "text-[#f5c84b]"
                : "text-primary"
              : spark.gold
                ? "bg-[#f5c84b]"
                : "bg-primary",
          )}
          style={{
            textShadow: spark.heart
              ? "0 0 16px rgba(233,30,140,0.85)"
              : undefined,
            boxShadow: spark.heart
              ? undefined
              : "0 0 12px rgba(233,30,140,0.7)",
          }}
          variants={{
            hidden: { opacity: 0, scale: 0, x: 0, y: 0 },
            show: { opacity: 0, scale: 0, x: 0, y: 0 },
            leave: {
              opacity: [0, 1, 0],
              scale: [0.3, 1.15, 0.15],
              x: spark.x,
              y: spark.y,
              transition: { duration: 0.48, ease: EASE_BURST },
            },
          }}
        >
          {spark.heart ? "♥" : null}
        </motion.span>
      ))}
    </motion.div>
  );
}
