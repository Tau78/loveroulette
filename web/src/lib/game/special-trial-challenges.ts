import { CHALLENGE_PRESENTATIONS } from "@/lib/game/finals-challenges";

export type SpecialTrialChallengeId =
  | "dance"
  | "declaration"
  | "approach"
  | "gaze";

export interface SpecialTrialPresentation {
  id: SpecialTrialChallengeId;
  label: string;
  displayTitle: string;
  headline: string;
  explanation: string;
}

export const SPECIAL_TRIAL_CHALLENGES: SpecialTrialPresentation[] = [
  {
    id: "dance",
    label: "BALLO",
    displayTitle: CHALLENGE_PRESENTATIONS.dance.displayTitle,
    headline: CHALLENGE_PRESENTATIONS.dance.headline,
    explanation: CHALLENGE_PRESENTATIONS.dance.explanation,
  },
  {
    id: "declaration",
    label: "DICHIARAZIONE",
    displayTitle: CHALLENGE_PRESENTATIONS.declaration.displayTitle,
    headline: CHALLENGE_PRESENTATIONS.declaration.headline,
    explanation: CHALLENGE_PRESENTATIONS.declaration.explanation,
  },
  {
    id: "approach",
    label: "APPROCCIO",
    displayTitle: "La Prova dell'Approccio",
    headline: "Approccio",
    explanation:
      "Chi sa conquistare al primo sguardo e alle prime parole? Approccio, coraggio e stile in pochi secondi.",
  },
  {
    id: "gaze",
    label: "SGUARDO",
    displayTitle: "La Prova dello Sguardo",
    headline: "Sguardo",
    explanation:
      "Occhi negli occhi senza parlare. Intensità, imbarazzo e magnetismo: la sala vota chi vince lo sguardo.",
  },
];

export function specialTrialPresentation(
  id: SpecialTrialChallengeId,
): SpecialTrialPresentation {
  return (
    SPECIAL_TRIAL_CHALLENGES.find((c) => c.id === id) ??
    SPECIAL_TRIAL_CHALLENGES[0]!
  );
}

/** Adatta la prova speciale al componente intro prove finali. */
export function specialTrialAsChallengePresentation(
  id: SpecialTrialChallengeId,
): {
  displayTitle: string;
  title: string;
  headline: string;
  explanation: string;
  coupleAction: string;
} {
  const p = specialTrialPresentation(id);
  return {
    displayTitle: p.displayTitle,
    title: p.label,
    headline: p.headline,
    explanation: p.explanation,
    coupleAction: "In scena!",
  };
}
