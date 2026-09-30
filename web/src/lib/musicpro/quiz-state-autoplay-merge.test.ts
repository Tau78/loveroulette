import { describe, expect, it } from "vitest";
import {
  mergeQuizWriteWithExisting,
  type QuizSessionState,
} from "./quiz-state";
import { DEFAULT_QUIZ_TIMING } from "./quiz-display";

function baseQuiz(
  overrides: Partial<QuizSessionState> = {},
): QuizSessionState {
  return {
    questionIds: ["q1", "q2"],
    currentIndex: 0,
    total: 2,
    source: "event",
    autoplaySeconds: 15,
    autoplayEnabled: false,
    updatedAt: "2026-01-01T00:00:00.000Z",
    displayPhase: "theme_intro",
    phaseStartedAt: "2026-01-01T00:00:00.000Z",
    timing: DEFAULT_QUIZ_TIMING,
    hideRankingLastN: 5,
    rankingEveryN: 5,
    skipResults: false,
    ...overrides,
  };
}

describe("mergeQuizWriteWithExisting", () => {
  it("keeps autoplay from DB when a stale tick advances phase", () => {
    const existing = baseQuiz({
      autoplayEnabled: true,
      updatedAt: "2026-01-01T00:00:05.000Z",
    });
    const tickWrite = baseQuiz({
      autoplayEnabled: false,
      displayPhase: "question",
      phaseStartedAt: "2026-01-01T00:00:06.000Z",
      updatedAt: "2026-01-01T00:00:06.000Z",
    });
    expect(mergeQuizWriteWithExisting(existing, tickWrite).autoplayEnabled).toBe(
      true,
    );
    expect(mergeQuizWriteWithExisting(existing, tickWrite).displayPhase).toBe(
      "question",
    );
  });

  it("applies autoplay onto newer phase when setAutoplay used a stale snapshot", () => {
    const existing = baseQuiz({
      displayPhase: "question",
      phaseStartedAt: "2026-01-01T00:00:06.000Z",
      updatedAt: "2026-01-01T00:00:06.000Z",
      autoplayEnabled: false,
    });
    const staleAutoplay = baseQuiz({
      displayPhase: "theme_intro",
      phaseStartedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:07.000Z",
      autoplayEnabled: true,
    });
    const merged = mergeQuizWriteWithExisting(existing, staleAutoplay);
    expect(merged.displayPhase).toBe("question");
    expect(merged.autoplayEnabled).toBe(true);
  });

  it("lets same-phase autoplay patch win", () => {
    const existing = baseQuiz({ autoplayEnabled: false });
    const patch = baseQuiz({
      autoplayEnabled: true,
      updatedAt: "2026-01-01T00:00:01.000Z",
    });
    expect(mergeQuizWriteWithExisting(existing, patch).autoplayEnabled).toBe(
      true,
    );
  });
});
