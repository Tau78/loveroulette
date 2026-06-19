import type { EventState } from "@/lib/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";

const SECTION_BASE: Partial<Record<EventState, number>> = {
  lobby: 0,
  quiz: 0.08,
  matching: 0.52,
  extraction: 0.65,
  elimination: 0.78,
  finals: 0.88,
  winner: 1,
  closed: 1,
};

const QUIZ_PHASE_OFFSET: Record<QuizDisplayPhase, number> = {
  start_countdown: 0,
  theme_intro: 0.08,
  question: 0.14,
  answers: 0.2,
  results: 0.26,
  next_question: 0.32,
};

/** 0 = bianco (inizio serata), 1 = rosso acceso (finale). */
export function resolveEveningHeartProgress(
  runtimeState: EventState,
  quizState?: QuizSessionState | null,
): number {
  if (runtimeState === "quiz" && quizState) {
    const questionShare =
      quizState.total > 0 ? quizState.currentIndex / quizState.total : 0;
    const phaseShare =
      (QUIZ_PHASE_OFFSET[quizState.displayPhase as QuizDisplayPhase] ?? 0) /
      Math.max(quizState.total, 1);
    return Math.min(0.48, questionShare * 0.4 + phaseShare);
  }

  return SECTION_BASE[runtimeState] ?? 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Interpola bianco → rosa → rosso acceso. */
export function heartColorAtProgress(progress: number): {
  fill: string;
  glow: string;
} {
  const t = clamp01(progress);

  if (t <= 0) {
    return {
      fill: "#ffffff",
      glow: "drop-shadow(0 0 12px rgba(255,255,255,0.45))",
    };
  }

  if (t >= 1) {
    return {
      fill: "#ef4444",
      glow:
        "drop-shadow(0 0 18px rgba(239,68,68,0.7)) drop-shadow(0 0 36px rgba(233,30,140,0.45))",
    };
  }

  const r = Math.round(255 + (239 - 255) * t);
  const g = Math.round(255 + (68 - 255) * t);
  const b = Math.round(255 + (68 - 255) * t);
  const fill = `rgb(${r}, ${g}, ${b})`;
  const glowStrength = 0.25 + t * 0.55;

  return {
    fill,
    glow: `drop-shadow(0 0 ${12 + t * 12}px rgba(236,72,153,${glowStrength}))`,
  };
}
