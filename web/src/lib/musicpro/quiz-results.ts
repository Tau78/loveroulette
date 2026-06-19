import type { SupabaseClient } from "@supabase/supabase-js";

export interface QuestionAnswerStat {
  optionId: string;
  label: string;
  sortOrder: number;
  count: number;
  percent: number;
}

export interface QuestionResults {
  questionId: string;
  totalAnswers: number;
  options: QuestionAnswerStat[];
}

export async function getQuestionAnswerStats(
  supabase: SupabaseClient,
  eventId: string,
  questionId: string,
): Promise<QuestionResults> {
  const { data: options, error: optionsError } = await supabase
    .from("love_roulette_question_options")
    .select("id, label, sort_order")
    .eq("question_id", questionId)
    .order("sort_order", { ascending: true });

  if (optionsError) throw new Error(optionsError.message);

  const optionRows = options ?? [];

  const { data: participants, error: participantsError } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId);

  if (participantsError) throw new Error(participantsError.message);

  const participantIds = (participants ?? []).map((p) => p.id);

  if (participantIds.length === 0 || optionRows.length === 0) {
    return {
      questionId,
      totalAnswers: 0,
      options: optionRows.map((option, index) => ({
        optionId: option.id,
        label: option.label,
        sortOrder: option.sort_order ?? index,
        count: 0,
        percent: 0,
      })),
    };
  }

  const { data: answers, error: answersError } = await supabase
    .from("love_roulette_answers")
    .select("option_id")
    .eq("question_id", questionId)
    .in("participant_id", participantIds);

  if (answersError) throw new Error(answersError.message);

  const counts = new Map<string, number>();
  for (const row of answers ?? []) {
    const optionId = row.option_id as string;
    counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
  }

  const totalAnswers = answers?.length ?? 0;

  const stats: QuestionAnswerStat[] = optionRows.map((option, index) => {
    const count = counts.get(option.id) ?? 0;
    const percent =
      totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
    return {
      optionId: option.id,
      label: option.label,
      sortOrder: option.sort_order ?? index,
      count,
      percent,
    };
  });

  return { questionId, totalAnswers, options: stats };
}
