import { describe, expect, it } from "vitest";
import {
  quizBedTrackForCategory,
  trackIdForQuizPhase,
} from "./quiz-theme-tracks";

describe("quiz-theme-tracks", () => {
  it("maps known categories to a dedicated bed track", () => {
    expect(quizBedTrackForCategory("romantic")).toBe("LR_02_Quiz_Romantic");
    expect(quizBedTrackForCategory("lifestyle")).toBe("LR_02_Quiz_Lifestyle");
    expect(quizBedTrackForCategory("fun")).toBe("LR_02_Quiz_Fun");
    expect(quizBedTrackForCategory("adventure")).toBe("LR_02_Quiz_Adventure");
    expect(quizBedTrackForCategory("values")).toBe("LR_02_Quiz_Values");
    expect(quizBedTrackForCategory("intimacy")).toBe("LR_02_Quiz_Intimacy");
    expect(quizBedTrackForCategory("libri")).toBe("LR_02_Quiz_Values");
    expect(quizBedTrackForCategory("cinema")).toBe("LR_02_Quiz_Fun");
    expect(quizBedTrackForCategory("musica")).toBe("LR_02_Quiz_Romantic");
  });

  it("uses theme bed on theme_intro and question", () => {
    expect(trackIdForQuizPhase("theme_intro", "adventure")).toBe(
      "LR_02_Quiz_Adventure",
    );
    expect(trackIdForQuizPhase("question", "fun")).toBe("LR_02_Quiz_Fun");
  });

  it("switches to countdown bed when answers appear", () => {
    expect(trackIdForQuizPhase("answers", "romantic")).toBe(
      "LR_03_Quiz_Countdown",
    );
  });

  it("silences bed during launch countdown (file one-shot)", () => {
    expect(trackIdForQuizPhase("start_countdown", "romantic")).toBeNull();
  });

  it("uses long hold bed on results (reveal hit is one-shot elsewhere)", () => {
    expect(trackIdForQuizPhase("results", "romantic")).toBe(
      "LR_02_Quiz_Romantic",
    );
  });
});
