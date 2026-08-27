export const MANCHE_MIN = 8;
export const MANCHE_MAX = 40;
export const DEFAULT_MANCHE = 15;

export const SECONDS = [10, 15, 20, 30] as const;
export const DEFAULT_SECONDS = 10;

/** Punti tolti a chi non risponde, se obbligo è acceso. */
export const MUST_ANSWER_MALUS = 1;

export function unansweredDelta(mustAnswer: boolean): number {
  return mustAnswer ? -MUST_ANSWER_MALUS : 0;
}
