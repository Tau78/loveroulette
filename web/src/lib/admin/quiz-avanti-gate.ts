import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

/**
 * Quando AVANTI quiz è cliccabile — allineato al binario Mauro 2026-09-27.
 * Non cambia l'ordine: solo gate del pulsante.
 *
 * Durante answers (countdown) AVANTI è off: le % arrivano da sole a fine timer.
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
      hint: `Attendi countdown · ${remaining}s`,
    };
  }

  if (phase === "answers") {
    return {
      enabled: false,
      hint:
        remaining > 0
          ? `Attendi countdown · ${remaining}s`
          : "Attendi chiusura…",
    };
  }

  return { enabled: true, hint: null };
}
