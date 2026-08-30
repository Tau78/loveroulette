import { describe, expect, it } from "vitest";
import { pickMostPolarizing, polarizingScore } from "./polarizing";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";

function results(
  id: string,
  percents: number[],
  totalAnswers = 40,
): QuestionResults {
  return {
    questionId: id,
    totalAnswers,
    options: percents.map((percent, i) => ({
      optionId: `${id}-${i}`,
      label: `Opzione ${i + 1}`,
      sortOrder: i,
      count: Math.round((percent / 100) * totalAnswers),
      percent,
    })),
  };
}

describe("polarizingScore", () => {
  it("scores tight races higher than landslides", () => {
    const tight = polarizingScore(results("t", [28, 26, 24, 22]));
    const landslide = polarizingScore(results("l", [80, 10, 5, 5]));
    expect(tight).toBeGreaterThan(landslide);
  });

  it("rejects low sample or near-unanimous", () => {
    expect(polarizingScore(results("s", [50, 50], 2))).toBe(-1);
    expect(polarizingScore(results("u", [96, 2, 1, 1]))).toBe(-1);
  });
});

describe("pickMostPolarizing", () => {
  it("picks the closest top-two split", () => {
    const pick = pickMostPolarizing([
      results("landslide", [90, 5, 3, 2]),
      results("split", [30, 28, 22, 20]),
      results("mid", [55, 25, 12, 8]),
    ]);
    expect(pick?.questionId).toBe("split");
  });

  it("returns null when nothing qualifies", () => {
    expect(pickMostPolarizing([results("u", [100, 0, 0, 0])])).toBeNull();
  });
});
