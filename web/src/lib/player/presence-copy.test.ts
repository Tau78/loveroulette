import { describe, expect, it } from "vitest";
import {
  PLAYER_RESULTS_ANSWERED,
  PLAYER_RESULTS_MISSED,
  playerAnswerTimeLabel,
} from "@/lib/player/public-copy";
import {
  CLOSED_COPY,
  ELIMINATION_COPY,
  FINALS_COPY,
} from "@/lib/game/late-game-copy";
import { playerPresenceSubtitle } from "@/lib/player/presence-copy";

describe("playerPresenceSubtitle", () => {
  it("returns empty subtitle in lobby", () => {
    expect(playerPresenceSubtitle("lobby")).toBe("");
  });

  it("shows theme intro copy when card is hidden", () => {
    expect(playerPresenceSubtitle("quiz", { quizPhase: "theme_intro" })).toContain(
      "schermi",
    );
  });

  it("suppresses hero copy when quiz card is visible", () => {
    expect(
      playerPresenceSubtitle("quiz", {
        quizPhase: "answers",
        suppressForCard: true,
      }),
    ).toBe("");
    expect(
      playerPresenceSubtitle("quiz", {
        quizPhase: "results",
        suppressForCard: true,
      }),
    ).toBe("");
  });

  it("suppresses hero copy when voting card is visible", () => {
    expect(
      playerPresenceSubtitle("finals", {
        votingOpen: true,
        suppressForCard: true,
      }),
    ).toBe("");
  });

  it("never shows lobby waiting text during quiz", () => {
    const copy = playerPresenceSubtitle("quiz", { quizPhase: "answers" });
    expect(copy.toLowerCase()).not.toContain("attesa dell'animatore");
  });

  it("uses game-show copy for late phases", () => {
    expect(playerPresenceSubtitle("elimination")).toBe(
      ELIMINATION_COPY.playerSubtitle,
    );
    expect(
      playerPresenceSubtitle("finals", { votingOpen: true }),
    ).toBe(FINALS_COPY.playerVoting);
    expect(playerPresenceSubtitle("closed")).toBe(CLOSED_COPY.playerSubtitle);
    expect(playerPresenceSubtitle("unknown" as "lobby")).toBe(
      "Segui gli schermi in sala",
    );
  });
});

describe("public copy", () => {
  it("distinguishes answered vs missed results", () => {
    expect(PLAYER_RESULTS_ANSWERED).not.toContain("Tempo scaduto");
    expect(PLAYER_RESULTS_MISSED).toContain("Tempo scaduto");
  });

  it("formats answer time in Italian", () => {
    expect(playerAnswerTimeLabel(1)).toBe("IN 1 SECONDO");
    expect(playerAnswerTimeLabel(8)).toBe("IN 8 SECONDI");
  });
});
