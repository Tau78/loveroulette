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

/** Bed risultati quiz — ingresso a volume pieno (no fade-in). */
export const QUIZ_RESULTS_BED_ID = "LR_25_Quiz_Results_Reveal";

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

/** Track quiz in base a fase display sincronizzata + categoria domanda corrente. */
export function trackIdForQuizPhase(
  quizPhase: QuizDisplayPhase | null | undefined,
  category: string | null | undefined,
): string | null {
  if (quizPhase === "results") {
    return QUIZ_RESULTS_BED_ID;
  }

  if (
    quizPhase === "theme_intro" ||
    quizPhase === "question" ||
    quizPhase === "answers" ||
    quizPhase === "next_question" ||
    quizPhase === "start_countdown"
  ) {
    return quizBedTrackForCategory(category);
  }

  return quizBedTrackForCategory(category);
}
