import { describe, expect, it } from "vitest";
import { DEFAULT_QUIZ_TIMING } from "./quiz-display";
import {
  nextQuizDisplayPhase,
  phaseAutoAdvancesOnTick,
  resolveSyncedQuizClock,
  shouldShowIntermediateRanking,
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
  it("still computes last-N (legacy helper)", () => {
    expect(shouldShowPairingRanking(0, 10, 5)).toBe(true);
    expect(shouldShowPairingRanking(5, 10, 5)).toBe(false);
  });
});

describe("shouldShowIntermediateRanking", () => {
  it("with 15 / ogni 5 / al buio 5 → classifica a 5 e 10, non a 15", () => {
    const base = {
      total: 15,
      rankingEveryN: 5,
      hideRankingLastN: 5,
    };
    expect(shouldShowIntermediateRanking({ ...base, completedCount: 5 })).toBe(
      true,
    );
    expect(shouldShowIntermediateRanking({ ...base, completedCount: 10 })).toBe(
      true,
    );
    expect(shouldShowIntermediateRanking({ ...base, completedCount: 15 })).toBe(
      false,
    );
    expect(shouldShowIntermediateRanking({ ...base, completedCount: 4 })).toBe(
      false,
    );
  });
});

describe("nextQuizDisplayPhase — binario + classifiche intermedie", () => {
  it("tema → domanda → risposte → %", () => {
    expect(nextQuizDisplayPhase("theme_intro", 0, 10)).toBe("question");
    expect(nextQuizDisplayPhase("question", 0, 10)).toBe("answers");
    expect(nextQuizDisplayPhase("answers", 0, 10)).toBe("results");
  });

  it("da % → hold classifica ogni N (non sull’ultima)", () => {
    // 15 domande, ogni 5, al buio 5 → dopo Q5 (index 4) e Q10 (index 9)
    expect(nextQuizDisplayPhase("results", 4, 15, 5, 5)).toBe("next_question");
    expect(nextQuizDisplayPhase("results", 9, 15, 5, 5)).toBe("next_question");
    expect(nextQuizDisplayPhase("results", 0, 15, 5, 5)).toBe("advance_index");
    expect(nextQuizDisplayPhase("results", 14, 15, 5, 5)).toBe("finish");
  });

  it("start_countdown still leads to theme", () => {
    expect(nextQuizDisplayPhase("start_countdown", 0, 10)).toBe("theme_intro");
  });

  it("Al Buio live (skipResults): answers salta le %", () => {
    expect(nextQuizDisplayPhase("answers", 0, 15, 5, 5, true)).toBe(
      "advance_index",
    );
    expect(nextQuizDisplayPhase("answers", 4, 15, 5, 5, true)).toBe(
      "next_question",
    );
    expect(nextQuizDisplayPhase("answers", 14, 15, 5, 5, true)).toBe("finish");
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

  it("asks the server to close answers → results when the timer is done", () => {
    const clock = resolveSyncedQuizClock(clockQuiz("answers", 20));
    expect(clock.displayPhase).toBe("answers");
    expect(clock.remaining).toBe(0);
    expect(clock.awaitingServerTick).toBe(true);
  });

  it("asks the server to close start_countdown", () => {
    const clock = resolveSyncedQuizClock(clockQuiz("start_countdown", 8));
    expect(clock.displayPhase).toBe("start_countdown");
    expect(clock.remaining).toBe(0);
    expect(clock.awaitingServerTick).toBe(true);
  });
});

describe("phaseAutoAdvancesOnTick", () => {
  it("auto-advances answers (timer → %)", () => {
    expect(phaseAutoAdvancesOnTick("answers", false)).toBe(true);
    expect(phaseAutoAdvancesOnTick("answers", true)).toBe(true);
  });

  it("always auto-advances the launch countdown", () => {
    expect(phaseAutoAdvancesOnTick("start_countdown", false)).toBe(true);
  });

  it("auto-advances hold phases only when Auto is on", () => {
    expect(phaseAutoAdvancesOnTick("question", false)).toBe(false);
    expect(phaseAutoAdvancesOnTick("question", true)).toBe(true);
    expect(phaseAutoAdvancesOnTick("results", false)).toBe(false);
  });
});
