import { VOTING_SUSPENSE_ID } from "@/lib/audio/stingers";
import { trackIdForQuizPhase } from "@/lib/audio/quiz-theme-tracks";
import type { FinalsShowPhase } from "@/lib/musicpro/finals-show";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import type { EventState } from "@/lib/types";

/** Mappa fase runtime (+ sotto-fase quiz / finali) → track id nel manifest. */
export function trackIdForPhase(
  state: EventState,
  quizPhase?: QuizDisplayPhase | null,
  finalsShowPhase?: FinalsShowPhase | null,
  quizThemeCategory?: string | null,
): string | null {
  if (state === "quiz") {
    return trackIdForQuizPhase(quizPhase, quizThemeCategory);
  }

  if (state === "finals") {
    if (finalsShowPhase === "voting") {
      return VOTING_SUSPENSE_ID;
    }
    if (finalsShowPhase === "results") {
      return null;
    }
  }

  switch (state) {
    case "lobby":
      return "LR_01_Lobby_Ambient";
    case "extraction":
      return "LR_05_Extraction_Underscore";
    case "winner":
      return "LR_15_Winner_Anthem";
    case "closed":
      return null;
    default:
      return "LR_02_Quiz_Tension";
  }
}

export function audioUrl(relativePath: string): string {
  return `/audio/${relativePath.replace(/^\/+/, "")}`;
}
