import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

/** Categorie allineate a slide tema / manche Generatore (`CATEGORY_THEME_LABELS`). */
export type QuizThemeCategory =
  | "lifestyle"
  | "romantic"
  | "adventure"
  | "values"
  | "fun"
  | "intimacy";

export const QUIZ_THEME_CATEGORIES: readonly QuizThemeCategory[] = [
  "lifestyle",
  "romantic",
  "adventure",
  "values",
  "fun",
  "intimacy",
];

const DEFAULT_QUIZ_BED = "LR_02_Quiz_Tension";

/** Bed countdown risposte — parte quando appaiono A–D (fase `answers`). */
export const QUIZ_ANSWERS_COUNTDOWN_BED_ID = "LR_03_Quiz_Countdown";

/**
 * Hit one-shot all’ingresso % (non loop — ~10 s, altrimenti riparte in loop fastidioso).
 * Dopo l’hit resta il bed lungo (`quizResultsHoldTrackId`).
 */
export const QUIZ_RESULTS_REVEAL_ID = "LR_25_Quiz_Results_Reveal";

/** @deprecated usa QUIZ_RESULTS_REVEAL_ID — era il bed looping, ora è solo l’hit. */
export const QUIZ_RESULTS_BED_ID = QUIZ_RESULTS_REVEAL_ID;

/**
 * Bed per manche/tema — oggi fallback su LR_02 finché non esporti loop SUNO dedicati.
 * Aggiorna il path quando aggiungi `LR_02_Quiz_{Category}_*.mp3` al manifest.
 */
export const QUIZ_THEME_BED_TRACK: Record<QuizThemeCategory, string> = {
  lifestyle: DEFAULT_QUIZ_BED,
  romantic: DEFAULT_QUIZ_BED,
  adventure: DEFAULT_QUIZ_BED,
  values: DEFAULT_QUIZ_BED,
  fun: DEFAULT_QUIZ_BED,
  intimacy: DEFAULT_QUIZ_BED,
};

export function normalizeQuizThemeCategory(
  value: string | null | undefined,
): QuizThemeCategory | null {
  if (!value) return null;
  const key = value.toLowerCase() as QuizThemeCategory;
  return QUIZ_THEME_CATEGORIES.includes(key) ? key : null;
}

export function quizBedTrackForCategory(
  category: string | null | undefined,
): string {
  const normalized = normalizeQuizThemeCategory(category);
  if (normalized) return QUIZ_THEME_BED_TRACK[normalized];
  return DEFAULT_QUIZ_BED;
}

/** Bed lungo sotto le barre % (dopo l’hit LR_25). */
export function quizResultsHoldTrackId(
  category: string | null | undefined,
): string {
  return quizBedTrackForCategory(category);
}

/**
 * Track quiz per fase (bed continuo):
 * - tema / lettura domanda → misteriosa (LR_02)
 * - risposte + countdown → LR_03 countdown
 * - % risultati → hold misteriosa; l’hit LR_25 è one-shot a parte
 */
export function trackIdForQuizPhase(
  quizPhase: QuizDisplayPhase | null | undefined,
  category: string | null | undefined,
): string | null {
  if (quizPhase === "answers") {
    return QUIZ_ANSWERS_COUNTDOWN_BED_ID;
  }
  if (quizPhase === "results") {
    return quizResultsHoldTrackId(category);
  }

  return quizBedTrackForCategory(category);
}
