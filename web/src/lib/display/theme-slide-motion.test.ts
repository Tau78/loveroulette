import { describe, expect, it } from "vitest";
import { QUIZ_THEME_SLIDE_CATEGORIES } from "@/lib/display/quiz-theme-slides";
import {
  resolveThemeArtMotion,
  resolveThemeTextMotion,
  THEME_ART_MOTION,
  THEME_TEXT_MOTION,
} from "@/lib/display/theme-slide-motion";

describe("theme-slide-motion", () => {
  it("defines distinct art motion for every category", () => {
    const signatures = QUIZ_THEME_SLIDE_CATEGORIES.map((id) =>
      JSON.stringify(THEME_ART_MOTION[id].animate),
    );
    expect(new Set(signatures).size).toBe(QUIZ_THEME_SLIDE_CATEGORIES.length);
  });

  it("defines distinct title entrances for every category", () => {
    const signatures = QUIZ_THEME_SLIDE_CATEGORIES.map((id) =>
      JSON.stringify(THEME_TEXT_MOTION[id].title.initial),
    );
    expect(new Set(signatures).size).toBe(QUIZ_THEME_SLIDE_CATEGORIES.length);
  });

  it("falls back for unknown categories", () => {
    expect(resolveThemeArtMotion("unknown")).toEqual(THEME_ART_MOTION.lifestyle);
    expect(resolveThemeTextMotion(null)).toEqual(THEME_TEXT_MOTION.lifestyle);
  });
});
