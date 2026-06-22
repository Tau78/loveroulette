import type { ChallengeId } from "@/lib/types";
import { CHALLENGE_LABELS } from "@/lib/types";

export interface ChallengePresentation {
  /** Titolo breve proiettore (es. «Vamos a bailar»). */
  displayTitle: string;
  title: string;
  headline: string;
  explanation: string;
  coupleAction: string;
}

export const FINALS_INTRO = {
  kicker: "Fase finale",
  headline: "Le prove finali",
  subline: "Tre coppie, quattro prove — solo una trionferà stasera",
} as const;

export const CHALLENGE_PRESENTATIONS: Record<ChallengeId, ChallengePresentation> =
  {
    dance: {
      displayTitle: "Vamos a bailar",
      title: CHALLENGE_LABELS.dance,
      headline: "Vamos a bailar",
      explanation:
        "Ogni coppia finalista balla sul palco. Ritmo, sintonia e carisma: il pubblico decreta chi ha più stile.",
      coupleAction: "In pista!",
    },
    kiss: {
      displayTitle: "Baciami, stupido!",
      title: CHALLENGE_LABELS.kiss,
      headline: "Baciami, stupido!",
      explanation:
        "Un bacio che racconta chimica e coraggio. Romantico, audace, memorabile — spetta a voi giudicare.",
      coupleAction: "Al bacio!",
    },
    declaration: {
      displayTitle: "In ginocchio da te",
      title: CHALLENGE_LABELS.declaration,
      headline: "In ginocchio da te",
      explanation:
        "Trenta secondi per conquistare la sala a parole. Sincerità, ironia o poesia: chi fa tremare il cuore?",
      coupleAction: "A microfono!",
    },
    kamasutra: {
      displayTitle: "Posizione kamasutra",
      title: CHALLENGE_LABELS.kamasutra,
      headline: "Posizione Kamasutra",
      explanation:
        "Indovinate la posizione sul cartellone — senza sfiorare il limite PG-18. Divertimento e complicità in scena.",
      coupleAction: "In posizione!",
    },
  };
