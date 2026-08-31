/**
 * Tipografia quiz / proiettore — px calibrati su 1920×1080.
 * `DISPLAY_TYPE_SCALE` alza tutte le scritte a video in un colpo solo.
 */
import { cn } from "@/lib/utils";

/** Incremento globale delle scritte sul proiettore (+20%). */
export const DISPLAY_TYPE_SCALE = 1.2 as const;

/** Scala un px di design verso la tipografia a video. */
export function scaledDisplayPx(px: number): number {
  return Math.round(px * DISPLAY_TYPE_SCALE);
}

export function scaledDisplayPxClass(px: number): `text-[${number}px]` {
  return `text-[${scaledDisplayPx(px)}px]` as `text-[${number}px]`;
}

/** Scala un rem di design (es. clamp). */
export function scaledDisplayRem(rem: number): number {
  return Math.round(rem * DISPLAY_TYPE_SCALE * 100) / 100;
}

export const QUIZ_DISPLAY_UPPERCASE = "uppercase";

export const QUIZ_DISPLAY_SANS =
  "font-sans font-semibold uppercase tracking-wide leading-tight";

/** Domanda in header (1–3 righe). Design 36 → +20%. */
export const QUIZ_QUESTION_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]",
  scaledDisplayPxClass(36),
  "line-clamp-3",
);

/** Opzione risposta — riempie la riga del grid (max 2 righe). */
export const QUIZ_ANSWER_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white",
  scaledDisplayPxClass(28),
  "line-clamp-2",
);

/** Label risultato accanto alla lettera. */
export const QUIZ_RESULT_LABEL_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white/95",
  scaledDisplayPxClass(22),
  "line-clamp-2",
);

/** Lettera A–D nelle risposte. */
export const QUIZ_ANSWER_LETTER_CLASS = cn(
  "shrink-0 font-mono font-bold text-primary",
  scaledDisplayPxClass(32),
);

/** Percentuale risultati. */
export const QUIZ_RESULT_PERCENT_CLASS = cn(
  "shrink-0 font-sans font-bold tabular-nums text-primary",
  scaledDisplayPxClass(40),
);

/** Tema al centro — impatto proiettore (1920×1080). */
export const QUIZ_THEME_TITLE_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-black text-white",
  `text-[clamp(${scaledDisplayRem(4.5)}rem,${scaledDisplayRem(9)}vw,${scaledDisplayRem(7.5)}rem)]`,
  "leading-[0.92]",
  "line-clamp-2",
);
