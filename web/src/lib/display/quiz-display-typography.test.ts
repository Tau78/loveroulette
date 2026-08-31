import { describe, expect, it } from "vitest";
import {
  DISPLAY_TYPE_SCALE,
  QUIZ_ANSWER_TEXT_CLASS,
  QUIZ_QUESTION_TEXT_CLASS,
  QUIZ_THEME_TITLE_CLASS,
  scaledDisplayPx,
  scaledDisplayRem,
} from "@/lib/display/quiz-display-typography";
import {
  clampTypeScale,
  formatTypeScalePercent,
  snapTypeScale,
} from "@/lib/display/type-scale";

describe("quiz-display-typography scale", () => {
  it("keeps the default display scale at +20%", () => {
    expect(DISPLAY_TYPE_SCALE).toBe(1.8);
    expect(scaledDisplayPx(36)).toBe(65);
    expect(scaledDisplayPx(28)).toBe(50);
    expect(scaledDisplayRem(4.5)).toBe(8.1);
  });

  it("uses CSS-var token classes for runtime settings", () => {
    expect(QUIZ_QUESTION_TEXT_CLASS).toContain("lr-dt-36");
    expect(QUIZ_ANSWER_TEXT_CLASS).toContain("lr-dt-28");
    expect(QUIZ_THEME_TITLE_CLASS).toContain("lr-dt-theme-title");
  });

  it("clamps and snaps type scale presets", () => {
    expect(clampTypeScale(0.5)).toBe(0.8);
    expect(clampTypeScale(2.4)).toBe(2);
    expect(snapTypeScale(1.24)).toBe(1.2);
    expect(formatTypeScalePercent(1.8)).toBe("180%");
  });
});
