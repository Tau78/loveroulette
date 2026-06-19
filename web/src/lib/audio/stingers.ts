/** Stinger one-shot collegati a eventi di gioco (non loop di fase). */
export const STINGER_IDS = {
  extractionReveal: "LR_07_Extraction_Reveal",
  extractionDrumroll: "LR_06_Extraction_Drumroll",
  quizQuestionGong: "LR_Quiz_Question_Gong",
} as const;

export type StingerId = (typeof STINGER_IDS)[keyof typeof STINGER_IDS];

const REVEAL_DELAY_MS = 400;

export function revealStingerDelayMs(): number {
  return REVEAL_DELAY_MS;
}
