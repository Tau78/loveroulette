import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAYER_PRESENCE_STALE_MS } from "./presence";
import {
  getQuizSessionState,
  tickQuizPhase,
  type QuizSessionState,
} from "./quiz-state";

/** Pure: early-close solo se c’è ≥1 online e tutti hanno risposto. */
export function shouldEarlyCloseAnswers(input: {
  onlinePlayerIds: string[];
  answeredParticipantIds: string[];
}): boolean {
  const { onlinePlayerIds, answeredParticipantIds } = input;
  if (onlinePlayerIds.length === 0) return false;
  const answered = new Set(answeredParticipantIds);
  return onlinePlayerIds.every((id) => answered.has(id));
}

/**
 * Online freschi (player/finalist) che devono ancora rispondere.
 * Se nessuno è online → false (resta il countdown).
 */
export async function areAllOnlinePlayersAnswered(
  supabase: SupabaseClient,
  eventId: string,
  questionId: string,
): Promise<boolean> {
  const onlineSince = new Date(
    Date.now() - PLAYER_PRESENCE_STALE_MS,
  ).toISOString();

  const { data: onlineRows, error: onlineError } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("is_online", true)
    .gte("last_seen_at", onlineSince)
    .in("role", ["player", "finalist"]);

  if (onlineError) throw new Error(onlineError.message);

  const onlineIds = (onlineRows ?? []).map((row) => String(row.id));
  if (onlineIds.length === 0) return false;

  const { data: answers, error: answersError } = await supabase
    .from("love_roulette_answers")
    .select("participant_id")
    .eq("question_id", questionId)
    .in("participant_id", onlineIds);

  if (answersError) throw new Error(answersError.message);

  return shouldEarlyCloseAnswers({
    onlinePlayerIds: onlineIds,
    answeredParticipantIds: (answers ?? []).map((row) =>
      String(row.participant_id),
    ),
  });
}

/**
 * Dopo l’ultima risposta: se tutti gli online hanno risposto in fase `answers`,
 * chiude subito (gong + %) senza aspettare il countdown.
 */
export async function maybeCloseAnswersIfAllAnswered(
  supabase: SupabaseClient,
  eventId: string,
  questionId: string,
): Promise<QuizSessionState | null> {
  const { data: row, error } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const quiz = getQuizSessionState(
    (row?.metadata ?? {}) as Record<string, unknown>,
  );
  if (!quiz || quiz.displayPhase !== "answers") return quiz;

  const currentQuestionId = quiz.questionIds[quiz.currentIndex];
  if (!currentQuestionId || currentQuestionId !== questionId) return quiz;

  const allAnswered = await areAllOnlinePlayersAnswered(
    supabase,
    eventId,
    questionId,
  );
  if (!allAnswered) return quiz;

  const result = await tickQuizPhase(supabase, eventId, {
    earlyCloseAnswers: true,
  });
  return result.quiz;
}
