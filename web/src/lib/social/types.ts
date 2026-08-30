import type { ChallengeId } from "@/lib/types";
import type { QuestionAnswerStat } from "@/lib/musicpro/quiz-results";

export type SocialFormatId =
  | "quiz_shock"
  | "top_ship"
  | "finals_vote"
  | "winner_night"
  | "promo_venue";

export type SocialAspect = "9:16" | "1:1";

export type SocialShipCouple = {
  rank: number;
  maleNickname: string;
  femaleNickname: string;
  score: number | null;
};

export type SocialVoteCouple = {
  pairId: string;
  maleNick: string;
  femaleNick: string;
  votes: number;
  barPct: number;
};

export type QuizShockPayload = {
  format: "quiz_shock";
  questionBody: string;
  totalAnswers: number;
  options: QuestionAnswerStat[];
  venueName: string;
};

export type TopShipPayload = {
  format: "top_ship";
  couples: SocialShipCouple[];
  venueName: string;
};

export type FinalsVotePayload = {
  format: "finals_vote";
  challengeId: ChallengeId | null;
  challengeLabel: string;
  couples: SocialVoteCouple[];
  venueName: string;
};

export type WinnerNightPayload = {
  format: "winner_night";
  coupleLabel: string;
  prizeKicker: string;
  prizeHeadline: string;
  prizeSub: string;
  venueName: string;
  eventCode: string;
};

export type PromoVenuePayload = {
  format: "promo_venue";
  venueName: string;
  eventCode: string;
  staseraHeadline: string;
  staseraSub: string;
  prizeHeadline: string;
  topCoupleLabel: string | null;
};

export type SocialPayload =
  | QuizShockPayload
  | TopShipPayload
  | FinalsVotePayload
  | WinnerNightPayload
  | PromoVenuePayload;

export type SocialFormatMeta = {
  id: SocialFormatId;
  title: string;
  blurb: string;
  aspects: SocialAspect[];
};

export const SOCIAL_FORMATS: SocialFormatMeta[] = [
  {
    id: "quiz_shock",
    title: "Quiz shock",
    blurb: "Domanda più polarizzante + % risposte",
    aspects: ["9:16", "1:1"],
  },
  {
    id: "top_ship",
    title: "Top ship",
    blurb: "Le coppie più shipped della serata",
    aspects: ["9:16", "1:1"],
  },
  {
    id: "finals_vote",
    title: "Finale prove",
    blurb: "Barre di voto live della prova in corso",
    aspects: ["9:16"],
  },
  {
    id: "winner_night",
    title: "Vincitori night",
    blurb: "Coppia vincitrice + premio + locale",
    aspects: ["1:1", "9:16"],
  },
  {
    id: "promo_venue",
    title: "Pack venue",
    blurb: "3 frame + caption per il locale",
    aspects: ["9:16"],
  },
];

export const SOCIAL_ASPECT_PX: Record<SocialAspect, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
};
