import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import type { EventState } from "@/lib/types";

interface PlayerPresenceOptions {
  quizPhase?: QuizDisplayPhase | null;
  votingOpen?: boolean;
}

/** Benvenuto/a sotto il saluto. */
export function playerWelcomeLabel(gender: "male" | "female"): string {
  return gender === "female" ? "BENVENUTA" : "BENVENUTO";
}

/** Sottotitolo dinamico — vuoto in lobby (saluto statico sopra). */
export function playerPresenceSubtitle(
  runtimeState: EventState,
  options: PlayerPresenceOptions = {},
): string {
  const { quizPhase, votingOpen } = options;

  switch (runtimeState) {
    case "lobby":
      return "";
    case "quiz":
      switch (quizPhase) {
        case "start_countdown":
          return "Attenti — il quiz parte tra poco!";
        case "theme_intro":
          return "Nuova manche — guarda gli schermi";
        case "question":
          return "Leggi la domanda sugli schermi in sala";
        case "answers":
          return "Rispondi ora — hai pochi secondi!";
        case "results":
          return "Guarda gli schermi per le statistiche";
        case "next_question":
          return "Prossima domanda in arrivo…";
        default:
          return "Quiz in corso — segui gli schermi in sala";
      }
    case "matching":
      return "La roulette sta girando…";
    case "extraction":
      return "Estrazione coppie in corso!";
    case "elimination":
      return "Sfoltimento — resta con noi";
    case "finals":
      return votingOpen
        ? "Vota la coppia preferita!"
        : "Finali — in attesa della votazione";
    case "winner":
      return "Ecco la coppia vincitrice!";
    case "closed":
      return "La serata è conclusa. Grazie per aver giocato!";
    default:
      return "Segui le istruzioni dell'animatore";
  }
}
