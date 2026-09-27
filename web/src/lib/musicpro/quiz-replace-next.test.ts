import { describe, expect, it } from "vitest";
import { pickSameCategoryReplacementId } from "@/lib/musicpro/quiz-state";

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
