import { describe, expect, it } from "vitest";
import demo01FullDocument from "../../../data/generatore/DEMO01-manche-full-v1.json";
import exampleDocument from "../../../data/generatore/example-manche-v1.json";
import type { GeneratoreMancheDocument } from "./types";
import {
  snapshotGeneratoreContent,
  validateMancheDocument,
} from "./manche";

const example = exampleDocument as GeneratoreMancheDocument;
const demo01Full = demo01FullDocument as GeneratoreMancheDocument;

function countMancheQuestions(document: GeneratoreMancheDocument): number {
  return document.manche.reduce(
    (total, manche) => total + manche.questions.length,
    0,
  );
}

describe("validateMancheDocument", () => {
  it("accepts the example manche document", () => {
    expect(validateMancheDocument(example)).toBeNull();
  });

  it("accepts the DEMO01 full 27-question manche document", () => {
    expect(validateMancheDocument(demo01Full)).toBeNull();
    expect(countMancheQuestions(demo01Full)).toBe(27);
  });

  it("rejects documents without four options per question", () => {
    const invalid: GeneratoreMancheDocument = {
      ...example,
      manche: [
        {
          ...example.manche[0],
          questions: [
            {
              ...example.manche[0].questions[0],
              options: example.manche[0].questions[0].options.slice(0, 3),
            },
          ],
        },
      ],
    };

    expect(validateMancheDocument(invalid)).toMatch(/4 opzioni/);
  });
});

describe("import/export round-trip content", () => {
  it("preserves manche content after simulated re-export", () => {
    const reExported: GeneratoreMancheDocument = {
      format: "love_roulette_generatore_v1",
      version: 1,
      event_code: "DEMO01",
      exported_at: "2026-06-19T13:00:00.000Z",
      manche: example.manche.map((manche) => ({
        ...manche,
        questions: manche.questions.map((question, questionIndex) => ({
          ...question,
          id: `db-question-${questionIndex + 1}`,
          options: question.options.map((option, optionIndex) => ({
            ...option,
            id: `db-option-${questionIndex + 1}-${optionIndex}`,
          })),
        })),
      })),
      meta: example.meta,
    };

    expect(snapshotGeneratoreContent(example)).toEqual(
      snapshotGeneratoreContent(reExported),
    );
  });
});
