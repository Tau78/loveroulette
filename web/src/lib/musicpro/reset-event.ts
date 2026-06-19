import type { SupabaseClient } from "@supabase/supabase-js";
import { setDisplayOverlay } from "./display-overlay";
import { updateSessionRuntimeState } from "./session";

export interface ResetEventOptions {
  /** Rimuove anche i giocatori iscritti (default: false — restano in lista). */
  clearParticipants?: boolean;
}

export interface ResetEventResult {
  runtimeState: "lobby";
  clearedParticipants: boolean;
}

export async function resetLoveRouletteEvent(
  supabase: SupabaseClient,
  eventId: string,
  options: ResetEventOptions = {},
): Promise<ResetEventResult> {
  const clearParticipants = options.clearParticipants === true;

  const { data: participants } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId);

  const participantIds = (participants ?? []).map((row) => row.id);

  if (participantIds.length > 0) {
    const { error: answersError } = await supabase
      .from("love_roulette_answers")
      .delete()
      .in("participant_id", participantIds);

    if (answersError) {
      throw new Error(answersError.message);
    }
  }

  const { error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .delete()
    .eq("event_id", eventId);

  if (pairsError) {
    throw new Error(pairsError.message);
  }

  const { data: eventQuestions } = await supabase
    .from("love_roulette_questions")
    .select("id")
    .eq("event_id", eventId);

  const questionIds = (eventQuestions ?? []).map((row) => row.id);

  if (questionIds.length > 0) {
    const { error: optionsError } = await supabase
      .from("love_roulette_question_options")
      .delete()
      .in("question_id", questionIds);

    if (optionsError) {
      throw new Error(optionsError.message);
    }

    const { error: questionsError } = await supabase
      .from("love_roulette_questions")
      .delete()
      .eq("event_id", eventId);

    if (questionsError) {
      throw new Error(questionsError.message);
    }
  }

  if (clearParticipants) {
    const { error: participantsError } = await supabase
      .from("love_roulette_participants")
      .delete()
      .eq("event_id", eventId);

    if (participantsError) {
      throw new Error(participantsError.message);
    }
  } else if (participantIds.length > 0) {
    const { error: offlineError } = await supabase
      .from("love_roulette_participants")
      .update({ is_online: false })
      .eq("event_id", eventId);

    if (offlineError) {
      throw new Error(offlineError.message);
    }
  }

  const { data: eventRow, error: fetchError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !eventRow) {
    throw new Error(fetchError?.message ?? "Event not found");
  }

  const metadata = (eventRow.metadata ?? {}) as Record<string, unknown>;
  const nextMetadata = { ...metadata };
  delete nextMetadata.love_roulette_quiz;
  delete nextMetadata.love_roulette_display;
  delete nextMetadata.love_roulette_last_reveal;
  delete nextMetadata.love_roulette_voting;

  const { error: metadataError } = await supabase
    .from("events")
    .update({ metadata: nextMetadata })
    .eq("id", eventId);

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  await updateSessionRuntimeState(supabase, eventId, "lobby");
  await setDisplayOverlay(supabase, eventId, { type: "clear" });

  return {
    runtimeState: "lobby",
    clearedParticipants: clearParticipants,
  };
}
