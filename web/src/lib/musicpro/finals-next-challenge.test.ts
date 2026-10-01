import { describe, expect, it } from "vitest";
import { nextFinalsChallengeId } from "./finals-next-challenge";
import type { FinalsShowState } from "./finals-show";

function show(completed: FinalsShowState["completedChallenges"]): FinalsShowState {
  return {
    phase: "idle",
    phaseStartedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    challengeId: null,
    coupleIndex: 0,
    cumulativeScores: {},
    completedChallenges: completed,
    tieDetected: false,
    finalists: [],
  };
}

describe("nextFinalsChallengeId", () => {
  it("returns first challenge when none completed", () => {
    expect(nextFinalsChallengeId(show([]))).toBe("dance");
  });

  it("skips completed challenges", () => {
    expect(nextFinalsChallengeId(show(["dance", "kiss"]))).toBe("declaration");
  });

  it("returns null when all done", () => {
    expect(
      nextFinalsChallengeId(
        show(["dance", "kiss", "declaration", "kamasutra"]),
      ),
    ).toBeNull();
  });
});
