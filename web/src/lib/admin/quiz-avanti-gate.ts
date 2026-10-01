import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

/**
 * Quando AVANTI quiz è cliccabile — allineato al binario Mauro 2026-09-27.
 * Non cambia l'ordine: solo gate del pulsante.
 *
 * Durante answers con countdown > 0 AVANTI è off: le % arrivano da sole.
 * A remaining ≤ 0 AVANTI resta abilitato (skipPhase) così non si blocca
 * se il tick server non arriva.
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

  if (phase === "answers" && remaining > 0) {
    return {
      enabled: false,
      hint: `Attendi countdown · ${remaining}s`,
    };
  }

  if (phase === "answers" && remaining <= 0) {
    return {
      enabled: true,
      hint: "Tap AVANTI se le % non arrivano",
    };
  }

  return { enabled: true, hint: null };
}
