import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collectLockedParticipantIds,
  filterValidMaleFemalePairs,
  isValidMaleFemalePair,
  maxAllowedExtractions,
  selectNextPair,
  type ExtractionMode,
  type ParticipantGender,
} from "@/lib/matching/affinity";
import { parseLoveRouletteConfig } from "./event-config";
import type { DisplayOverlay } from "./display-overlay";

export interface LastReveal {
  maleNick: string;
  femaleNick: string;
  maleId: string;
  femaleId: string;
  pairId: string;
  affinityScore: number;
  updatedAt: string;
}

export interface ExtractNextCoupleResult {
  maleNick: string;
  femaleNick: string;
  pairId: string;
  affinityScore: number;
  displayOverlay: DisplayOverlay;
  lastReveal: LastReveal;
}

export class ExtractionError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ExtractionError";
    this.status = status;
  }
}

interface PairRow {
  id: string;
  participant_male_id: string;
  participant_female_id: string;
  affinity_score: number;
  rank: number;
  was_shown: boolean;
  is_eliminated: boolean;
}

export function getLastReveal(
  metadata: Record<string, unknown> | null | undefined,
): LastReveal | null {
  const raw = metadata?.love_roulette_last_reveal;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const maleNick = record.maleNick;
  const femaleNick = record.femaleNick;
  const updatedAt = record.updatedAt;
  const pairId = record.pairId;

  if (
    typeof maleNick !== "string" ||
    !maleNick.trim() ||
    typeof femaleNick !== "string" ||
    !femaleNick.trim() ||
    typeof updatedAt !== "string" ||
    !updatedAt.trim() ||
    typeof pairId !== "string" ||
    !pairId.trim()
  ) {
    return null;
  }

  const affinityScore =
    typeof record.affinityScore === "number" ? record.affinityScore : 0;

  return {
    maleNick: maleNick.trim(),
    femaleNick: femaleNick.trim(),
    maleId:
      typeof record.maleId === "string" && record.maleId.trim()
        ? record.maleId.trim()
        : "",
    femaleId:
      typeof record.femaleId === "string" && record.femaleId.trim()
        ? record.femaleId.trim()
        : "",
    pairId: pairId.trim(),
    affinityScore,
    updatedAt: updatedAt.trim(),
  };
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

async function assertParticipantsNotAlreadyPaired(
  supabase: SupabaseClient,
  eventId: string,
  maleId: string,
  femaleId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("love_roulette_pairs")
    .select("id")
    .eq("event_id", eventId)
    .eq("was_shown", true)
    .or(
      [
        `participant_male_id.eq.${maleId}`,
        `participant_female_id.eq.${maleId}`,
        `participant_male_id.eq.${femaleId}`,
        `participant_female_id.eq.${femaleId}`,
      ].join(","),
    )
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length > 0) {
    throw new ExtractionError(
      "Uno dei due giocatori è già stato estratto in un'altra coppia.",
      409,
    );
  }
}

async function retirePhantomPairsForParticipants(
  supabase: SupabaseClient,
  eventId: string,
  pairId: string,
  maleId: string,
  femaleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("love_roulette_pairs")
    .update({ is_eliminated: true })
    .eq("event_id", eventId)
    .eq("was_shown", false)
    .neq("id", pairId)
    .or(
      [
        `participant_male_id.eq.${maleId}`,
        `participant_female_id.eq.${maleId}`,
        `participant_male_id.eq.${femaleId}`,
        `participant_female_id.eq.${femaleId}`,
      ].join(","),
    );

  if (error) {
    throw new Error(error.message);
  }
}

export async function extractNextCouple(
  supabase: SupabaseClient,
  eventId: string,
  mode: ExtractionMode,
): Promise<ExtractNextCoupleResult> {
  const { data: pairs, error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .select(
      "id, participant_male_id, participant_female_id, affinity_score, rank, was_shown, is_eliminated",
    )
    .eq("event_id", eventId);

  if (pairsError) {
    throw new Error(pairsError.message);
  }

  if (!pairs || pairs.length === 0) {
    throw new ExtractionError(
      "Nessuna coppia disponibile. Completa prima il matching.",
      404,
    );
  }

  const typedPairs = pairs as PairRow[];

  const { genderById, maleCount, femaleCount } =
    await loadParticipantGenderContext(supabase, eventId);

  if (maleCount === 0 || femaleCount === 0) {
    throw new ExtractionError(
      "Servono almeno un uomo e una donna per formare le coppie.",
      404,
    );
  }

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !eventRow) {
    throw new Error(eventError?.message ?? "Event not found");
  }

  const metadata = (eventRow.metadata ?? {}) as Record<string, unknown>;
  const config = parseLoveRouletteConfig(metadata);
  const randomShownCount = typedPairs.filter((pair) => pair.was_shown).length;
  const maxExtractions = maxAllowedExtractions(
    maleCount,
    femaleCount,
    config.extraction_count,
  );

  if (randomShownCount >= maxExtractions) {
    throw new ExtractionError(
      `Limite coppie raggiunto (${maxExtractions}): ogni giocatore può essere estratto una sola volta.`,
      404,
    );
  }

  const eligiblePairs = filterValidMaleFemalePairs(
    typedPairs.map((row) => ({
      id: row.id,
      rank: row.rank,
      was_shown: row.was_shown,
      is_eliminated: row.is_eliminated,
      participant_male_id: row.participant_male_id,
      participant_female_id: row.participant_female_id,
    })),
    genderById,
  );

  const selected = selectNextPair(
    eligiblePairs,
    mode,
    config.hybrid_random_count,
    randomShownCount,
  );

  if (!selected) {
    throw new ExtractionError(
      "Non restano coppie disponibili: ogni uomo e ogni donna possono essere estratti una sola volta.",
      404,
    );
  }

  const pair = typedPairs.find((row) => row.id === selected.id);
  if (!pair) {
    throw new ExtractionError("Coppia selezionata non trovata.", 404);
  }

  if (
    !isValidMaleFemalePair(
      pair.participant_male_id,
      pair.participant_female_id,
      genderById,
    )
  ) {
    throw new ExtractionError(
      "Coppia non valida: ogni coppia deve essere 1 uomo + 1 donna.",
      400,
    );
  }

  const locked = collectLockedParticipantIds(typedPairs);
  if (
    locked.has(pair.participant_male_id) ||
    locked.has(pair.participant_female_id)
  ) {
    throw new ExtractionError(
      "Uno dei due giocatori è già stato estratto in un'altra coppia.",
      409,
    );
  }

  await assertParticipantsNotAlreadyPaired(
    supabase,
    eventId,
    pair.participant_male_id,
    pair.participant_female_id,
  );

  const participantIds = [pair.participant_male_id, pair.participant_female_id];
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
  const maleNick = nickById.get(pair.participant_male_id);
  const femaleNick = nickById.get(pair.participant_female_id);

  if (!maleNick?.trim() || !femaleNick?.trim()) {
    throw new ExtractionError("Partecipanti della coppia non trovati.", 404);
  }

  const now = new Date().toISOString();

  const { data: markedShown, error: updatePairError } = await supabase
    .from("love_roulette_pairs")
    .update({ was_shown: true })
    .eq("id", pair.id)
    .eq("was_shown", false)
    .select("id")
    .maybeSingle();

  if (updatePairError) {
    throw new Error(updatePairError.message);
  }

  if (!markedShown) {
    throw new ExtractionError(
      "Coppia già estratta o non più disponibile. Riprova.",
      409,
    );
  }

  await retirePhantomPairsForParticipants(
    supabase,
    eventId,
    pair.id,
    pair.participant_male_id,
    pair.participant_female_id,
  );

  const lastReveal: LastReveal = {
    maleNick: maleNick.trim(),
    femaleNick: femaleNick.trim(),
    maleId: pair.participant_male_id,
    femaleId: pair.participant_female_id,
    pairId: pair.id,
    affinityScore: pair.affinity_score,
    updatedAt: now,
  };

  const displayOverlay: DisplayOverlay = {
    type: "custom",
    title: "Coppia rivelata!",
    body: `${lastReveal.maleNick} & ${lastReveal.femaleNick}`,
    updatedAt: now,
  };

  const loveRouletteRaw = metadata.love_roulette;
  const loveRoulette =
    loveRouletteRaw &&
    typeof loveRouletteRaw === "object" &&
    !Array.isArray(loveRouletteRaw)
      ? (loveRouletteRaw as Record<string, unknown>)
      : {};

  const { error: metadataError } = await supabase
    .from("events")
    .update({
      metadata: {
        ...metadata,
        love_roulette: {
          ...loveRoulette,
          extraction_mode: mode,
        },
        love_roulette_display: displayOverlay,
        love_roulette_last_reveal: lastReveal,
      },
    })
    .eq("id", eventId);

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  return {
    maleNick: lastReveal.maleNick,
    femaleNick: lastReveal.femaleNick,
    pairId: lastReveal.pairId,
    affinityScore: lastReveal.affinityScore,
    displayOverlay,
    lastReveal,
  };
}
