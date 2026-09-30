import { describe, expect, it } from "vitest";
import {
  buildBalancedQuizLineup,
  lineupCategoryCounts,
} from "./quiz-lineup";

/** RNG deterministico: cicla 0, 0.1, 0.2, … */
function seqRandom(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[i % values.length] ?? 0;
    i += 1;
    return v;
  };
}

describe("buildBalancedQuizLineup", () => {
  const bank = [
    { id: "l1", category: "lifestyle" },
    { id: "l2", category: "lifestyle" },
    { id: "l3", category: "lifestyle" },
    { id: "r1", category: "romantic" },
    { id: "r2", category: "romantic" },
    { id: "r3", category: "romantic" },
    { id: "a1", category: "adventure" },
    { id: "a2", category: "adventure" },
    { id: "v1", category: "values" },
    { id: "v2", category: "values" },
    { id: "f1", category: "fun" },
    { id: "f2", category: "fun" },
  ];

  it("returns empty for count 0", () => {
    expect(buildBalancedQuizLineup(bank, 0, () => 0)).toEqual([]);
  });

  it("caps at bank size", () => {
    const ids = buildBalancedQuizLineup(bank, 100, () => 0);
    expect(ids).toHaveLength(bank.length);
    expect(new Set(ids).size).toBe(bank.length);
  });

  it("with N equal to category count touches every category once", () => {
    const ids = buildBalancedQuizLineup(bank, 5, seqRandom([0.9, 0.1, 0.5]));
    expect(ids).toHaveLength(5);
    const counts = lineupCategoryCounts(bank, ids);
    expect(counts.size).toBe(5);
    for (const n of counts.values()) expect(n).toBe(1);
  });

  it("with N=10 spreads ~2 per category (5 topics)", () => {
    const ids = buildBalancedQuizLineup(bank, 10, () => 0.25);
    expect(ids).toHaveLength(10);
    const counts = lineupCategoryCounts(bank, ids);
    expect(counts.size).toBe(5);
    for (const n of counts.values()) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    }
  });

  it("does not clump the first category of DB order", () => {
    // Prefisso naive sarebbe l1,l2,l3,r1,r2 — solo lifestyle+romantic.
    const ids = buildBalancedQuizLineup(bank, 5, () => 0);
    const counts = lineupCategoryCounts(bank, ids);
    expect(counts.has("lifestyle")).toBe(true);
    expect(counts.size).toBe(5);
  });

  it("interleaves categories instead of stacking one topic", () => {
    const ids = buildBalancedQuizLineup(bank, 10, () => 0);
    // Dopo round-robin con cat order fisso post-shuffle(0): no 3 uguali di fila
    // all’inizio del banco originale.
    const cats = ids.map(
      (id) => bank.find((q) => q.id === id)?.category ?? "?",
    );
    let maxRun = 1;
    let run = 1;
    for (let i = 1; i < cats.length; i++) {
      if (cats[i] === cats[i - 1]) {
        run += 1;
        maxRun = Math.max(maxRun, run);
      } else {
        run = 1;
      }
    }
    expect(maxRun).toBeLessThanOrEqual(2);
  });

  it("normalizes category casing", () => {
    const mixed = [
      { id: "a", category: "Lifestyle" },
      { id: "b", category: "FUN" },
      { id: "c", category: "lifestyle" },
    ];
    const ids = buildBalancedQuizLineup(mixed, 2, () => 0);
    const counts = lineupCategoryCounts(mixed, ids);
    expect(counts.size).toBe(2);
  });
});
