import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateSimpleAffinity,
  rankPairs,
  type AnswerMap,
  type QuestionMeta,
} from "@/lib/matching/affinity";
import { getQuestionsForEvent } from "./questions";

export interface ComputePairsOptions {
  /** Quiz question ids; falls back to answered question ids when omitted. */
  questionIds?: string[];
  /** Delete existing pairs and recompute (admin debug). */
  force?: boolean;
}

export interface ComputePairsResult {
  pairCount: number;
  skipped: boolean;
}

export class MatchingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchingError";
  }
}

async function countExistingPairs(
  supabase: SupabaseClient,
  eventId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("love_roulette_pairs")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function loadParticipantsByGender(
  supabase: SupabaseClient,
  eventId: string,
  gender: "male" | "female",
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("gender", gender);

  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ id: string }>;
}

async function loadAnswersMap(
  supabase: SupabaseClient,
  participantIds: string[],
): Promise<Record<string, AnswerMap>> {
  if (participantIds.length === 0) return {};

  const { data, error } = await supabase
    .from("love_roulette_answers")
    .select("participant_id, question_id, option_id")
    .in("participant_id", participantIds);

  if (error) throw new Error(error.message);

  const map: Record<string, AnswerMap> = {};
  for (const row of data ?? []) {
    const participantId = row.participant_id as string;
    if (!map[participantId]) {
      map[participantId] = {};
    }
    map[participantId][row.question_id as string] = row.option_id as string;
  }
  return map;
}

function deriveQuestionIdsFromAnswers(
  answersByParticipant: Record<string, AnswerMap>,
): string[] {
  const ids = new Set<string>();
  for (const answers of Object.values(answersByParticipant)) {
    for (const questionId of Object.keys(answers)) {
      ids.add(questionId);
    }
  }
  return [...ids];
}

/**
 * Compute male×female affinity from quiz answers and persist ranked pairs.
 * Schema: love_roulette_pairs (event_id, participant_male_id, participant_female_id,
 * affinity_score, rank, is_finalist, is_eliminated, was_shown).
 */
export async function computeAndPersistPairs(
  supabase: SupabaseClient,
  eventId: string,
  options?: ComputePairsOptions,
): Promise<ComputePairsResult> {
  const force = options?.force ?? false;

  const existing = await countExistingPairs(supabase, eventId);
  if (existing > 0 && !force) {
    console.info(
      `[matching] Event ${eventId}: ${existing} pairs already exist, skipping`,
    );
    return { pairCount: existing, skipped: true };
  }

  if (force && existing > 0) {
    const { error: deleteError } = await supabase
      .from("love_roulette_pairs")
      .delete()
      .eq("event_id", eventId);

    if (deleteError) throw new Error(deleteError.message);
  }

  const males = await loadParticipantsByGender(supabase, eventId, "male");
  const females = await loadParticipantsByGender(supabase, eventId, "female");

  if (males.length === 0 || females.length === 0) {
    const message =
      males.length === 0 && females.length === 0
        ? "Nessun partecipante per il matching."
        : males.length === 0
          ? "Nessun partecipante maschio per il matching."
          : "Nessuna partecipante femmina per il matching.";
    console.warn(`[matching] Event ${eventId}: ${message}`);
    throw new MatchingError(message);
  }

  const participantIds = [...males, ...females].map((p) => p.id);
  const answersByParticipant = await loadAnswersMap(supabase, participantIds);

  let questionIds = options?.questionIds;
  if (!questionIds || questionIds.length === 0) {
    questionIds = deriveQuestionIdsFromAnswers(answersByParticipant);
  }

  const { questions: allQuestions } = await getQuestionsForEvent(
    supabase,
    eventId,
  );
  const questionMeta: QuestionMeta[] = allQuestions
    .filter((q) => questionIds.includes(q.id))
    .map((q) => ({ id: q.id, weight: q.weight, category: q.category }));

  if (questionMeta.length === 0) {
    throw new MatchingError(
      "Nessuna domanda disponibile per calcolare l'affinità.",
    );
  }

  const candidates = [];
  for (const male of males) {
    const answersMale = answersByParticipant[male.id] ?? {};
    for (const female of females) {
      const answersFemale = answersByParticipant[female.id] ?? {};
      const score = calculateSimpleAffinity(
        answersMale,
        answersFemale,
        questionMeta,
      );
      candidates.push({
        maleId: male.id,
        femaleId: female.id,
        score,
      });
    }
  }

  const ranked = rankPairs(candidates);
  const rows = ranked.map((pair, index) => ({
    event_id: eventId,
    participant_male_id: pair.maleId,
    participant_female_id: pair.femaleId,
    affinity_score: pair.score,
    rank: index + 1,
    is_finalist: false,
    is_eliminated: false,
    was_shown: false,
  }));

  const { error: insertError } = await supabase
    .from("love_roulette_pairs")
    .insert(rows);

  if (insertError) throw new Error(insertError.message);

  console.info(`[matching] Event ${eventId}: persisted ${rows.length} pairs`);
  return { pairCount: rows.length, skipped: false };
}
