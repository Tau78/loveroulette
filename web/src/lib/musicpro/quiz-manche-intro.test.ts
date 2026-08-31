import { describe, expect, it } from "vitest";
import {
  isMancheThemeIntroForIndex,
  resolvePhaseAfterQuestionAdvance,
} from "@/lib/musicpro/quiz-display";
import type { QuizMancheTheme } from "@/lib/musicpro/quiz-display";

const MANCHE: QuizMancheTheme[] = [
  {
    mancheId: "m1",
    order: 1,
    title: "Stile di vita",
    questionIds: ["q01", "q02", "q03"],
  },
  {
    mancheId: "m2",
    order: 2,
    title: "Romanticismo",
    questionIds: ["q04", "q05"],
  },
];

describe("isMancheThemeIntroForIndex", () => {
  it("shows manche intro only on first question of each block", () => {
    expect(isMancheThemeIntroForIndex(["q01", "q02", "q04"], 0, MANCHE)).toBe(
      true,
    );
    expect(isMancheThemeIntroForIndex(["q01", "q02", "q04"], 1, MANCHE)).toBe(
      false,
    );
    expect(isMancheThemeIntroForIndex(["q01", "q02", "q04"], 2, MANCHE)).toBe(
      true,
    );
  });

  it("without manche metadata only index 0 is a theme intro", () => {
    expect(isMancheThemeIntroForIndex(["a", "b"], 0, null)).toBe(true);
    expect(isMancheThemeIntroForIndex(["a", "b"], 1, null)).toBe(false);
  });
});

describe("resolvePhaseAfterQuestionAdvance", () => {
  it("always restarts from theme intro (slide argomento) for the next question", () => {
    expect(
      resolvePhaseAfterQuestionAdvance(["q01", "q02", "q03"], 1, MANCHE),
    ).toBe("theme_intro");
    expect(
      resolvePhaseAfterQuestionAdvance(["q01", "q02", "q04"], 2, MANCHE),
    ).toBe("theme_intro");
    expect(resolvePhaseAfterQuestionAdvance(["a", "b"], 1, null)).toBe(
      "theme_intro",
    );
  });
});
