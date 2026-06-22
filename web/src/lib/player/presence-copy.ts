import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import type { EventState } from "@/lib/types";
import {
  CLOSED_COPY,
  DEFAULT_PLAYER_SUBTITLE,
  ELIMINATION_COPY,
  EXTRACTION_COPY,
  FINALS_COPY,
  MATCHING_COPY,
} from "@/lib/game/late-game-copy";

interface PlayerPresenceOptions {
  quizPhase?: QuizDisplayPhase | null;
  votingOpen?: boolean;
  /** Sync client — secondi rimasti in fase answers. */
  answersRemaining?: number;
  /** Card quiz/voto visibile — il sottotitolo hero resta vuoto (evita doppioni). */
  suppressForCard?: boolean;
}

/** Benvenuto/a sotto il saluto. */
export function playerWelcomeLabel(gender: "male" | "female"): string {
  return gender === "female" ? "BENVENUTA" : "BENVENUTO";
}

/** Sottotitolo hero — una sola fonte per fase; la card quiz/voto fa il resto. */
export function playerPresenceSubtitle(
  runtimeState: EventState,
  options: PlayerPresenceOptions = {},
): string {
  const { quizPhase, votingOpen, suppressForCard } = options;

  if (suppressForCard && (runtimeState === "quiz" || runtimeState === "finals")) {
    return "";
  }

  switch (runtimeState) {
    case "lobby":
      return "";
    case "quiz":
      switch (quizPhase) {
        case "start_countdown":
          return "Attenti — il quiz parte tra poco!";
        case "theme_intro":
          return "Nuova manche — guarda gli schermi in sala";
        default:
          return "";
      }
    case "matching":
      return MATCHING_COPY.playerSubtitle;
    case "extraction":
      return EXTRACTION_COPY.playerSubtitle;
    case "elimination":
      return ELIMINATION_COPY.playerSubtitle;
    case "finals":
      return votingOpen
        ? FINALS_COPY.playerVoting
        : FINALS_COPY.playerWaiting;
    case "winner":
      return FINALS_COPY.playerWinner;
    case "closed":
      return CLOSED_COPY.playerSubtitle;
    default:
      return DEFAULT_PLAYER_SUBTITLE;
  }
}
