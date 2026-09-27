import { describe, expect, it } from "vitest";
import { formatQuestionReportText } from "./question-report";

describe("formatQuestionReportText", () => {
  it("includes question, options and event", () => {
    const text = formatQuestionReportText({
      eventCode: "DEMO01",
      venueName: "Club Test",
      category: "Lifestyle",
      body: "Domenica mattina tipica?",
      options: ["Sport", "Dormire", "Brunch", "Progetti"],
      cueIndex: 0,
      questionId: "q1",
    });
    expect(text).toContain("DEMO01");
    expect(text).toContain("Domenica mattina tipica?");
    expect(text).toContain("A) Sport");
    expect(text).toContain("Q1");
  });
});
