import { describe, expect, it } from "vitest";
import {
  computePairRevealStatsFromMaps,
} from "@/lib/matching/pair-reveal-stats";
import { pairTrialStatsFromArchive } from "@/lib/musicpro/special-trial-archive";

describe("pair reveal stats", () => {
  it("counts matching answers and picks earliest mutual match", () => {
    const meta = [
      { id: "q1", weight: 1, category: "life" },
      { id: "q2", weight: 1, category: "life" },
      { id: "q3", weight: 1, category: "life" },
    ];
    const text = new Map([
      ["q1", "Prima domanda"],
      ["q2", "Seconda domanda"],
      ["q3", "Terza domanda"],
    ]);
    const a = { q1: "o1", q2: "o2", q3: "o3" };
    const b = { q1: "o1", q2: "oX", q3: "o3" };

    const stats = computePairRevealStatsFromMaps(a, b, meta, text);
    expect(stats.sameAnswers).toBe(2);
    expect(stats.questionsCompared).toBe(3);
    expect(stats.fastestMatchQuestionText).toBe("Prima domanda");
  });

  it("sums trial votes when both players were on stage", () => {
    const archive = [
      {
        challengeId: "dance" as const,
        closedAt: "2026-01-01T00:00:00.000Z",
        participantIds: ["a", "b", "c"],
        votes: { a: 3, b: 5, c: 1 },
      },
      {
        challengeId: "gaze" as const,
        closedAt: "2026-01-01T01:00:00.000Z",
        participantIds: ["a", "x"],
        votes: { a: 2, x: 4 },
      },
    ];
    expect(pairTrialStatsFromArchive(archive, "a", "b")).toEqual({
      trialsCount: 1,
      trialsScore: 8,
    });
  });
});
