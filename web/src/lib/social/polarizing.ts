import type { QuestionResults } from "@/lib/musicpro/quiz-results";

/** Higher = more split (closer to even). Requires at least 2 answered options. */
export function polarizingScore(results: QuestionResults): number {
  if (results.totalAnswers < 4) return -1;
  const percents = results.options.map((o) => o.percent).sort((a, b) => b - a);
  const top = percents[0] ?? 0;
  const second = percents[1] ?? 0;
  // Prefer tight races between the top two; ignore unanimous answers.
  if (top >= 95) return -1;
  return 100 - (top - second);
}

/** Pick the most polarizing question among those with enough answers. */
export function pickMostPolarizing(
  results: QuestionResults[],
): QuestionResults | null {
  let best: QuestionResults | null = null;
  let bestScore = -1;
  for (const row of results) {
    const score = polarizingScore(row);
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 0 ? best : null;
}
