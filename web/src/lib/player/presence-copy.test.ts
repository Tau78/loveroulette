import { describe, expect, it } from "vitest";
import {
  PLAYER_RESULTS_ANSWERED,
  PLAYER_RESULTS_MISSED,
} from "@/lib/player/public-copy";
import { playerPresenceSubtitle } from "@/lib/player/presence-copy";

describe("playerPresenceSubtitle", () => {
  it("returns empty subtitle in lobby", () => {
    expect(playerPresenceSubtitle("lobby")).toBe("");
  });

  it("shows active quiz copy when game started", () => {
    expect(playerPresenceSubtitle("quiz", { quizPhase: "theme_intro" })).toContain(
      "schermi",
    );
    expect(playerPresenceSubtitle("quiz", { quizPhase: "answers" })).toContain(
      "Rispondi",
    );
  });

  it("never shows lobby waiting text during quiz", () => {
    const copy = playerPresenceSubtitle("quiz", { quizPhase: "answers" });
    expect(copy.toLowerCase()).not.toContain("attesa dell'animatore");
  });

  it("uses statistics copy during results without tempo scaduto", () => {
    expect(playerPresenceSubtitle("quiz", { quizPhase: "results" })).toBe(
      PLAYER_RESULTS_ANSWERED,
    );
  });
});

describe("public copy", () => {
  it("distinguishes answered vs missed results", () => {
    expect(PLAYER_RESULTS_ANSWERED).not.toContain("Tempo scaduto");
    expect(PLAYER_RESULTS_MISSED).toContain("Tempo scaduto");
  });
});
