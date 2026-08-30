import { describe, expect, it } from "vitest";
import {
  isQuizThemeSlideCategory,
  resolveThemeSlideSrc,
  QUIZ_THEME_SLIDE_CATEGORIES,
} from "@/lib/display/quiz-theme-slides";

describe("quiz-theme-slides", () => {
  it("maps every known category to a public asset", () => {
    for (const id of QUIZ_THEME_SLIDE_CATEGORIES) {
      expect(isQuizThemeSlideCategory(id)).toBe(true);
      expect(resolveThemeSlideSrc(id)).toBe(
        `/grafiche/theme-slides/${id}.jpg`,
      );
    }
  });

  it("returns null for unknown categories", () => {
    expect(resolveThemeSlideSrc("unknown")).toBeNull();
    expect(resolveThemeSlideSrc(null)).toBeNull();
    expect(isQuizThemeSlideCategory("")).toBe(false);
  });
});
