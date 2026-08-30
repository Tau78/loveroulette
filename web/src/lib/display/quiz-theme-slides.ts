/** Asset slide grafiche pre-domanda (theme_intro), Dark Fuchsia. */
export const QUIZ_THEME_SLIDE_CATEGORIES = [
  "lifestyle",
  "romantic",
  "adventure",
  "values",
  "fun",
  "intimacy",
] as const;

export type QuizThemeSlideCategory =
  (typeof QUIZ_THEME_SLIDE_CATEGORIES)[number];

const THEME_SLIDE_SRC: Record<QuizThemeSlideCategory, string> = {
  lifestyle: "/grafiche/theme-slides/lifestyle.jpg",
  romantic: "/grafiche/theme-slides/romantic.jpg",
  adventure: "/grafiche/theme-slides/adventure.jpg",
  values: "/grafiche/theme-slides/values.jpg",
  fun: "/grafiche/theme-slides/fun.jpg",
  intimacy: "/grafiche/theme-slides/intimacy.jpg",
};

export function isQuizThemeSlideCategory(
  category: string | null | undefined,
): category is QuizThemeSlideCategory {
  return (
    typeof category === "string" &&
    (QUIZ_THEME_SLIDE_CATEGORIES as readonly string[]).includes(category)
  );
}

/** Path pubblico della slide grafica per categoria, se presente. */
export function resolveThemeSlideSrc(
  category: string | null | undefined,
): string | null {
  if (!isQuizThemeSlideCategory(category)) return null;
  return THEME_SLIDE_SRC[category];
}
