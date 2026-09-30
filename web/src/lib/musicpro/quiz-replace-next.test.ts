import { describe, expect, it } from "vitest";
import {
  applyLineupReplacement,
  pickLineupReplacement,
  pickSameCategoryReplacementId,
} from "@/lib/musicpro/quiz-state";

describe("pickSameCategoryReplacementId", () => {
  const bank = [
    { id: "a1", category: "Lifestyle" },
    { id: "a2", category: "lifestyle" },
    { id: "a3", category: "Lifestyle" },
    { id: "b1", category: "Musica" },
  ];

  it("picks another unused question in the same category", () => {
    const ids = ["a1", "a2", "b1"];
    const picked = pickSameCategoryReplacementId(bank, ids, 1, () => 0);
    expect(picked).toBe("a3");
  });

  it("returns null when no spare same-category question exists", () => {
    const ids = ["a1", "a2", "a3"];
    expect(pickSameCategoryReplacementId(bank, ids, 0, () => 0)).toBeNull();
  });

  it("returns null when there is no next slot", () => {
    expect(pickSameCategoryReplacementId(bank, ["a1"], 1, () => 0)).toBeNull();
  });
});

describe("pickLineupReplacement", () => {
  const bank = [
    { id: "a1", category: "lifestyle" },
    { id: "a2", category: "lifestyle" },
    { id: "b1", category: "fun" },
    { id: "b2", category: "fun" },
  ];

  it("prefers same-category unused", () => {
    expect(pickLineupReplacement(bank, ["a1", "b1"], 0, () => 0)).toEqual({
      kind: "replace",
      questionId: "a2",
    });
  });

  it("falls back to any unused category", () => {
    expect(pickLineupReplacement(bank, ["a1", "a2", "b1"], 0, () => 0)).toEqual(
      {
        kind: "replace",
        questionId: "b2",
      },
    );
  });

  it("swaps when the lineup already uses the whole bank", () => {
    const ids = ["a1", "a2", "b1", "b2"];
    const picked = pickLineupReplacement(bank, ids, 0, () => 0);
    expect(picked).toEqual({ kind: "swap", withIndex: 1 });
    expect(applyLineupReplacement(ids, 0, picked!)).toEqual([
      "a2",
      "a1",
      "b1",
      "b2",
    ]);
  });
});
