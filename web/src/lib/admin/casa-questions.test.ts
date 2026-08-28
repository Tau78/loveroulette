import { describe, expect, it } from "vitest";
import {
  documentFromQuestions,
  parseQuestionsFile,
  questionsFromDocument,
} from "./casa-questions";

const sample = [
  {
    id: "q1",
    text: "In vacanza dove andate?",
    category: "lifestyle",
    options: ["Mare", "Montagna", "Città", "Casa"] as [
      string,
      string,
      string,
      string,
    ],
  },
];

describe("casa questions import/export", () => {
  it("round-trips the Generatore document", () => {
    const doc = documentFromQuestions("DEMO01", sample);
    expect(questionsFromDocument(doc)).toEqual(sample);
  });

  it("reads a flat JSON list", () => {
    const parsed = parseQuestionsFile(JSON.stringify(sample));
    expect(parsed[0]?.text).toBe("In vacanza dove andate?");
  });
});
