/**
 * Tipografia quiz / proiettore — px di design su 1920×1080.
 * La scala runtime è `--lr-display-type-scale` (default 1.2).
 * Per cambiare il default: DISPLAY_TYPE_SCALE / Impostazioni «Dimensione caratteri Schermo».
 */
import { cn } from "@/lib/utils";
import {
  DISPLAY_TYPE_SCALE_DEFAULT,
  clampTypeScale,
} from "@/lib/display/type-scale";

/** Default globale (+20%). Override a runtime via CSS var / impostazioni. */
export const DISPLAY_TYPE_SCALE = DISPLAY_TYPE_SCALE_DEFAULT;

/** Scala un px di design (usa la scala passata o il default impostazioni). */
export function scaledDisplayPx(
  px: number,
  scale: number = DISPLAY_TYPE_SCALE,
): number {
  return Math.round(px * clampTypeScale(scale));
}

export function scaledDisplayRem(
  rem: number,
  scale: number = DISPLAY_TYPE_SCALE,
): number {
  return Math.round(rem * clampTypeScale(scale) * 100) / 100;
}

/** @deprecated Preferisci le classi `lr-dt-*` con CSS var runtime. */
export function scaledDisplayPxClass(px: number): `text-[${number}px]` {
  return `text-[${scaledDisplayPx(px)}px]` as `text-[${number}px]`;
}

export const QUIZ_DISPLAY_UPPERCASE = "uppercase";

export const QUIZ_DISPLAY_SANS =
  "font-sans font-semibold uppercase tracking-wide leading-tight";

/** Domanda in header (1–3 righe). Design 36px × scala. */
export const QUIZ_QUESTION_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]",
  "lr-dt-36",
  "line-clamp-3",
);

/** Opzione risposta — riempie la riga del grid (max 2 righe). */
export const QUIZ_ANSWER_TEXT_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white",
  "lr-dt-28",
  "line-clamp-2",
);

/** Label risultato accanto alla lettera. */
export const QUIZ_RESULT_LABEL_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "text-white/95",
  "lr-dt-22",
  "line-clamp-2",
);

/** Lettera A–D nelle risposte. */
export const QUIZ_ANSWER_LETTER_CLASS = cn(
  "shrink-0 font-mono font-bold text-primary",
  "lr-dt-32",
);

/** Percentuale risultati. */
export const QUIZ_RESULT_PERCENT_CLASS = cn(
  "shrink-0 font-sans font-bold tabular-nums text-primary",
  "lr-dt-40",
);

/** Tema al centro — impatto proiettore (1920×1080). */
export const QUIZ_THEME_TITLE_CLASS = cn(
  QUIZ_DISPLAY_SANS,
  "font-black text-white",
  "lr-dt-theme-title",
  "leading-[0.92]",
  "line-clamp-2",
);

/** Nome giocatore in presentazione. */
export const QUIZ_PRESENT_NAME_CLASS = cn(
  "font-sans font-black uppercase leading-[0.92] tracking-wide text-white",
  "lr-dt-present-name",
);
