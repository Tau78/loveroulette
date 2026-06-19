/**
 * Tipografia quiz proiettore — maiuscolo, px fissi calibrati su 1920×1080.
 */
import { cn } from "@/lib/utils";

export const QUIZ_DISPLAY_UPPERCASE = "uppercase";

export const QUIZ_DISPLAY_SANS =
  "font-sans font-semibold uppercase tracking-wide leading-tight";

/** Domanda in header (1–3 righe). */
export const QUIZ_QUESTION_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]",
  "text-[36px]",
  "line-clamp-3",
);

/** Opzione risposta — riempie la riga del grid (max 2 righe). */
export const QUIZ_ANSWER_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white",
  "text-[28px]",
  "line-clamp-2",
);

/** Label risultato accanto alla lettera. */
export const QUIZ_RESULT_LABEL_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white/95",
  "text-[22px]",
  "line-clamp-2",
);

/** Lettera A–D nelle risposte. */
export const QUIZ_ANSWER_LETTER_CLASS =
  "shrink-0 font-mono font-bold text-primary text-[32px]";

/** Percentuale risultati. */
export const QUIZ_RESULT_PERCENT_CLASS =
  "shrink-0 font-sans font-bold tabular-nums text-primary text-[40px]";

/** Tema al centro. */
export const QUIZ_THEME_TITLE_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-bold text-white text-[48px]",
  "line-clamp-2",
);
