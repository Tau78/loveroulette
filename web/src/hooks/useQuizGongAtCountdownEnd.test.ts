import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUIZ_TIMING,
  resolveSyncedQuizClock,
} from "@/lib/musicpro/quiz-display";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

/** Contratto allineato a useQuizGongAtCountdownEnd (niente gong stale). */
function shouldArmGongWatch(quiz: QuizSessionState): boolean {
  const clock = resolveSyncedQuizClock(quiz);
  return clock.displayPhase === "answers" && clock.remaining > 0;
}

function quizFixture(
  phase: QuizSessionState["displayPhase"],
  elapsedSec: number,
): QuizSessionState {
  const started = new Date(Date.now() - elapsedSec * 1000).toISOString();
  return {
    questionIds: ["q1"],
    currentIndex: 0,
    total: 1,
    source: "builtin",
    autoplaySeconds: 15,
    autoplayEnabled: false,
    updatedAt: started,
    displayPhase: phase,
    phaseStartedAt: started,
    timing: { ...DEFAULT_QUIZ_TIMING },
    hideRankingLastN: 5,
    rankingEveryN: 5,
  };
}

describe("quiz gong arm contract", () => {
  it("refuses stale arm when answers already at 0", () => {
    expect(
      shouldArmGongWatch(
        quizFixture("answers", DEFAULT_QUIZ_TIMING.questionSeconds + 1),
      ),
    ).toBe(false);
  });

  it("refuses stale arm when already in results", () => {
    expect(shouldArmGongWatch(quizFixture("results", 1))).toBe(false);
  });

  it("arms while answers countdown still running", () => {
    expect(shouldArmGongWatch(quizFixture("answers", 2))).toBe(true);
  });
});
