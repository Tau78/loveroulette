import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnswerMap, QuestionMeta } from "@/lib/matching/affinity";
import { getQuestionsForEvent } from "@/lib/musicpro/questions";
import {
  type SpecialTrialArchiveEntry,
  pairTrialStatsFromArchive,
} from "@/lib/musicpro/special-trial-archive";

export interface PairRevealStats {
  sameAnswers: number;
  questionsCompared: number;
  trialsCount: number;
  trialsScore: number;
  fastestMatchQuestionText: string | null;
}

interface TimedAnswer {
  optionId: string;
  answeredAtMs: number;
}

function parseAnsweredAtMs(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

async function loadTimedAnswersMap(
  supabase: SupabaseClient,
  participantIds: string[],
): Promise<Record<string, Record<string, TimedAnswer>>> {
  if (participantIds.length === 0) return {};

  const { data, error } = await supabase
    .from("love_roulette_answers")
    .select("participant_id, question_id, option_id, answered_at")
    .in("participant_id", participantIds);

  if (error) throw new Error(error.message);

  const map: Record<string, Record<string, TimedAnswer>> = {};
  for (const row of data ?? []) {
    const participantId = row.participant_id as string;
    const questionId = row.question_id as string;
    const optionId = row.option_id as string;
    const answeredAtMs = parseAnsweredAtMs(row.answered_at);
    if (answeredAtMs == null) continue;
    if (!map[participantId]) map[participantId] = {};
    map[participantId][questionId] = { optionId, answeredAtMs };
  }
  return map;
}

function deriveQuestionIds(
  a: Record<string, TimedAnswer>,
  b: Record<string, TimedAnswer>,
): string[] {
  const ids = new Set<string>();
  for (const id of Object.keys(a)) ids.add(id);
  for (const id of Object.keys(b)) ids.add(id);
  return [...ids];
}

function questionLabelById(
  questions: QuestionMeta[],
  textById: Map<string, string>,
  questionId: string,
): string {
  const text = textById.get(questionId)?.trim();
  if (text) return text;
  const cat = questions.find((q) => q.id === questionId)?.category;
  return cat ? `Argomento ${cat}` : "Domanda";
}

export function computePairRevealStatsFromAnswers(
  answersA: Record<string, TimedAnswer>,
  answersB: Record<string, TimedAnswer>,
  questionMeta: QuestionMeta[],
  textById: Map<string, string>,
): Pick<
  PairRevealStats,
  "sameAnswers" | "questionsCompared" | "fastestMatchQuestionText"
> {
  let sameAnswers = 0;
  let questionsCompared = 0;
  let bestMs = Infinity;
  let fastestMatchQuestionText: string | null = null;

  const metaIds = new Set(questionMeta.map((q) => q.id));
  const questionIds =
    questionMeta.length > 0
      ? questionMeta.map((q) => q.id)
      : deriveQuestionIds(answersA, answersB).filter((id) =>
          metaIds.size > 0 ? metaIds.has(id) : true,
        );

  for (const questionId of questionIds) {
    const left = answersA[questionId];
    const right = answersB[questionId];
    if (!left || !right) continue;
    questionsCompared++;
    if (left.optionId !== right.optionId) continue;
    sameAnswers++;
    const bothAt = Math.max(left.answeredAtMs, right.answeredAtMs);
    if (bothAt < bestMs) {
      bestMs = bothAt;
      fastestMatchQuestionText = questionLabelById(
        questionMeta,
        textById,
        questionId,
      );
    }
  }

  return {
    sameAnswers,
    questionsCompared,
    fastestMatchQuestionText:
      sameAnswers > 0 && Number.isFinite(bestMs)
        ? fastestMatchQuestionText
        : null,
  };
}

export async function computePairRevealStats(
  supabase: SupabaseClient,
  eventId: string,
  participantAId: string,
  participantBId: string,
  trialArchive: SpecialTrialArchiveEntry[],
  questionIds?: string[],
): Promise<PairRevealStats> {
  const timed = await loadTimedAnswersMap(supabase, [
    participantAId,
    participantBId,
  ]);
  const answersA = timed[participantAId] ?? {};
  const answersB = timed[participantBId] ?? {};

  const { questions: allQuestions } = await getQuestionsForEvent(
    supabase,
    eventId,
  );
  const textById = new Map(
    allQuestions.map((q) => [q.id, q.body ?? ""] as const),
  );

  let ids = questionIds;
  if (!ids || ids.length === 0) {
    ids = deriveQuestionIds(answersA, answersB);
  }

  const questionMeta: QuestionMeta[] = allQuestions
    .filter((q) => ids!.includes(q.id))
    .map((q) => ({ id: q.id, weight: q.weight, category: q.category }));

  const fromAnswers = computePairRevealStatsFromAnswers(
    answersA,
    answersB,
    questionMeta,
    textById,
  );
  const { trialsCount, trialsScore } = pairTrialStatsFromArchive(
    trialArchive,
    participantAId,
    participantBId,
  );

  return {
    ...fromAnswers,
    trialsCount,
    trialsScore,
  };
}

/** @deprecated Tests — maps without timing. */
export function computePairRevealStatsFromMaps(
  answersA: AnswerMap,
  answersB: AnswerMap,
  questionMeta: QuestionMeta[],
  textById: Map<string, string>,
): Pick<
  PairRevealStats,
  "sameAnswers" | "questionsCompared" | "fastestMatchQuestionText"
> {
  const toTimed = (map: AnswerMap): Record<string, TimedAnswer> => {
    const out: Record<string, TimedAnswer> = {};
    let t = 0;
    for (const [qid, optionId] of Object.entries(map)) {
      t += 1000;
      out[qid] = { optionId, answeredAtMs: t };
    }
    return out;
  };
  return computePairRevealStatsFromAnswers(
    toTimed(answersA),
    toTimed(answersB),
    questionMeta,
    textById,
  );
}
