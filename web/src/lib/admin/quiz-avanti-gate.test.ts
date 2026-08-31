import { describe, expect, it } from "vitest";
import { quizAvantiState } from "./quiz-avanti-gate";

describe("quizAvantiState", () => {
  it("disables during start countdown and answers timer", () => {
    expect(quizAvantiState("start_countdown", 3).enabled).toBe(false);
    expect(quizAvantiState("answers", 15).enabled).toBe(false);
    expect(quizAvantiState("answers", 1).enabled).toBe(false);
  });

  it("enables on hold phases and after answers lock", () => {
    expect(quizAvantiState("theme_intro", 0).enabled).toBe(true);
    expect(quizAvantiState("question", 0).enabled).toBe(true);
    expect(quizAvantiState("answers", 0).enabled).toBe(true);
    expect(quizAvantiState("results", 0).enabled).toBe(true);
    expect(quizAvantiState("next_question", 0).enabled).toBe(true);
    expect(quizAvantiState("start_countdown", 0).enabled).toBe(true);
  });
});
