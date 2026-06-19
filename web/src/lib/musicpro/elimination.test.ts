import { describe, expect, it } from "vitest";
import {
  getFinalistsFromMetadata,
  getLastElimination,
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
