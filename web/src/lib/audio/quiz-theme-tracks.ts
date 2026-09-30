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

const DEFAULT_QUIZ_BED = "LR_02_Quiz_Lifestyle";

/**
 * Bed countdown urgenza — non più sulla fase `answers` (resta il tema fino al gong).
 * Ancora usato per prova speciale / legacy.
 */
export const QUIZ_ANSWERS_COUNTDOWN_BED_ID = "LR_03_Quiz_Countdown";

/**
 * Hit one-shot all’ingresso % (dopo gong + gap).
 * Dopo l’hit resta il bed tematico (`quizResultsHoldTrackId`).
 */
export const QUIZ_RESULTS_REVEAL_ID = "LR_25_Quiz_Results_Reveal";

/** @deprecated usa QUIZ_RESULTS_REVEAL_ID — era il bed looping, ora è solo l’hit. */
export const QUIZ_RESULTS_BED_ID = QUIZ_RESULTS_REVEAL_ID;

/**
 * Bed per manche/tema — un loop coerente con l’argomento della slide.
 * Fallback legacy `LR_02_Quiz_Tension` resta in manifest per compat.
 */
export const QUIZ_THEME_BED_TRACK: Record<QuizThemeCategory, string> = {
  lifestyle: "LR_02_Quiz_Lifestyle",
  romantic: "LR_02_Quiz_Romantic",
  adventure: "LR_02_Quiz_Adventure",
  values: "LR_02_Quiz_Values",
  fun: "LR_02_Quiz_Fun",
  intimacy: "LR_02_Quiz_Intimacy",
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

/** Path pubblico del bed primario per la plancia (senza manifest). */
export function quizBedSrcForCategory(
  category: string | null | undefined,
): string {
  const trackId = quizBedTrackForCategory(category);
  return `/audio/dark_fuchsia/loops/${trackId}_A.mp3`;
}

/** Bed lungo sotto le barre % (dopo l’hit LR_25). */
export function quizResultsHoldTrackId(
  category: string | null | undefined,
): string {
  return quizBedTrackForCategory(category);
}

/**
 * Track quiz per fase (bed continuo):
 * - countdown avvio → silenzio (file countdown one-shot a parte)
 * - tema / domanda / risposte → bed della tematica (fino al gong)
 * - % risultati → stesso hold tematico; hit LR_25 one-shot dopo gong + gap
 */
export function trackIdForQuizPhase(
  quizPhase: QuizDisplayPhase | null | undefined,
  category: string | null | undefined,
): string | null {
  if (quizPhase === "start_countdown") {
    return null;
  }
  if (quizPhase === "results") {
    return quizResultsHoldTrackId(category);
  }

  // theme_intro | question | answers | next_question → categoria
  return quizBedTrackForCategory(category);
}
