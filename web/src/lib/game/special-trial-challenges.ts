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
}

export const SPECIAL_TRIAL_CHALLENGES: SpecialTrialPresentation[] = [
  {
    id: "dance",
    label: "BALLO",
    displayTitle: CHALLENGE_PRESENTATIONS.dance.displayTitle,
    headline: CHALLENGE_PRESENTATIONS.dance.headline,
  },
  {
    id: "declaration",
    label: "DICHIARAZIONE",
    displayTitle: CHALLENGE_PRESENTATIONS.declaration.displayTitle,
    headline: CHALLENGE_PRESENTATIONS.declaration.headline,
  },
  {
    id: "approach",
    label: "APPROCCIO",
    displayTitle: "La Prova dell'Approccio",
    headline: "Approccio",
  },
  {
    id: "gaze",
    label: "SGUARDO",
    displayTitle: "La Prova dello Sguardo",
    headline: "Sguardo",
  },
];

export function specialTrialPresentation(
  id: SpecialTrialChallengeId,
): SpecialTrialPresentation {
  return (
    SPECIAL_TRIAL_CHALLENGES.find((c) => c.id === id) ?? SPECIAL_TRIAL_CHALLENGES[0]
  );
}
