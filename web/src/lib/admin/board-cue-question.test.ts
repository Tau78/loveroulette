import { describe, expect, it } from "vitest";
import { boardCueQuestionIndex } from "./board-cue-question";

describe("boardCueQuestionIndex", () => {
  it("shows the first question before quiz and during start_countdown", () => {
    expect(
      boardCueQuestionIndex({
        quizActive: false,
        displayPhase: null,
        currentIndex: 0,
      }),
    ).toBe(0);
    expect(
      boardCueQuestionIndex({
        quizActive: true,
        displayPhase: "start_countdown",
        currentIndex: 0,
      }),
    ).toBe(0);
  });

  it("shows the next question from theme_intro onward", () => {
    expect(
      boardCueQuestionIndex({
        quizActive: true,
        displayPhase: "theme_intro",
        currentIndex: 0,
      }),
    ).toBe(1);
    expect(
      boardCueQuestionIndex({
        quizActive: true,
        displayPhase: "answers",
        currentIndex: 2,
      }),
    ).toBe(3);
  });
});
