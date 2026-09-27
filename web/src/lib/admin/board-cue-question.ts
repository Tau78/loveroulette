import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

/**
 * Indice della domanda in “Prossima domanda” sulla plancia.
 * - Partenza / sigla / pre-quiz / start_countdown → prima (0), così si può cambiare.
 * - Da theme_intro in poi → currentIndex + 1 (la successiva).
 */
export function boardCueQuestionIndex(input: {
  quizActive: boolean;
  displayPhase: QuizDisplayPhase | null | undefined;
  currentIndex: number;
}): number {
  if (
    !input.quizActive ||
    !input.displayPhase ||
    input.displayPhase === "start_countdown"
  ) {
    return 0;
  }
  return Math.max(0, input.currentIndex + 1);
}
