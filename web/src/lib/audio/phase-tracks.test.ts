import { describe, expect, it } from "vitest";
import { SPECIAL_TRIAL_BED_ID, trackIdForPhase } from "./phase-tracks";

describe("trackIdForPhase special trial", () => {
  it("uses countdown bed while special trial is running or closing", () => {
    expect(
      trackIdForPhase("quiz", "next_question", null, "fun", "running"),
    ).toBe(SPECIAL_TRIAL_BED_ID);
    expect(
      trackIdForPhase("quiz", "theme_intro", null, "romantic", "closing"),
    ).toBe(SPECIAL_TRIAL_BED_ID);
  });

  it("keeps quiz beds when trial is only booked/setup/results", () => {
    expect(
      trackIdForPhase("quiz", "answers", null, null, "setup"),
    ).toBe("LR_03_Quiz_Countdown");
    expect(
      trackIdForPhase("quiz", "next_question", null, null, "booked"),
    ).not.toBeNull();
  });
});
