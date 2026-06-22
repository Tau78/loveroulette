import { describe, expect, it } from "vitest";
import {
  getFinalistsFromMetadata,
  getLastElimination,
  selectFinalistCandidates,
} from "@/lib/musicpro/elimination";

describe("getLastElimination", () => {
  it("returns null for missing metadata", () => {
    expect(getLastElimination(null)).toBeNull();
    expect(getLastElimination({})).toBeNull();
  });

  it("parses valid elimination payload", () => {
    const result = getLastElimination({
      love_roulette_last_elimination: {
        maleNick: "Marco",
        femaleNick: "Sara",
        maleId: "m1",
        femaleId: "f1",
        pairId: "p1",
        rank: 5,
        updatedAt: "2026-06-19T12:00:00.000Z",
      },
    });

    expect(result).toEqual({
      maleNick: "Marco",
      femaleNick: "Sara",
      maleId: "m1",
      femaleId: "f1",
      pairId: "p1",
      rank: 5,
      updatedAt: "2026-06-19T12:00:00.000Z",
    });
  });
});

describe("getFinalistsFromMetadata", () => {
  it("returns sorted finalists", () => {
    const result = getFinalistsFromMetadata({
      love_roulette_finalists: [
        {
          pairId: "p3",
          maleNick: "C",
          femaleNick: "D",
          rank: 3,
          affinityScore: 70,
        },
        {
          pairId: "p1",
          maleNick: "A",
          femaleNick: "B",
          rank: 1,
          affinityScore: 90,
        },
      ],
    });

    expect(result.map((f) => f.rank)).toEqual([1, 3]);
    expect(result[0]?.maleNick).toBe("A");
  });
});

describe("selectFinalistCandidates", () => {
  it("keeps only extracted non-eliminated pairs", () => {
    const result = selectFinalistCandidates([
      {
        id: "p1",
        rank: 1,
        is_eliminated: false,
        was_shown: true,
        participant_male_id: "m1",
        participant_female_id: "f1",
        affinity_score: 0,
        is_finalist: false,
      },
      {
        id: "p2",
        rank: 2,
        is_eliminated: false,
        was_shown: false,
        participant_male_id: "m2",
        participant_female_id: "f2",
        affinity_score: 0,
        is_finalist: false,
      },
    ]);

    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });

  it("skips overlapping players from legacy was_shown rows", () => {
    const result = selectFinalistCandidates([
      {
        id: "p1",
        rank: 1,
        is_eliminated: false,
        was_shown: true,
        participant_male_id: "m1",
        participant_female_id: "f1",
        affinity_score: 0,
        is_finalist: false,
      },
      {
        id: "p2",
        rank: 2,
        is_eliminated: false,
        was_shown: true,
        participant_male_id: "m2",
        participant_female_id: "f1",
        affinity_score: 0,
        is_finalist: false,
      },
    ]);

    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });
});
