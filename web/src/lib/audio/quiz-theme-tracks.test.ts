import { describe, expect, it } from "vitest";
import {
  quizBedTrackForCategory,
  trackIdForQuizPhase,
} from "./quiz-theme-tracks";

describe("quiz-theme-tracks", () => {
  it("maps known categories to a bed track", () => {
    expect(quizBedTrackForCategory("romantic")).toBe("LR_02_Quiz_Tension");
    expect(quizBedTrackForCategory("lifestyle")).toBe("LR_02_Quiz_Tension");
  });

  it("uses theme bed on theme_intro and question", () => {
    expect(trackIdForQuizPhase("theme_intro", "adventure")).toBe(
      "LR_02_Quiz_Tension",
    );
    expect(trackIdForQuizPhase("question", "fun")).toBe("LR_02_Quiz_Tension");
  });

  it("uses results reveal bed on results phase", () => {
    expect(trackIdForQuizPhase("results", "romantic")).toBe(
      "LR_25_Quiz_Results_Reveal",
    );
  });
});
