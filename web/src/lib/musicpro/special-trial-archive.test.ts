import { describe, expect, it } from "vitest";
import {
  appendSpecialTrialArchive,
  getSpecialTrialArchive,
} from "./special-trial-archive";

describe("special trial archive", () => {
  it("round-trips archive entries in metadata", () => {
    const meta = appendSpecialTrialArchive({}, {
      challengeId: "dance",
      closedAt: "2026-01-01T00:00:00.000Z",
      participantIds: ["p1", "p2"],
      votes: { p1: 2, p2: 3 },
    });
    const list = getSpecialTrialArchive(meta);
    expect(list).toHaveLength(1);
    expect(list[0]?.votes.p2).toBe(3);
  });
});
