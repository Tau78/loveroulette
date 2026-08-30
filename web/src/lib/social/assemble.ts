import { CHALLENGE_LABELS, type ChallengeId } from "@/lib/types";
import {
  coupleLabel,
  podiumFromShow,
  type FinalsShowState,
} from "@/lib/musicpro/finals-show";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";
import type { VotingSessionState } from "@/lib/musicpro/voting";
import type { CasaSlide } from "@/lib/admin/casa-slides";
import { pickMostPolarizing } from "./polarizing";
import type {
  FinalsVotePayload,
  PromoVenuePayload,
  QuizShockPayload,
  SocialShipCouple,
  TopShipPayload,
  WinnerNightPayload,
} from "./types";

export function buildQuizShockPayload(input: {
  results: QuestionResults[];
  questionBodies: Record<string, string>;
  venueName: string;
}): QuizShockPayload | null {
  const best = pickMostPolarizing(input.results);
  if (!best) return null;
  const body = input.questionBodies[best.questionId]?.trim();
  if (!body) return null;
  return {
    format: "quiz_shock",
    questionBody: body,
    totalAnswers: best.totalAnswers,
    options: best.options,
    venueName: input.venueName,
  };
}

export function buildTopShipPayload(input: {
  couples: SocialShipCouple[];
  shipTopN: number;
  venueName: string;
}): TopShipPayload | null {
  const couples = input.couples.slice(0, Math.max(1, input.shipTopN));
  if (couples.length === 0) return null;
  return {
    format: "top_ship",
    couples,
    venueName: input.venueName,
  };
}

export function buildFinalsVotePayload(input: {
  voting: VotingSessionState | null;
  venueName: string;
}): FinalsVotePayload | null {
  const session = input.voting;
  if (!session || session.finalists.length === 0) return null;
  const maxVotes = Math.max(
    1,
    ...session.finalists.map((f) => session.counts[f.pairId] ?? 0),
  );
  const couples = session.finalists.map((f) => {
    const votes = session.counts[f.pairId] ?? 0;
    return {
      pairId: f.pairId,
      maleNick: f.maleNick,
      femaleNick: f.femaleNick,
      votes,
      barPct: Math.round((votes / maxVotes) * 100),
    };
  });
  const challengeId = session.challengeId as ChallengeId;
  return {
    format: "finals_vote",
    challengeId,
    challengeLabel: CHALLENGE_LABELS[challengeId] ?? "La prova",
    couples,
    venueName: input.venueName,
  };
}

export function buildWinnerNightPayload(input: {
  finalsShow: FinalsShowState | null;
  winnerPairId: string | null | undefined;
  premio: CasaSlide;
  venueName: string;
  eventCode: string;
}): WinnerNightPayload | null {
  const show = input.finalsShow;
  if (!show || show.finalists.length === 0) return null;
  const winnerId =
    input.winnerPairId ??
    Object.entries(show.cumulativeScores).sort((a, b) => b[1] - a[1])[0]?.[0];
  const podium = podiumFromShow(show);
  const winner =
    podium.find((p) => p.finalist.pairId === winnerId)?.finalist ??
    podium[0]?.finalist;
  if (!winner) return null;
  return {
    format: "winner_night",
    coupleLabel: coupleLabel(winner),
    prizeKicker: input.premio.kicker,
    prizeHeadline: input.premio.headline,
    prizeSub: input.premio.sub,
    venueName: input.venueName,
    eventCode: input.eventCode,
  };
}

export function buildPromoVenuePayload(input: {
  venueName: string;
  eventCode: string;
  stasera: CasaSlide;
  premio: CasaSlide;
  topCoupleLabel: string | null;
}): PromoVenuePayload {
  return {
    format: "promo_venue",
    venueName: input.venueName,
    eventCode: input.eventCode,
    staseraHeadline: input.stasera.headline,
    staseraSub: input.stasera.sub,
    prizeHeadline: input.premio.headline,
    topCoupleLabel: input.topCoupleLabel,
  };
}

/** Demo payloads so the animator can preview cards before live data exists. */
export function demoPayloads(venueName: string, eventCode: string) {
  const venue = venueName.trim() || "Locale demo";
  return {
    quiz_shock: {
      format: "quiz_shock" as const,
      questionBody: "Il primo appuntamento ideale?",
      totalAnswers: 42,
      options: [
        {
          optionId: "a",
          label: "Aperitivo soft",
          sortOrder: 0,
          count: 11,
          percent: 26,
        },
        {
          optionId: "b",
          label: "Cena a lume di candela",
          sortOrder: 1,
          count: 10,
          percent: 24,
        },
        {
          optionId: "c",
          label: "Escape room",
          sortOrder: 2,
          count: 12,
          percent: 29,
        },
        {
          optionId: "d",
          label: "Concerto live",
          sortOrder: 3,
          count: 9,
          percent: 21,
        },
      ],
      venueName: venue,
    } satisfies QuizShockPayload,
    top_ship: {
      format: "top_ship" as const,
      couples: [
        {
          rank: 1,
          maleNickname: "Marco",
          femaleNickname: "Giulia",
          score: 91,
        },
        {
          rank: 2,
          maleNickname: "Luca",
          femaleNickname: "Sara",
          score: 84,
        },
        {
          rank: 3,
          maleNickname: "Alex",
          femaleNickname: "Marta",
          score: 79,
        },
      ],
      venueName: venue,
    } satisfies TopShipPayload,
    finals_vote: {
      format: "finals_vote" as const,
      challengeId: "kiss" as ChallengeId,
      challengeLabel: CHALLENGE_LABELS.kiss,
      couples: [
        {
          pairId: "1",
          maleNick: "Marco",
          femaleNick: "Giulia",
          votes: 48,
          barPct: 100,
        },
        {
          pairId: "2",
          maleNick: "Luca",
          femaleNick: "Sara",
          votes: 36,
          barPct: 75,
        },
        {
          pairId: "3",
          maleNick: "Alex",
          femaleNick: "Marta",
          votes: 22,
          barPct: 46,
        },
      ],
      venueName: venue,
    } satisfies FinalsVotePayload,
    winner_night: {
      format: "winner_night" as const,
      coupleLabel: "Marco & Giulia",
      prizeKicker: "Stasera",
      prizeHeadline: "IL PREMIO",
      prizeSub: "Buono vacanza",
      venueName: venue,
      eventCode,
    } satisfies WinnerNightPayload,
    promo_venue: {
      format: "promo_venue" as const,
      venueName: venue,
      eventCode,
      staseraHeadline: "STASERA",
      staseraSub: "Gioca con noi",
      prizeHeadline: "IL PREMIO",
      topCoupleLabel: "Marco & Giulia",
    } satisfies PromoVenuePayload,
  };
}
