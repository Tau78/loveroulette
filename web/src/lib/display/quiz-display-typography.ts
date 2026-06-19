/**
 * Tipografia quiz proiettore — maiuscolo + scale fluida nello spazio disponibile.
 * Usare queste classi per domande, risposte e label risultati.
 */
import { cn } from "@/lib/utils";

export const QUIZ_DISPLAY_UPPERCASE = "uppercase";

export const QUIZ_DISPLAY_SANS = "font-sans font-semibold uppercase tracking-wide leading-tight";

/** Domanda in header (1–3 righe). */
export const QUIZ_QUESTION_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]",
  "text-[clamp(1rem,min(3.2vh,4.2vw),2.75rem)]",
  "line-clamp-3",
);

/** Opzione risposta — riempie la riga del grid (max 2 righe). */
export const QUIZ_ANSWER_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white",
  "text-[clamp(0.7rem,min(2.5vh,3.1vw),1.9rem)]",
  "line-clamp-2",
);

/** Label risultato accanto alla lettera. */
export const QUIZ_RESULT_LABEL_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white/95",
  "text-[clamp(0.65rem,min(2.1vh,2.6vw),1.35rem)]",
  "line-clamp-2",
);

/** Lettera A–D nelle risposte. */
export const QUIZ_ANSWER_LETTER_CLASS =
  "shrink-0 font-mono font-bold text-primary text-[clamp(1rem,min(2.8vh,3.5vw),2rem)]";

/** Percentuale risultati. */
export const QUIZ_RESULT_PERCENT_CLASS =
  "shrink-0 font-sans font-bold tabular-nums text-primary text-[clamp(1.25rem,min(3.5vh,4vw),2.5rem)]";

/** Tema al centro. */
export const QUIZ_THEME_TITLE_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-bold text-white text-[clamp(1.5rem,min(4vh,5vw),3.75rem)]",
  "line-clamp-2",
);
