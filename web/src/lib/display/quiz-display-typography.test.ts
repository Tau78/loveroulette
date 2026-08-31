import { describe, expect, it } from "vitest";
import {
  DISPLAY_TYPE_SCALE,
  QUIZ_ANSWER_TEXT_CLASS,
  QUIZ_QUESTION_TEXT_CLASS,
  QUIZ_THEME_TITLE_CLASS,
  scaledDisplayPx,
  scaledDisplayRem,
} from "@/lib/display/quiz-display-typography";

describe("quiz-display-typography scale", () => {
  it("applies the global +20% type scale", () => {
    expect(DISPLAY_TYPE_SCALE).toBe(1.2);
    expect(scaledDisplayPx(36)).toBe(43);
    expect(scaledDisplayPx(28)).toBe(34);
    expect(scaledDisplayRem(4.5)).toBe(5.4);
  });

  it("embeds scaled sizes into quiz class tokens", () => {
    expect(QUIZ_QUESTION_TEXT_CLASS).toContain("text-[43px]");
    expect(QUIZ_ANSWER_TEXT_CLASS).toContain("text-[34px]");
    expect(QUIZ_THEME_TITLE_CLASS).toContain("5.4rem");
  });
});
