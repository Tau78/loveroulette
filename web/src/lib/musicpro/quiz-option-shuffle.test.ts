import { describe, expect, it } from "vitest";
import {
  orderOptionsForQuizDisplay,
  seededShuffleIds,
  quizOptionShuffleSeed,
} from "./quiz-option-shuffle";

describe("quiz-option-shuffle", () => {
  const opts = [
    { id: "adv", label: "Avventura", sortOrder: 0 },
    { id: "mid1", label: "Mezzo 1", sortOrder: 1 },
    { id: "mid2", label: "Mezzo 2", sortOrder: 2 },
    { id: "pant", label: "Divano", sortOrder: 3 },
  ];

  it("is deterministic for the same event+question", () => {
    const a = orderOptionsForQuizDisplay(opts, "DEMO01", "q-1");
    const b = orderOptionsForQuizDisplay(opts, "DEMO01", "q-1");
    expect(a.map((o) => o.id)).toEqual(b.map((o) => o.id));
  });

  it("can differ across questions (usually not A=avventura forever)", () => {
    const orders = ["q-a", "q-b", "q-c", "q-d", "q-e", "q-f", "q-g", "q-h"].map(
      (qid) => orderOptionsForQuizDisplay(opts, "DEMO01", qid).map((o) => o.id),
    );
    const firstIsAdv = orders.filter((ids) => ids[0] === "adv").length;
    // Con 8 seed diversi non devono essere TUTTI con avventura in A.
    expect(firstIsAdv).toBeLessThan(8);
  });

  it("preserves every option id (scoring-safe)", () => {
    const shuffled = orderOptionsForQuizDisplay(opts, "X", "Y");
    expect(new Set(shuffled.map((o) => o.id))).toEqual(
      new Set(opts.map((o) => o.id)),
    );
    expect(shuffled).toHaveLength(opts.length);
  });

  it("seed includes event and question", () => {
    expect(quizOptionShuffleSeed("demo01", "q")).toBe("DEMO01::q");
    expect(seededShuffleIds(["a", "b", "c", "d"], "s1")).toHaveLength(4);
  });
});
