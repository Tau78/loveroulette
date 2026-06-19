import type { SupabaseClient } from "@supabase/supabase-js";
import {
  selectNextPair,
  type ExtractionMode,
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

  const selected = selectNextPair(
    typedPairs,
    mode,
    config.hybrid_random_count,
    randomShownCount,
  );

  if (!selected) {
    throw new ExtractionError(
      "Tutte le coppie sono già state estratte.",
      404,
    );
  }

  const pair = typedPairs.find((row) => row.id === selected.id);
  if (!pair) {
    throw new ExtractionError("Coppia selezionata non trovata.", 404);
  }

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

  const { error: updatePairError } = await supabase
    .from("love_roulette_pairs")
    .update({ was_shown: true })
    .eq("id", pair.id);

  if (updatePairError) {
    throw new Error(updatePairError.message);
  }

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
