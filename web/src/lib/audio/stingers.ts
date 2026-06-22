export const EXTRACTION_BED_ID = "LR_05_Extraction_Underscore";

/** Stinger one-shot collegati a eventi di gioco (non loop di fase). */
export const STINGER_IDS = {
  extractionReveal: "LR_07_Extraction_Reveal",
  extractionDrumroll: "LR_06_Extraction_Drumroll",
  quizQuestionGong: "LR_Quiz_Question_Gong",
  votingCountdown: "LR_13_Voting_Countdown",
  winnerStinger: "LR_16_Winner_Stinger",
} as const;

export const VOTING_SUSPENSE_ID = "LR_14_Voting_Suspense";

export type StingerId = (typeof STINGER_IDS)[keyof typeof STINGER_IDS];

import { EXTRACTION_SPIN_DURATION_MS } from "@/lib/game/extraction-timing";

const REVEAL_DELAY_MS = EXTRACTION_SPIN_DURATION_MS;

export function revealStingerDelayMs(): number {
  return REVEAL_DELAY_MS;
}
