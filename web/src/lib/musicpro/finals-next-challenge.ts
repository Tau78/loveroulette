import type { ChallengeId } from "@/lib/types";
import type { FinalsShowState } from "./finals-show";

export const DEFAULT_FINALS_CHALLENGE_ORDER: ChallengeId[] = [
  "dance",
  "kiss",
  "declaration",
  "kamasutra",
];

/** Prossima prova non ancora completata, o null se finite tutte. */
export function nextFinalsChallengeId(
  show: FinalsShowState | null | undefined,
  order: ChallengeId[] = DEFAULT_FINALS_CHALLENGE_ORDER,
): ChallengeId | null {
  if (!show) return order[0] ?? null;
  const done = new Set(show.completedChallenges);
  for (const id of order) {
    if (!done.has(id)) return id;
  }
  return null;
}
