import { describe, expect, it } from "vitest";
import { orderQuestionResultsForDisplay } from "./quiz-results";
import { orderOptionsForQuizDisplay } from "./quiz-option-shuffle";
import type { QuestionResults } from "./quiz-results";

describe("orderQuestionResultsForDisplay", () => {
  it("riordina le % come a schermo ma i conteggi restano sull’optionId", () => {
    const results: QuestionResults = {
      questionId: "q-1",
      totalAnswers: 10,
      options: [
        { optionId: "adv", label: "Avventura", sortOrder: 0, count: 7, percent: 70 },
        { optionId: "m1", label: "Mezzo", sortOrder: 1, count: 1, percent: 10 },
        { optionId: "m2", label: "Altro", sortOrder: 2, count: 1, percent: 10 },
        { optionId: "pant", label: "Divano", sortOrder: 3, count: 1, percent: 10 },
      ],
    };

    const display = orderQuestionResultsForDisplay(results, "SERATA");
    const expectedIds = orderOptionsForQuizDisplay(
      results.options.map((o) => ({ id: o.optionId })),
      "SERATA",
      "q-1",
    ).map((o) => o.id);

    expect(display.options.map((o) => o.optionId)).toEqual(expectedIds);

    const adv = display.options.find((o) => o.optionId === "adv")!;
    expect(adv.count).toBe(7);
    expect(adv.percent).toBe(70);
    expect(display.totalAnswers).toBe(10);
  });
});
