import { describe, expect, it } from "vitest";
import { unansweredDelta } from "./casa-quiz-settings";

describe("obbligo di risposta", () => {
  it("no malus when optional", () => {
    expect(unansweredDelta(false)).toBe(0);
  });

  it("malus when required", () => {
    expect(unansweredDelta(true)).toBe(-1);
  });
});
