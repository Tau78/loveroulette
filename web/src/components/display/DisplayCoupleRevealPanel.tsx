"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import type { LastReveal } from "@/lib/musicpro/extraction";
import { cn } from "@/lib/utils";
import {
  DisplayCoupleRevealHeart,
  coupleRevealPlayerPhoto,
} from "@/components/display/DisplayCoupleRevealHeart";

function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/55 px-5 py-4 text-center backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
        {label}
      </p>
      <p className="font-display mt-2 text-4xl font-bold tabular-nums text-white md:text-5xl">
        {value}
      </p>
      {sub ? (
        <p className="mt-2 line-clamp-3 text-sm leading-snug text-white/70">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function PlayerColumn({
  nick,
  photoUrl,
  side,
}: {
  nick: string;
  photoUrl: string;
  side: "left" | "right";
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-4",
        side === "left" ? "items-end md:items-center" : "items-start md:items-center",
      )}
      initial={reduceMotion ? false : { opacity: 0, x: side === "left" ? -48 : 48 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 170, damping: 18, delay: 0.12 }}
    >
      <div className="relative size-[clamp(120px,18vw,220px)] overflow-hidden rounded-3xl border-2 border-primary/45 shadow-[0_0_48px_rgba(236,72,153,0.35)]">
        <Image
          src={photoUrl}
          alt=""
          fill
          className="object-cover"
          sizes="220px"
          unoptimized={photoUrl.startsWith("http")}
        />
      </div>
      <p
        className="max-w-[min(100%,280px)] text-center font-display text-[clamp(1.75rem,4vw,3.25rem)] font-bold uppercase leading-none text-white"
        style={{
          textShadow:
            "0 3px 0 rgba(0,0,0,1), 0 0 32px rgba(233,30,140,0.75)",
        }}
      >
        {nick}
      </p>
    </motion.div>
  );
}

export function DisplayCoupleRevealPanel({
  reveal,
  showAffinity = true,
}: {
  reveal: LastReveal;
  showAffinity?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const stats = reveal.stats;
  const sameLine = stats
    ? `${stats.sameAnswers}${stats.questionsCompared > 0 ? ` / ${stats.questionsCompared}` : ""}`
    : "—";
  const trialsLine = stats
    ? `${stats.trialsCount} · ${stats.trialsScore} pt`
    : "0 · 0 pt";
  const fastest =
    stats?.fastestMatchQuestionText?.trim() ||
    (stats && stats.sameAnswers === 0 ? "Nessuna risposta uguale" : "—");

  const leftPhoto = coupleRevealPlayerPhoto(reveal.malePhotoUrl, "M");
  const rightPhoto = coupleRevealPlayerPhoto(reveal.femalePhotoUrl, "F");

  return (
    <motion.div
      className="relative flex h-full min-h-0 w-full flex-col px-6 pb-6 pt-8 md:px-10"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <p className="text-center font-display text-lg font-bold uppercase tracking-[0.35em] text-primary md:text-2xl">
        Coppia rivelata
      </p>

      <div className="mt-6 flex min-h-0 flex-1 flex-col justify-center gap-8">
        <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-8 md:grid-cols-[1fr_minmax(280px,420px)_1fr] md:gap-6">
          <PlayerColumn nick={reveal.maleNick} photoUrl={leftPhoto} side="left" />

          <motion.div
            className="flex flex-col gap-4"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            <StatBlock label="Domande uguali" value={sameLine} />
            <StatBlock label="Prove · punteggio" value={trialsLine} />
            <StatBlock
              label="Stessa risposta più veloce"
              value={
                stats?.fastestMatchQuestionText
                  ? "⚡"
                  : stats && stats.sameAnswers === 0
                    ? "—"
                    : "—"
              }
              sub={fastest}
            />
            {showAffinity && reveal.affinityScore > 0 ? (
              <p className="text-center text-sm uppercase tracking-[0.2em] text-white/50">
                Affinità quiz{" "}
                <span className="font-display text-2xl font-bold text-primary tabular-nums">
                  {Math.round(reveal.affinityScore)}%
                </span>
              </p>
            ) : null}
          </motion.div>

          <PlayerColumn
            nick={reveal.femaleNick}
            photoUrl={rightPhoto}
            side="right"
          />
        </div>
      </div>

      <DisplayCoupleRevealHeart
        affinityScore={reveal.affinityScore}
        className="mt-auto shrink-0"
      />
    </motion.div>
  );
}
