import { describe, expect, it } from "vitest";
import {
  calculateSimpleAffinity,
  getBottomNonFinalistPairs,
  rankPairs,
  selectNextPair,
} from "./affinity";

describe("calculateSimpleAffinity", () => {
  it("returns 100 when all answers match", () => {
    const answers = { q1: "a", q2: "b" };
    const score = calculateSimpleAffinity(answers, answers, [
      { id: "q1", weight: 1 },
      { id: "q2", weight: 1 },
    ]);
    expect(score).toBe(100);
  });

  it("returns 0 when no answers match", () => {
    const score = calculateSimpleAffinity(
      { q1: "a" },
      { q1: "b" },
      [{ id: "q1", weight: 1 }],
    );
    expect(score).toBe(0);
  });

  it("returns 50 for half match", () => {
    const score = calculateSimpleAffinity(
      { q1: "a", q2: "b" },
      { q1: "a", q2: "c" },
      [
        { id: "q1", weight: 1 },
        { id: "q2", weight: 1 },
      ],
    );
    expect(score).toBe(50);
  });
});

describe("selectNextPair", () => {
  const pairs = [
    { id: "1", rank: 1, was_shown: false, is_eliminated: false },
    { id: "2", rank: 2, was_shown: false, is_eliminated: false },
    { id: "3", rank: 3, was_shown: true, is_eliminated: false },
  ];

  it("ranked picks lowest rank not shown", () => {
    const next = selectNextPair(pairs, "ranked", 3, 0);
    expect(next?.id).toBe("2");
  });

  it("returns null when none available", () => {
    const allShown = pairs.map((p) => ({ ...p, was_shown: true }));
    expect(selectNextPair(allShown, "random", 3, 0)).toBeNull();
  });
});

describe("getBottomNonFinalistPairs", () => {
  it("eliminates bottom pairs keeping top 3", () => {
    const pairs = [1, 2, 3, 4, 5].map((rank) => ({
      id: String(rank),
      rank,
      was_shown: false,
      is_eliminated: false,
    }));
    const toElim = getBottomNonFinalistPairs(pairs, 3);
    expect(toElim).toHaveLength(2);
    expect(toElim.map((p) => p.rank)).toEqual([5, 4]);
  });
});

describe("rankPairs", () => {
  it("sorts by score descending", () => {
    const ranked = rankPairs([
      { maleId: "a", femaleId: "b", score: 50 },
      { maleId: "c", femaleId: "d", score: 90 },
    ]);
    expect(ranked[0].score).toBe(90);
  });
});
