import { describe, expect, it } from "vitest";
import {
  quizAnswerEnterX,
  quizAnswersRevealMs,
} from "@/lib/display/quiz-reveal-motion";

describe("quiz-reveal-motion", () => {
  it("alternates answer entry from left and right", () => {
    expect(quizAnswerEnterX(0)).toBeLessThan(0);
    expect(quizAnswerEnterX(1)).toBeGreaterThan(0);
    expect(quizAnswerEnterX(2)).toBeLessThan(0);
    expect(quizAnswerEnterX(3)).toBeGreaterThan(0);
  });

  it("keeps reveal under ~300ms so countdown feels immediate", () => {
    expect(quizAnswersRevealMs()).toBeLessThanOrEqual(300);
    expect(quizAnswersRevealMs()).toBeGreaterThanOrEqual(150);
  });
});
