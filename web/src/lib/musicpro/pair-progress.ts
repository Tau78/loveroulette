import type { SupabaseClient } from "@supabase/supabase-js";
import {
  filterPairsAvailableForExtraction,
  filterValidMaleFemalePairs,
  maxAllowedExtractions,
  type ParticipantGender,
} from "@/lib/matching/affinity";
import { parseLoveRouletteConfig } from "./event-config";

export interface PairProgress {
  maleCount: number;
  femaleCount: number;
  shownCount: number;
  maxExtractions: number;
  activePairCount: number;
  canExtractMore: boolean;
  canEliminateMore: boolean;
  readyForFinals: boolean;
}

interface PairRow {
  id: string;
  rank: number;
  was_shown: boolean;
  is_eliminated: boolean;
  participant_male_id: string;
  participant_female_id: string;
}

async function loadParticipantGenderContext(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{
  genderById: Map<string, ParticipantGender>;
  maleCount: number;
  femaleCount: number;
}> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id, gender")
    .eq("event_id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  const genderById = new Map<string, ParticipantGender>();
  let maleCount = 0;
  let femaleCount = 0;

  for (const row of data ?? []) {
    const id = String(row.id);
    const gender: ParticipantGender =
      row.gender === "female" ? "female" : "male";
    genderById.set(id, gender);
    if (gender === "male") maleCount++;
    else femaleCount++;
  }

  return { genderById, maleCount, femaleCount };
}

/** Stato estrazione / sfoltimento per pulsanti animatore. */
export async function getPairProgress(
  supabase: SupabaseClient,
  eventId: string,
): Promise<PairProgress | null> {
  const { data: pairs, error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .select(
      "id, rank, was_shown, is_eliminated, participant_male_id, participant_female_id",
    )
    .eq("event_id", eventId);

  if (pairsError) {
    throw new Error(pairsError.message);
  }

  if (!pairs || pairs.length === 0) {
    return null;
  }

  const typedPairs = pairs as PairRow[];
  const { genderById, maleCount, femaleCount } =
    await loadParticipantGenderContext(supabase, eventId);

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    throw new Error(eventError.message);
  }

  const config = parseLoveRouletteConfig(
    (eventRow?.metadata ?? {}) as Record<string, unknown>,
  );

  const shownCount = typedPairs.filter((pair) => pair.was_shown).length;
  const activePairCount = typedPairs.filter((pair) => !pair.is_eliminated).length;
  const maxExtractions = maxAllowedExtractions(
    maleCount,
    femaleCount,
    config.extraction_count,
  );

  const eligibleForExtraction = filterPairsAvailableForExtraction(
    filterValidMaleFemalePairs(
      typedPairs.map((row) => ({
        id: row.id,
        rank: row.rank,
        was_shown: row.was_shown,
        is_eliminated: row.is_eliminated,
        participant_male_id: row.participant_male_id,
        participant_female_id: row.participant_female_id,
      })),
      genderById,
    ),
  );

  const canExtractMore =
    maleCount > 0 &&
    femaleCount > 0 &&
    shownCount < maxExtractions &&
    eligibleForExtraction.length > 0;

  const canEliminateMore = activePairCount > 3;
  const readyForFinals = shownCount > 0 && activePairCount <= 3;

  return {
    maleCount,
    femaleCount,
    shownCount,
    maxExtractions,
    activePairCount,
    canExtractMore,
    canEliminateMore,
    readyForFinals,
  };
}
