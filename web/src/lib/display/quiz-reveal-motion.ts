/**
 * Motion tipografia quiz proiettore — rapida ma leggibile.
 * Countdown risposte parte appena le optioni sono in posizione.
 */

export const QUIZ_QUESTION_SLIDE = {
  /** px da sinistra */
  fromX: -96,
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1] as const,
} as const;

export const QUIZ_ANSWER_SLIDE = {
  /** px dal lato (pari = sinistra, dispari = destra) */
  fromX: 110,
  duration: 0.16,
  stagger: 0.04,
  ease: [0.22, 1, 0.36, 1] as const,
} as const;

/** Tempo totale fino all’ultima risposta in posizione (ms). */
export function quizAnswersRevealMs(): number {
  const lastIndex = 3;
  return Math.round(
    (QUIZ_ANSWER_SLIDE.stagger * lastIndex + QUIZ_ANSWER_SLIDE.duration) * 1000,
  );
}

export function quizAnswerEnterX(index: number): number {
  // A,C da sinistra · B,D da destra
  return index % 2 === 0 ? -QUIZ_ANSWER_SLIDE.fromX : QUIZ_ANSWER_SLIDE.fromX;
}
