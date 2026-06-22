import type { SupabaseClient } from "@supabase/supabase-js";
import { submitSimBotVotesForSession } from "@/lib/musicpro/simulate-players";
import type { ChallengeId } from "@/lib/types";
import type { FinalistCouple } from "./elimination";
import {
  getVotingMetadata,
  type VotingFinalist,
  type VotingMetadata,
  type VotingSessionState,
  VotingError,
  loadTopFinalistPairs,
  writeVotingMetadataBundle,
  readEventMetadata,
} from "./voting";

export const FINALS_VOTING_PREP_SECONDS = 10;
export const FINALS_VOTING_SECONDS = 20;
export const WINNER_SPECTACLE_SECONDS = 30;

export type FinalsShowPhase =
  | "intro"
  | "idle"
  | "challenge_intro"
  | "couple_reveal"
  | "voting_prep"
  | "voting"
  | "results"
  | "tie_blocked"
  | "winner_spectacle"
  | "winner_podium";

export interface FinalsShowState {
  phase: FinalsShowPhase;
  phaseStartedAt: string;
  updatedAt: string;
  challengeId: ChallengeId | null;
  /** 1-based index during couple_reveal. */
  coupleIndex: number;
  cumulativeScores: Record<string, number>;
  completedChallenges: ChallengeId[];
  tieDetected: boolean;
  finalists: VotingFinalist[];
}

export interface FinalsShowClock {
  phase: FinalsShowPhase;
  remaining: number;
  awaitingServerTick: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyScores(finalists: VotingFinalist[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const f of finalists) {
    scores[f.pairId] = 0;
  }
  return scores;
}

export function normalizeFinalsShow(
  raw: unknown,
  fallbackFinalists: VotingFinalist[] = [],
): FinalsShowState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const phase = record.phase;
  const validPhases: FinalsShowPhase[] = [
    "intro",
    "idle",
    "challenge_intro",
    "couple_reveal",
    "voting_prep",
    "voting",
    "results",
    "tie_blocked",
    "winner_spectacle",
    "winner_podium",
  ];
  if (typeof phase !== "string" || !validPhases.includes(phase as FinalsShowPhase)) {
    return null;
  }

  const finalists = Array.isArray(record.finalists)
    ? (record.finalists as VotingFinalist[]).filter(
        (f) =>
          f &&
          typeof f.pairId === "string" &&
          typeof f.maleNick === "string" &&
          typeof f.femaleNick === "string",
      )
    : fallbackFinalists;

  const cumulativeScores =
    record.cumulativeScores &&
    typeof record.cumulativeScores === "object" &&
    !Array.isArray(record.cumulativeScores)
      ? (record.cumulativeScores as Record<string, number>)
      : emptyScores(finalists);

  const completedChallenges = Array.isArray(record.completedChallenges)
    ? record.completedChallenges.filter(
        (id): id is ChallengeId =>
          typeof id === "string" &&
          ["dance", "kiss", "declaration", "kamasutra"].includes(id),
      )
    : [];

  return {
    phase: phase as FinalsShowPhase,
    phaseStartedAt:
      typeof record.phaseStartedAt === "string"
        ? record.phaseStartedAt
        : nowIso(),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : nowIso(),
    challengeId:
      typeof record.challengeId === "string"
        ? (record.challengeId as ChallengeId)
        : null,
    coupleIndex:
      typeof record.coupleIndex === "number" ? record.coupleIndex : 0,
    cumulativeScores: { ...emptyScores(finalists), ...cumulativeScores },
    completedChallenges,
    tieDetected: record.tieDetected === true,
    finalists,
  };
}

export function getFinalsShowFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): FinalsShowState | null {
  const voting = getVotingMetadata(metadata);
  return normalizeFinalsShow(voting.show, []);
}

function finalsShowFromMeta(
  votingMeta: VotingMetadata,
): FinalsShowState | null {
  return normalizeFinalsShow(votingMeta.show);
}

function phaseDurationSeconds(phase: FinalsShowPhase): number | null {
  switch (phase) {
    case "voting_prep":
      return FINALS_VOTING_PREP_SECONDS;
    case "voting":
      return FINALS_VOTING_SECONDS;
    case "winner_spectacle":
      return WINNER_SPECTACLE_SECONDS;
    default:
      return null;
  }
}

export function remainingSecondsForPhase(
  phase: FinalsShowPhase,
  phaseStartedAt: string,
  now = Date.now(),
): number {
  const duration = phaseDurationSeconds(phase);
  if (duration === null) return 0;
  const start = Date.parse(phaseStartedAt);
  if (Number.isNaN(start)) return 0;
  const left = duration * 1000 - (now - start);
  return Math.max(0, Math.ceil(left / 1000));
}

export function isFinalsPhaseExpired(
  phase: FinalsShowPhase,
  phaseStartedAt: string,
  now = Date.now(),
): boolean {
  const duration = phaseDurationSeconds(phase);
  if (duration === null) return false;
  return remainingSecondsForPhase(phase, phaseStartedAt, now) <= 0;
}

export function resolveFinalsShowClock(
  show: FinalsShowState,
  now = Date.now(),
): FinalsShowClock {
  const duration = phaseDurationSeconds(show.phase);
  if (duration === null) {
    return {
      phase: show.phase,
      remaining: 0,
      awaitingServerTick: false,
    };
  }

  const remaining = remainingSecondsForPhase(
    show.phase,
    show.phaseStartedAt,
    now,
  );

  return {
    phase: show.phase,
    remaining,
    awaitingServerTick: remaining <= 0,
  };
}

function finalistCount(show: FinalsShowState): number {
  return show.finalists.length;
}

function nextPhaseAfterAdvance(show: FinalsShowState): FinalsShowPhase {
  switch (show.phase) {
    case "intro":
      return "idle";
    case "challenge_intro":
      return finalistCount(show) >= 1 ? "couple_reveal" : "voting_prep";
    case "couple_reveal": {
      const count = finalistCount(show);
      if (show.coupleIndex < count) {
        return "couple_reveal";
      }
      return "voting_prep";
    }
    case "results":
      return "idle";
    case "winner_spectacle":
      return "winner_podium";
    default:
      return show.phase;
  }
}

function freshShowPhase(
  show: FinalsShowState,
  phase: FinalsShowPhase,
  extras?: Partial<Pick<FinalsShowState, "challengeId" | "coupleIndex" | "tieDetected">>,
): FinalsShowState {
  const at = nowIso();
  return {
    ...show,
    phase,
    phaseStartedAt: at,
    updatedAt: at,
    ...extras,
  };
}

function mergeChallengeScores(
  cumulative: Record<string, number>,
  counts: Record<string, number>,
): Record<string, number> {
  const next = { ...cumulative };
  for (const [pairId, votes] of Object.entries(counts)) {
    next[pairId] = (next[pairId] ?? 0) + votes;
  }
  return next;
}

function detectFirstPlaceTie(
  finalists: VotingFinalist[],
  scores: Record<string, number>,
): boolean {
  if (finalists.length === 0) return false;
  const values = finalists.map((f) => scores[f.pairId] ?? 0);
  const max = Math.max(...values);
  return values.filter((v) => v === max).length > 1;
}

function rankedByCumulative(
  finalists: VotingFinalist[],
  scores: Record<string, number>,
): Array<{ finalist: VotingFinalist; score: number; place: number }> {
  const sorted = [...finalists].sort((a, b) => {
    const diff = (scores[b.pairId] ?? 0) - (scores[a.pairId] ?? 0);
    if (diff !== 0) return diff;
    return a.rank - b.rank;
  });

  return sorted.map((finalist, index) => ({
    finalist,
    score: scores[finalist.pairId] ?? 0,
    place: index + 1,
  }));
}

export { rankedByCumulative, detectFirstPlaceTie };

async function persistShow(
  supabase: SupabaseClient,
  eventId: string,
  show: FinalsShowState,
  session: VotingSessionState | null,
  votingMeta: VotingMetadata,
): Promise<void> {
  await writeVotingMetadataBundle(supabase, eventId, {
    ...votingMeta,
    show,
    current: session,
  });
}

export async function initFinalsShow(
  supabase: SupabaseClient,
  eventId: string,
): Promise<FinalsShowState> {
  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  const existing = normalizeFinalsShow(votingMeta.show);
  if (existing) return existing;

  const finalists = await loadTopFinalistPairs(supabase, eventId);
  const at = nowIso();
  const show: FinalsShowState = {
    phase: "intro",
    phaseStartedAt: at,
    updatedAt: at,
    challengeId: null,
    coupleIndex: 0,
    cumulativeScores: emptyScores(finalists),
    completedChallenges: [],
    tieDetected: false,
    finalists,
  };

  await persistShow(supabase, eventId, show, votingMeta.current, votingMeta);
  return show;
}

export async function startChallengeShow(
  supabase: SupabaseClient,
  eventId: string,
  challengeId: ChallengeId,
): Promise<{ show: FinalsShowState; session: VotingSessionState | null }> {
  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  let show =
    finalsShowFromMeta(votingMeta) ?? (await initFinalsShow(supabase, eventId));

  if (
    show.phase !== "intro" &&
    show.phase !== "idle" &&
    show.phase !== "results" &&
    show.phase !== "tie_blocked"
  ) {
    throw new VotingError(
      "Completa la prova in corso (AVANTI) prima di avviarne un'altra.",
      409,
    );
  }

  const finalists = await loadTopFinalistPairs(supabase, eventId);
  show = {
    ...freshShowPhase(show, "challenge_intro", {
      challengeId,
      coupleIndex: 0,
      tieDetected: false,
    }),
    finalists,
    cumulativeScores: {
      ...emptyScores(finalists),
      ...show.cumulativeScores,
    },
  };

  await persistShow(supabase, eventId, show, null, {
    ...votingMeta,
    current: null,
  });

  return { show, session: null };
}

function openVotingSession(
  show: FinalsShowState,
): { show: FinalsShowState; session: VotingSessionState } {
  const at = nowIso();
  const session: VotingSessionState = {
    status: "open",
    challengeId: show.challengeId!,
    startedAt: at,
    updatedAt: at,
    finalists: show.finalists,
    counts: Object.fromEntries(
      show.finalists.map((f) => [f.pairId, 0]),
    ),
    ballots: {},
  };

  const nextShow = freshShowPhase(show, "voting");
  return { show: nextShow, session };
}

function closeVotingToResults(
  show: FinalsShowState,
  session: VotingSessionState,
): { show: FinalsShowState; session: VotingSessionState; votingMeta: VotingMetadata } {
  const closedAt = nowIso();
  const closed: VotingSessionState = {
    ...session,
    status: "closed",
    winnerPairId: pickChallengeWinner(session.finalists, session.counts),
    closedAt,
    updatedAt: closedAt,
  };

  const cumulativeScores = mergeChallengeScores(
    show.cumulativeScores,
    session.counts,
  );

  const completedChallenges = show.challengeId
    ? [...new Set([...show.completedChallenges, show.challengeId])]
    : show.completedChallenges;

  const nextShow = {
    ...freshShowPhase(
      { ...show, cumulativeScores, completedChallenges },
      "results",
    ),
    challengeId: show.challengeId,
  };

  const votingMeta = getVotingMetadata({});
  return { show: nextShow, session: closed, votingMeta };
}

function pickChallengeWinner(
  finalists: VotingFinalist[],
  counts: Record<string, number>,
): string {
  let winner = finalists[0]?.pairId ?? "";
  let maxVotes = -1;
  for (const f of finalists) {
    const votes = counts[f.pairId] ?? 0;
    if (votes > maxVotes || (votes === maxVotes && f.rank < (finalists.find((x) => x.pairId === winner)?.rank ?? Infinity))) {
      maxVotes = votes;
      winner = f.pairId;
    }
  }
  return winner;
}

export async function advanceFinalsShow(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ show: FinalsShowState; session: VotingSessionState | null }> {
  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  const show = finalsShowFromMeta(votingMeta);
  if (!show) {
    throw new VotingError("Spettacolo finali non inizializzato.", 404);
  }

  if (
    show.phase === "voting_prep" ||
    show.phase === "voting" ||
    show.phase === "winner_spectacle"
  ) {
    throw new VotingError("Attendi la fine del countdown.", 409);
  }

  if (show.phase === "tie_blocked") {
    throw new VotingError(
      "Avvia una prova di replica per sbloccare il parimerito.",
      409,
    );
  }

  const next = nextPhaseAfterAdvance(show);
  let nextShow = show;
  let session = votingMeta.current;

  if (next === "couple_reveal") {
    const index =
      show.phase === "challenge_intro" ? 1 : show.coupleIndex + 1;
    nextShow = freshShowPhase(show, "couple_reveal", { coupleIndex: index });
  } else if (next === "idle") {
    nextShow = freshShowPhase(
      {
        ...show,
        challengeId: show.phase === "results" ? null : show.challengeId,
        coupleIndex: 0,
        tieDetected: false,
      },
      "idle",
      { challengeId: show.phase === "results" ? null : show.challengeId },
    );
  } else if (next === "winner_podium") {
    nextShow = freshShowPhase(show, "winner_podium");
  } else {
    nextShow = freshShowPhase(show, next);
  }

  const completed =
    show.phase === "results" && show.challengeId
      ? {
          ...votingMeta.completed,
          [show.challengeId]: {
            winnerPairId: session?.winnerPairId ?? "",
            counts: { ...(session?.counts ?? {}) },
            closedAt: session?.closedAt ?? nowIso(),
          },
        }
      : votingMeta.completed;

  await writeVotingMetadataBundle(supabase, eventId, {
    ...votingMeta,
    show: nextShow,
    current: session,
    completed,
  });

  return { show: nextShow, session };
}

export async function tickFinalsShow(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{ show: FinalsShowState; session: VotingSessionState | null }> {
  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  const show = finalsShowFromMeta(votingMeta);
  if (!show) {
    return { show: await initFinalsShow(supabase, eventId), session: null };
  }

  if (!isFinalsPhaseExpired(show.phase, show.phaseStartedAt)) {
    return { show, session: votingMeta.current };
  }

  if (show.phase === "voting_prep") {
    const opened = openVotingSession(show);
    let session = opened.session;
    try {
      const botVotes = await submitSimBotVotesForSession(
        supabase,
        eventId,
        session,
      );
      session = botVotes.session;
    } catch (err) {
      console.warn(
        `[finals] Bot votes skipped during voting open: ${err instanceof Error ? err.message : err}`,
      );
    }
    await writeVotingMetadataBundle(supabase, eventId, {
      ...votingMeta,
      show: opened.show,
      current: session,
    });
    return { show: opened.show, session };
  }

  if (show.phase === "voting" && votingMeta.current?.status === "open") {
    const { show: resultsShow, session } = closeVotingToResults(
      show,
      votingMeta.current,
    );
    const completed = show.challengeId
      ? {
          ...votingMeta.completed,
          [show.challengeId]: {
            winnerPairId: session.winnerPairId ?? "",
            counts: { ...session.counts },
            closedAt: session.closedAt ?? nowIso(),
          },
        }
      : votingMeta.completed;

    await writeVotingMetadataBundle(supabase, eventId, {
      ...votingMeta,
      show: resultsShow,
      current: session,
      completed,
    });
    return { show: resultsShow, session };
  }

  if (show.phase === "winner_spectacle") {
    const nextShow = freshShowPhase(show, "winner_podium");
    await persistShow(supabase, eventId, nextShow, votingMeta.current, votingMeta);
    return { show: nextShow, session: votingMeta.current };
  }

  return { show, session: votingMeta.current };
}

export async function proclaimWinnerShow(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{
  show: FinalsShowState;
  session: VotingSessionState | null;
  tie: boolean;
}> {
  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  let show =
    finalsShowFromMeta(votingMeta) ?? (await initFinalsShow(supabase, eventId));

  if (
    show.phase !== "idle" &&
    show.phase !== "results" &&
    show.phase !== "intro"
  ) {
    throw new VotingError("Termina la prova in corso prima di proclamare.", 409);
  }

  const tie = detectFirstPlaceTie(show.finalists, show.cumulativeScores);

  if (tie) {
    show = freshShowPhase(
      { ...show, tieDetected: true },
      "tie_blocked",
    );
    await persistShow(supabase, eventId, show, null, {
      ...votingMeta,
      current: null,
    });
    return { show, session: null, tie: true };
  }

  show = freshShowPhase({ ...show, tieDetected: false }, "winner_spectacle");
  await persistShow(supabase, eventId, show, null, {
    ...votingMeta,
    current: null,
  });
  return { show, session: null, tie: false };
}

export async function isParticipantFinalist(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("role")
    .eq("id", participantId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === "finalist";
}

export function coupleLabel(finalist: VotingFinalist): string {
  return `${finalist.maleNick} & ${finalist.femaleNick}`;
}

export function podiumFromShow(
  show: FinalsShowState,
): Array<{ finalist: VotingFinalist; score: number; place: number }> {
  return rankedByCumulative(show.finalists, show.cumulativeScores);
}
