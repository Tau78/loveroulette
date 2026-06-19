import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChallengeId } from "@/lib/types";
import { getFinalistsFromMetadata } from "./elimination";

export interface VotingFinalist {
  pairId: string;
  maleNick: string;
  femaleNick: string;
  rank: number;
}

export interface VotingSessionState {
  status: "open" | "closed";
  challengeId: ChallengeId;
  startedAt: string;
  updatedAt: string;
  finalists: VotingFinalist[];
  /** Vote tally per pair id. */
  counts: Record<string, number>;
  /** participantId → pairId for the active challenge. */
  ballots: Record<string, string>;
  winnerPairId?: string | null;
  closedAt?: string;
}

export interface VotingMetadata {
  current: VotingSessionState | null;
  completed: Partial<
    Record<
      ChallengeId,
      {
        winnerPairId: string;
        counts: Record<string, number>;
        closedAt: string;
      }
    >
  >;
}

const CHALLENGE_IDS: ChallengeId[] = [
  "dance",
  "kiss",
  "declaration",
  "kamasutra",
];

function nowIso(): string {
  return new Date().toISOString();
}

function emptyCounts(finalists: VotingFinalist[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finalist of finalists) {
    counts[finalist.pairId] = 0;
  }
  return counts;
}

function normalizeFinalist(raw: unknown): VotingFinalist | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (
    typeof record.pairId !== "string" ||
    typeof record.maleNick !== "string" ||
    typeof record.femaleNick !== "string" ||
    typeof record.rank !== "number"
  ) {
    return null;
  }
  return {
    pairId: record.pairId,
    maleNick: record.maleNick,
    femaleNick: record.femaleNick,
    rank: record.rank,
  };
}

function normalizeSession(raw: unknown): VotingSessionState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const challengeId = record.challengeId;
  if (
    typeof challengeId !== "string" ||
    !CHALLENGE_IDS.includes(challengeId as ChallengeId)
  ) {
    return null;
  }

  const finalists = Array.isArray(record.finalists)
    ? record.finalists
        .map(normalizeFinalist)
        .filter((f): f is VotingFinalist => f !== null)
    : [];

  if (finalists.length === 0) return null;

  const counts =
    record.counts && typeof record.counts === "object" && !Array.isArray(record.counts)
      ? (record.counts as Record<string, number>)
      : emptyCounts(finalists);

  const ballots =
    record.ballots &&
    typeof record.ballots === "object" &&
    !Array.isArray(record.ballots)
      ? (record.ballots as Record<string, string>)
      : {};

  const status = record.status === "closed" ? "closed" : "open";

  return {
    status,
    challengeId: challengeId as ChallengeId,
    startedAt:
      typeof record.startedAt === "string" ? record.startedAt : nowIso(),
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : nowIso(),
    finalists,
    counts: { ...emptyCounts(finalists), ...counts },
    ballots,
    winnerPairId:
      typeof record.winnerPairId === "string" ? record.winnerPairId : null,
    closedAt: typeof record.closedAt === "string" ? record.closedAt : undefined,
  };
}

export function getVotingMetadata(
  metadata: Record<string, unknown> | null | undefined,
): VotingMetadata {
  const raw = metadata?.love_roulette_voting;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { current: null, completed: {} };
  }

  const record = raw as Record<string, unknown>;
  const current = normalizeSession(record.current);

  const completed: VotingMetadata["completed"] = {};
  const completedRaw = record.completed;
  if (completedRaw && typeof completedRaw === "object" && !Array.isArray(completedRaw)) {
    for (const id of CHALLENGE_IDS) {
      const entry = (completedRaw as Record<string, unknown>)[id];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const row = entry as Record<string, unknown>;
      if (
        typeof row.winnerPairId === "string" &&
        typeof row.closedAt === "string" &&
        row.counts &&
        typeof row.counts === "object" &&
        !Array.isArray(row.counts)
      ) {
        completed[id] = {
          winnerPairId: row.winnerPairId,
          counts: row.counts as Record<string, number>,
          closedAt: row.closedAt,
        };
      }
    }
  }

  return { current, completed };
}

export function getVotingSessionState(
  metadata: Record<string, unknown> | null | undefined,
): VotingSessionState | null {
  return getVotingMetadata(metadata).current;
}

async function readEventMetadata(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Event not found");
  }

  return (data.metadata ?? {}) as Record<string, unknown>;
}

async function writeVotingMetadata(
  supabase: SupabaseClient,
  eventId: string,
  voting: VotingMetadata,
): Promise<void> {
  const metadata = await readEventMetadata(supabase, eventId);
  const nextMetadata = {
    ...metadata,
    love_roulette_voting: voting,
  };

  const { error } = await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadTopFinalistPairs(
  supabase: SupabaseClient,
  eventId: string,
): Promise<VotingFinalist[]> {
  const metadata = await readEventMetadata(supabase, eventId);
  const fromMeta = getFinalistsFromMetadata(metadata);
  if (fromMeta.length > 0) {
    return fromMeta.map((finalist) => ({
      pairId: finalist.pairId,
      maleNick: finalist.maleNick,
      femaleNick: finalist.femaleNick,
      rank: finalist.rank,
    }));
  }

  const { data: pairs, error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .select(
      "id, participant_male_id, participant_female_id, rank, is_eliminated",
    )
    .eq("event_id", eventId)
    .eq("is_eliminated", false)
    .order("rank", { ascending: true })
    .limit(3);

  if (pairsError) {
    throw new Error(pairsError.message);
  }

  if (!pairs || pairs.length === 0) {
    throw new Error("Nessuna coppia finalista disponibile.");
  }

  const participantIds = pairs.flatMap((pair) => [
    pair.participant_male_id as string,
    pair.participant_female_id as string,
  ]);

  const { data: participants, error: participantsError } = await supabase
    .from("love_roulette_participants")
    .select("id, nickname")
    .in("id", participantIds);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const nickById = new Map(
    (participants ?? []).map((row) => [row.id as string, row.nickname as string]),
  );

  return pairs.map((pair) => {
    const maleNick =
      nickById.get(pair.participant_male_id as string)?.trim() ?? "—";
    const femaleNick =
      nickById.get(pair.participant_female_id as string)?.trim() ?? "—";

    return {
      pairId: pair.id as string,
      maleNick,
      femaleNick,
      rank: pair.rank as number,
    };
  });
}

export class VotingError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "VotingError";
    this.status = status;
  }
}

export async function startVotingSession(
  supabase: SupabaseClient,
  eventId: string,
  challengeId: ChallengeId,
): Promise<VotingSessionState> {
  const finalists = await loadTopFinalistPairs(supabase, eventId);
  const at = nowIso();

  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);

  const session: VotingSessionState = {
    status: "open",
    challengeId,
    startedAt: at,
    updatedAt: at,
    finalists,
    counts: emptyCounts(finalists),
    ballots: {},
  };

  await writeVotingMetadata(supabase, eventId, {
    current: session,
    completed: votingMeta.completed,
  });

  return session;
}

export async function submitVote(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
  pairId: string,
): Promise<VotingSessionState> {
  const { data: participant, error: participantError } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("id", participantId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (participantError) {
    throw new Error(participantError.message);
  }

  if (!participant) {
    throw new VotingError("Partecipante non valido.", 404);
  }

  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  const session = votingMeta.current;

  if (!session || session.status !== "open") {
    throw new VotingError("La votazione non è attiva.", 409);
  }

  const validPair = session.finalists.some((f) => f.pairId === pairId);
  if (!validPair) {
    throw new VotingError("Coppia non valida.", 400);
  }

  const previousPairId = session.ballots[participantId];
  if (previousPairId === pairId) {
    return session;
  }

  const counts = { ...session.counts };
  const ballots = { ...session.ballots };

  if (previousPairId && counts[previousPairId] !== undefined) {
    counts[previousPairId] = Math.max(0, (counts[previousPairId] ?? 0) - 1);
  }

  counts[pairId] = (counts[pairId] ?? 0) + 1;
  ballots[participantId] = pairId;

  const updated: VotingSessionState = {
    ...session,
    counts,
    ballots,
    updatedAt: nowIso(),
  };

  await writeVotingMetadata(supabase, eventId, {
    current: updated,
    completed: votingMeta.completed,
  });

  return updated;
}

function pickWinner(
  finalists: VotingFinalist[],
  counts: Record<string, number>,
): string {
  let winner = finalists[0]?.pairId ?? "";
  let maxVotes = -1;

  for (const finalist of finalists) {
    const votes = counts[finalist.pairId] ?? 0;
    if (votes > maxVotes) {
      maxVotes = votes;
      winner = finalist.pairId;
    } else if (votes === maxVotes && finalist.rank < (finalists.find((f) => f.pairId === winner)?.rank ?? Infinity)) {
      winner = finalist.pairId;
    }
  }

  return winner;
}

export async function closeVotingSession(
  supabase: SupabaseClient,
  eventId: string,
): Promise<VotingSessionState> {
  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  const session = votingMeta.current;

  if (!session) {
    throw new VotingError("Nessuna votazione attiva.", 404);
  }

  if (session.status === "closed") {
    return session;
  }

  const winnerPairId = pickWinner(session.finalists, session.counts);
  const closedAt = nowIso();

  const closed: VotingSessionState = {
    ...session,
    status: "closed",
    winnerPairId,
    closedAt,
    updatedAt: closedAt,
  };

  await writeVotingMetadata(supabase, eventId, {
    current: closed,
    completed: {
      ...votingMeta.completed,
      [session.challengeId]: {
        winnerPairId,
        counts: { ...session.counts },
        closedAt,
      },
    },
  });

  return closed;
}
