import { describe, expect, it } from "vitest";
import { quizAvantiState } from "./quiz-avanti-gate";

describe("quizAvantiState", () => {
  it("disables during start countdown and answers while timer runs", () => {
    expect(quizAvantiState("start_countdown", 3).enabled).toBe(false);
    expect(quizAvantiState("answers", 15).enabled).toBe(false);
  });

  it("enables answers at 0 so AVANTI can force-close if tick stalls", () => {
    expect(quizAvantiState("answers", 0).enabled).toBe(true);
    expect(quizAvantiState("answers", 0).hint).toMatch(/AVANTI/i);
  });

  it("shows Attendi countdown chip copy while running", () => {
    expect(quizAvantiState("start_countdown", 3).hint).toBe(
      "Attendi countdown · 3s",
    );
    expect(quizAvantiState("answers", 12).hint).toBe("Attendi countdown · 12s");
  });

  it("enables on hold phases (tema, domanda, %)", () => {
    expect(quizAvantiState("theme_intro", 0).enabled).toBe(true);
    expect(quizAvantiState("question", 0).enabled).toBe(true);
    expect(quizAvantiState("results", 0).enabled).toBe(true);
    expect(quizAvantiState("next_question", 0).enabled).toBe(true);
    expect(quizAvantiState("start_countdown", 0).enabled).toBe(true);
  });
});
