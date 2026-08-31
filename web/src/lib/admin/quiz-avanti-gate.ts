import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

/**
 * Quando AVANTI quiz è cliccabile — allineato al modello finali (countdown = wait).
 * Non cambia l'ordine del binario: solo gate del pulsante.
 */
export function quizAvantiState(
  phase: QuizDisplayPhase | null | undefined,
  remaining: number,
): { enabled: boolean; hint: string | null } {
  if (!phase) {
    return { enabled: true, hint: null };
  }

  if (phase === "start_countdown" && remaining > 0) {
    return {
      enabled: false,
      hint: `Countdown avvio · ${remaining}s`,
    };
  }

  if (phase === "answers" && remaining > 0) {
    return {
      enabled: false,
      hint: `Risposte aperte · ${remaining}s`,
    };
  }

  return { enabled: true, hint: null };
}
