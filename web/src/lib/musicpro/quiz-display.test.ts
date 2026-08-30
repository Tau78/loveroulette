import { describe, expect, it } from "vitest";
import { DEFAULT_QUIZ_TIMING } from "./quiz-display";
import {
  nextQuizDisplayPhase,
  phaseAutoAdvancesOnTick,
  resolveSyncedQuizClock,
  shouldShowPairingRanking,
} from "./quiz-display";

const started = (secondsAgo: number) =>
  new Date(Date.now() - secondsAgo * 1000).toISOString();

function clockQuiz(
  phase: "theme_intro" | "question" | "answers" | "results" | "next_question" | "start_countdown",
  secondsAgo: number,
  extras?: { autoplayEnabled?: boolean; currentIndex?: number; total?: number },
) {
  return {
    displayPhase: phase,
    phaseStartedAt: started(secondsAgo),
    updatedAt: started(secondsAgo),
    currentIndex: extras?.currentIndex ?? 0,
    total: extras?.total ?? 10,
    timing: DEFAULT_QUIZ_TIMING,
    autoplayEnabled: extras?.autoplayEnabled ?? false,
    hideRankingLastN: 5,
  };
}

describe("shouldShowPairingRanking", () => {
  it("hides ranking on the last N questions", () => {
    expect(shouldShowPairingRanking(0, 10, 5)).toBe(true);
    expect(shouldShowPairingRanking(4, 10, 5)).toBe(true);
    expect(shouldShowPairingRanking(5, 10, 5)).toBe(false);
    expect(shouldShowPairingRanking(9, 10, 5)).toBe(false);
  });

  it("hides ranking on every question when N covers the set", () => {
    expect(shouldShowPairingRanking(0, 3, 5)).toBe(false);
    expect(shouldShowPairingRanking(2, 3, 5)).toBe(false);
  });

  it("always shows ranking when N is 0", () => {
    expect(shouldShowPairingRanking(9, 10, 0)).toBe(true);
  });
});

describe("nextQuizDisplayPhase", () => {
  it("skips classifica on the last N questions", () => {
    expect(nextQuizDisplayPhase("results", 4, 10, 5)).toBe("next_question");
    expect(nextQuizDisplayPhase("results", 5, 10, 5)).toBe("advance_index");
    expect(nextQuizDisplayPhase("results", 9, 10, 5)).toBe("finish");
  });

  it("keeps the conductor sequence before results", () => {
    expect(nextQuizDisplayPhase("start_countdown", 0, 10)).toBe("theme_intro");
    expect(nextQuizDisplayPhase("theme_intro", 0, 10)).toBe("question");
    expect(nextQuizDisplayPhase("question", 0, 10)).toBe("answers");
    expect(nextQuizDisplayPhase("answers", 0, 10)).toBe("results");
  });
});

describe("resolveSyncedQuizClock", () => {
  it("holds theme and question until AVANTI", () => {
    const theme = resolveSyncedQuizClock(clockQuiz("theme_intro", 20));
    expect(theme.displayPhase).toBe("theme_intro");
    expect(theme.remaining).toBe(0);
    expect(theme.awaitingServerTick).toBe(false);

    const question = resolveSyncedQuizClock(clockQuiz("question", 20));
    expect(question.displayPhase).toBe("question");
    expect(question.remaining).toBe(0);
  });

  it("locks answers at zero without walking to results", () => {
    const clock = resolveSyncedQuizClock(clockQuiz("answers", 20));
    expect(clock.displayPhase).toBe("answers");
    expect(clock.remaining).toBe(0);
    expect(clock.awaitingServerTick).toBe(false);
  });

  it("asks the server to close start_countdown", () => {
    const clock = resolveSyncedQuizClock(clockQuiz("start_countdown", 8));
    expect(clock.displayPhase).toBe("start_countdown");
    expect(clock.remaining).toBe(0);
    expect(clock.awaitingServerTick).toBe(true);
  });
});

describe("phaseAutoAdvancesOnTick", () => {
  it("never auto-advances answers", () => {
    expect(phaseAutoAdvancesOnTick("answers", false)).toBe(false);
    expect(phaseAutoAdvancesOnTick("answers", true)).toBe(false);
  });

  it("always auto-advances the launch countdown", () => {
    expect(phaseAutoAdvancesOnTick("start_countdown", false)).toBe(true);
  });

  it("auto-advances hold phases only when Auto is on", () => {
    expect(phaseAutoAdvancesOnTick("question", false)).toBe(false);
    expect(phaseAutoAdvancesOnTick("question", true)).toBe(true);
  });
});
