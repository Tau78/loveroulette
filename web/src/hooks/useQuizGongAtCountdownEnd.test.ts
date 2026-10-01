import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUIZ_TIMING,
  resolveSyncedQuizClock,
} from "@/lib/musicpro/quiz-display";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";

/**
 * Contratto allineato a useQuizGongAtCountdownEnd: al join con remaining ≤ 0
 * non si deve considerare un falling edge (niente gong stale).
 */
function shouldArmGongWatch(quiz: QuizSessionState): boolean {
  const clock = resolveSyncedQuizClock(quiz);
  return clock.displayPhase === "answers" && clock.remaining > 0;
}

/** Early-close: gong solo se eravamo armati sulla stessa chiave del cue server. */
function shouldPlayGongFromServerCue(
  armedKey: string | null,
  gongCueKey: string | undefined,
  alreadyPlayed: string | null,
): boolean {
  if (!gongCueKey || !armedKey) return false;
  if (armedKey !== gongCueKey) return false;
  if (alreadyPlayed === gongCueKey) return false;
  return true;
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

  it("plays gong on early-close cue matching armed answers window", () => {
    const answers = quizFixture("answers", 2);
    const key = `${answers.currentIndex}:${answers.phaseStartedAt}`;
    expect(shouldPlayGongFromServerCue(key, key, null)).toBe(true);
  });

  it("skips gong on AVANTI (no cue) or late join (not armed)", () => {
    expect(shouldPlayGongFromServerCue(null, "0:iso", null)).toBe(false);
    expect(shouldPlayGongFromServerCue("0:a", undefined, null)).toBe(false);
    expect(shouldPlayGongFromServerCue("0:a", "0:b", null)).toBe(false);
  });
});
