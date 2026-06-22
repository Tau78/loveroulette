import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureDefaultGeneratoreImport } from "@/lib/generatore/auto-import";
import {
  getQuestionsForEvent,
  materializePoolQuestionsForEvent,
} from "./questions";
import type { LoveRouletteQuestion } from "./types";
import { createParticipantAdmin } from "./participant-admin";
import { getQuizSessionState, transitionToMatching } from "./quiz-state";
import {
  type VotingSessionState,
  getVotingMetadata,
  readEventMetadata,
  writeVotingMetadataBundle,
} from "./voting";

export const SIM_BOT_MALE_PREFIX = "Bot U";
export const SIM_BOT_FEMALE_PREFIX = "Bot D";

export function isSimBotNickname(nickname: string): boolean {
  return (
    nickname.startsWith(SIM_BOT_MALE_PREFIX) ||
    nickname.startsWith(SIM_BOT_FEMALE_PREFIX)
  );
}

export interface SimulatePlayersOptions {
  coupleCount?: number;
  /** Rimuove i bot esistenti (nickname Bot U… / Bot D…) prima di crearne di nuovi. */
  replace?: boolean;
  /** Calcola affinità e imposta runtime_state = matching. */
  goToMatching?: boolean;
}

export interface SimulatePlayersResult {
  malesCreated: number;
  femalesCreated: number;
  malesReused: number;
  femalesReused: number;
  answersInserted: number;
  questionCount: number;
  pairCount?: number;
  runtimeState?: "matching";
}

function padIndex(index: number): string {
  return String(index).padStart(2, "0");
}

function botNickname(gender: "male" | "female", index: number): string {
  const prefix =
    gender === "male" ? SIM_BOT_MALE_PREFIX : SIM_BOT_FEMALE_PREFIX;
  return `${prefix}${padIndex(index)}`;
}

function botBadge(gender: "male" | "female", index: number): string {
  return gender === "male" ? `TU${padIndex(index)}` : `TD${padIndex(index)}`;
}

async function listSimBotIds(
  supabase: SupabaseClient,
  eventId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id, nickname")
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => {
      const nick = String(row.nickname ?? "");
      return isSimBotNickname(nick);
    })
    .map((row) => String(row.id));
}

async function listEligibleSimBotVoters(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id, nickname, role")
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((row) => {
      const nick = String(row.nickname ?? "");
      return isSimBotNickname(nick) && row.role !== "finalist";
    })
    .map((row) => ({ id: String(row.id) }));
}

/** Distribuisce i voti favorendo la coppia con rank migliore per evitare parità. */
function pickBotVotePairId(
  botIndex: number,
  finalists: VotingSessionState["finalists"],
): string {
  if (finalists.length === 0) {
    throw new Error("Nessun finalista in votazione.");
  }

  const slot = botIndex % 10;
  if (slot < 7) return finalists[0].pairId;
  if (slot < 9 && finalists[1]) return finalists[1].pairId;
  return (finalists[2] ?? finalists[0]).pairId;
}

export async function submitSimBotVotesForSession(
  supabase: SupabaseClient,
  eventId: string,
  session: VotingSessionState,
): Promise<{ session: VotingSessionState; votesSubmitted: number }> {
  if (session.status !== "open") {
    return { session, votesSubmitted: 0 };
  }

  const voters = await listEligibleSimBotVoters(supabase, eventId);
  if (voters.length === 0) {
    return { session, votesSubmitted: 0 };
  }

  const counts = { ...session.counts };
  const ballots = { ...session.ballots };
  let votesSubmitted = 0;

  for (let index = 0; index < voters.length; index += 1) {
    const voterId = voters[index].id;
    const pairId = pickBotVotePairId(index, session.finalists);
    if (ballots[voterId] === pairId) continue;

    const previousPairId = ballots[voterId];
    if (previousPairId && counts[previousPairId] !== undefined) {
      counts[previousPairId] = Math.max(0, (counts[previousPairId] ?? 0) - 1);
    }

    counts[pairId] = (counts[pairId] ?? 0) + 1;
    ballots[voterId] = pairId;
    votesSubmitted += 1;
  }

  if (votesSubmitted === 0) {
    return { session, votesSubmitted: 0 };
  }

  const updated: VotingSessionState = {
    ...session,
    counts,
    ballots,
    updatedAt: new Date().toISOString(),
  };

  const metadata = await readEventMetadata(supabase, eventId);
  const votingMeta = getVotingMetadata(metadata);
  await writeVotingMetadataBundle(supabase, eventId, {
    ...votingMeta,
    current: updated,
  });

  return { session: updated, votesSubmitted };
}

async function deleteSimBots(
  supabase: SupabaseClient,
  eventId: string,
): Promise<void> {
  const botIds = await listSimBotIds(supabase, eventId);
  if (botIds.length === 0) return;

  const { error: answersError } = await supabase
    .from("love_roulette_answers")
    .delete()
    .in("participant_id", botIds);

  if (answersError) throw new Error(answersError.message);

  const { error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .delete()
    .eq("event_id", eventId)
    .or(
      botIds
        .flatMap((id) => [
          `participant_male_id.eq.${id}`,
          `participant_female_id.eq.${id}`,
        ])
        .join(","),
    );

  if (pairsError) throw new Error(pairsError.message);

  const { error: deleteError } = await supabase
    .from("love_roulette_participants")
    .delete()
    .in("id", botIds);

  if (deleteError) throw new Error(deleteError.message);
}

async function resolveEventQuestions(
  supabase: SupabaseClient,
  eventId: string,
  eventSlug: string,
  metadata: Record<string, unknown>,
): Promise<LoveRouletteQuestion[]> {
  await ensureDefaultGeneratoreImport(supabase, eventId, eventSlug, metadata);

  const { source, questions } = await getQuestionsForEvent(supabase, eventId);

  if (questions.length === 0) {
    throw new Error(
      "Nessuna domanda disponibile. Importa le manche o esegui il seed del pool.",
    );
  }

  let resolved =
    source === "pool"
      ? await materializePoolQuestionsForEvent(supabase, eventId, questions)
      : questions;

  const quizState = getQuizSessionState(metadata);
  if (quizState?.questionIds?.length) {
    const byId = new Map(resolved.map((question) => [question.id, question]));
    const fromQuiz = quizState.questionIds
      .map((id) => byId.get(id))
      .filter((question): question is LoveRouletteQuestion => question != null);

    if (fromQuiz.length > 0) {
      resolved = fromQuiz;
    }
  }

  return resolved;
}

function pickOptionIndex(
  participantSeed: number,
  questionIndex: number,
  optionCount: number,
): number {
  if (optionCount <= 0) return 0;
  return (participantSeed + questionIndex * 7) % optionCount;
}

async function ensureBotParticipant(
  supabase: SupabaseClient,
  eventId: string,
  gender: "male" | "female",
  index: number,
): Promise<{ id: string; created: boolean }> {
  const nickname = botNickname(gender, index);
  const badgeCode = botBadge(gender, index);

  const { data: existing, error: existingError } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("nickname", nickname)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    const { error: onlineError } = await supabase
      .from("love_roulette_participants")
      .update({
        is_online: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (onlineError) throw new Error(onlineError.message);
    return { id: String(existing.id), created: false };
  }

  const participant = await createParticipantAdmin(supabase, {
    eventId,
    nickname,
    gender,
    badgeCode,
  });

  const { error: onlineError } = await supabase
    .from("love_roulette_participants")
    .update({
      is_online: true,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  if (onlineError) throw new Error(onlineError.message);

  return { id: participant.id, created: true };
}

async function insertAnswersForParticipants(
  supabase: SupabaseClient,
  participantIds: string[],
  questions: LoveRouletteQuestion[],
): Promise<number> {
  if (participantIds.length === 0 || questions.length === 0) return 0;

  const { error: clearError } = await supabase
    .from("love_roulette_answers")
    .delete()
    .in("participant_id", participantIds);

  if (clearError) throw new Error(clearError.message);

  const rows: Array<{
    participant_id: string;
    question_id: string;
    option_id: string;
  }> = [];

  participantIds.forEach((participantId, participantIndex) => {
    questions.forEach((question, questionIndex) => {
      if (question.options.length === 0) return;
      const optionIndex = pickOptionIndex(
        participantIndex + 1,
        questionIndex,
        question.options.length,
      );
      rows.push({
        participant_id: participantId,
        question_id: question.id,
        option_id: question.options[optionIndex].id,
      });
    });
  });

  if (rows.length === 0) return 0;

  const { error: insertError } = await supabase
    .from("love_roulette_answers")
    .insert(rows);

  if (insertError) throw new Error(insertError.message);
  return rows.length;
}

export async function simulatePlayersForEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventSlug: string,
  metadata: Record<string, unknown>,
  options?: SimulatePlayersOptions,
): Promise<SimulatePlayersResult> {
  const coupleCount = Math.min(Math.max(options?.coupleCount ?? 10, 1), 20);
  const replace = options?.replace ?? true;

  if (replace) {
    await deleteSimBots(supabase, eventId);
  }

  const questions = await resolveEventQuestions(
    supabase,
    eventId,
    eventSlug,
    metadata,
  );

  let malesCreated = 0;
  let femalesCreated = 0;
  let malesReused = 0;
  let femalesReused = 0;
  const participantIds: string[] = [];

  for (let index = 1; index <= coupleCount; index += 1) {
    const male = await ensureBotParticipant(supabase, eventId, "male", index);
    participantIds.push(male.id);
    if (male.created) malesCreated += 1;
    else malesReused += 1;

    const female = await ensureBotParticipant(
      supabase,
      eventId,
      "female",
      index,
    );
    participantIds.push(female.id);
    if (female.created) femalesCreated += 1;
    else femalesReused += 1;
  }

  const answersInserted = await insertAnswersForParticipants(
    supabase,
    participantIds,
    questions,
  );

  const result: SimulatePlayersResult = {
    malesCreated,
    femalesCreated,
    malesReused,
    femalesReused,
    answersInserted,
    questionCount: questions.length,
  };

  if (options?.goToMatching) {
    const matching = await transitionToMatching(supabase, eventId, {
      questionIds: questions.map((question) => question.id),
      force: true,
    });
    result.pairCount = matching.pairCount;
    result.runtimeState = "matching";
  }

  return result;
}
