import type { SupabaseClient } from "@supabase/supabase-js";
import { getBottomNonFinalistPairs } from "@/lib/matching/affinity";
import type { DisplayOverlay } from "./display-overlay";

export type EliminationMode = "next" | "auto_to_finalists";

export interface LastElimination {
  maleNick: string;
  femaleNick: string;
  maleId: string;
  femaleId: string;
  pairId: string;
  rank: number;
  updatedAt: string;
}

export interface FinalistCouple {
  pairId: string;
  maleNick: string;
  femaleNick: string;
  rank: number;
  affinityScore: number;
}

export interface EliminateResult {
  eliminated: LastElimination[];
  finalists: FinalistCouple[];
  displayOverlay: DisplayOverlay;
  lastElimination: LastElimination | null;
}

export class EliminationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "EliminationError";
    this.status = status;
  }
}

interface PairRow {
  id: string;
  participant_male_id: string;
  participant_female_id: string;
  affinity_score: number;
  rank: number;
  is_eliminated: boolean;
  is_finalist: boolean;
  was_shown: boolean;
}

export function getLastElimination(
  metadata: Record<string, unknown> | null | undefined,
): LastElimination | null {
  const raw = metadata?.love_roulette_last_elimination;
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
    rank: typeof record.rank === "number" ? record.rank : 0,
    updatedAt: updatedAt.trim(),
  };
}

export function getFinalistsFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): FinalistCouple[] {
  const raw = metadata?.love_roulette_finalists;
  if (!Array.isArray(raw)) return [];

  const finalists: FinalistCouple[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const maleNick = record.maleNick;
    const femaleNick = record.femaleNick;
    const pairId = record.pairId;
    if (
      typeof maleNick !== "string" ||
      !maleNick.trim() ||
      typeof femaleNick !== "string" ||
      !femaleNick.trim() ||
      typeof pairId !== "string" ||
      !pairId.trim()
    ) {
      continue;
    }
    finalists.push({
      pairId: pairId.trim(),
      maleNick: maleNick.trim(),
      femaleNick: femaleNick.trim(),
      rank: typeof record.rank === "number" ? record.rank : 0,
      affinityScore:
        typeof record.affinityScore === "number" ? record.affinityScore : 0,
    });
  }

  return finalists.sort((a, b) => a.rank - b.rank);
}

function buildFinalists(
  pairs: PairRow[],
  nickById: Map<string, string>,
): FinalistCouple[] {
  return pairs
    .filter((pair) => !pair.is_eliminated)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map((pair) => ({
      pairId: pair.id,
      maleNick: nickById.get(pair.participant_male_id)?.trim() ?? "?",
      femaleNick: nickById.get(pair.participant_female_id)?.trim() ?? "?",
      rank: pair.rank,
      affinityScore: pair.affinity_score,
    }));
}

async function loadPairsContext(
  supabase: SupabaseClient,
  eventId: string,
): Promise<{
  pairs: PairRow[];
  nickById: Map<string, string>;
  metadata: Record<string, unknown>;
}> {
  const { data: pairs, error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .select(
      "id, participant_male_id, participant_female_id, affinity_score, rank, is_eliminated, is_finalist, was_shown",
    )
    .eq("event_id", eventId);

  if (pairsError) {
    throw new Error(pairsError.message);
  }

  if (!pairs || pairs.length === 0) {
    throw new EliminationError(
      "Nessuna coppia disponibile. Completa prima il matching.",
      404,
    );
  }

  const typedPairs = pairs as PairRow[];
  const participantIds = [
    ...new Set(
      typedPairs.flatMap((pair) => [
        pair.participant_male_id,
        pair.participant_female_id,
      ]),
    ),
  ];

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

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !eventRow) {
    throw new Error(eventError?.message ?? "Event not found");
  }

  return {
    pairs: typedPairs,
    nickById,
    metadata: (eventRow.metadata ?? {}) as Record<string, unknown>,
  };
}

function pairToElimination(
  pair: PairRow,
  nickById: Map<string, string>,
  updatedAt: string,
): LastElimination {
  const maleNick = nickById.get(pair.participant_male_id);
  const femaleNick = nickById.get(pair.participant_female_id);

  if (!maleNick?.trim() || !femaleNick?.trim()) {
    throw new EliminationError("Partecipanti della coppia non trovati.", 404);
  }

  return {
    maleNick: maleNick.trim(),
    femaleNick: femaleNick.trim(),
    maleId: pair.participant_male_id,
    femaleId: pair.participant_female_id,
    pairId: pair.id,
    rank: pair.rank,
    updatedAt,
  };
}

async function markFinalists(
  supabase: SupabaseClient,
  eventId: string,
  finalistPairs: PairRow[],
): Promise<void> {
  const finalistIds = finalistPairs.map((pair) => pair.id);
  const finalistParticipantIds = finalistPairs.flatMap((pair) => [
    pair.participant_male_id,
    pair.participant_female_id,
  ]);

  const { error: clearFinalistError } = await supabase
    .from("love_roulette_pairs")
    .update({ is_finalist: false })
    .eq("event_id", eventId);

  if (clearFinalistError) {
    throw new Error(clearFinalistError.message);
  }

  if (finalistIds.length > 0) {
    const { error: markFinalistError } = await supabase
      .from("love_roulette_pairs")
      .update({ is_finalist: true })
      .in("id", finalistIds);

    if (markFinalistError) {
      throw new Error(markFinalistError.message);
    }
  }

  const { error: resetRolesError } = await supabase
    .from("love_roulette_participants")
    .update({ role: "player" })
    .eq("event_id", eventId)
    .neq("role", "animator");

  if (resetRolesError) {
    throw new Error(resetRolesError.message);
  }

  if (finalistParticipantIds.length > 0) {
    const { error: finalistRoleError } = await supabase
      .from("love_roulette_participants")
      .update({ role: "finalist" })
      .in("id", finalistParticipantIds);

    if (finalistRoleError) {
      throw new Error(finalistRoleError.message);
    }

    const { error: audienceRoleError } = await supabase
      .from("love_roulette_participants")
      .update({ role: "audience" })
      .eq("event_id", eventId)
      .eq("role", "player");

    if (audienceRoleError) {
      throw new Error(audienceRoleError.message);
    }
  }
}

export async function eliminatePairs(
  supabase: SupabaseClient,
  eventId: string,
  mode: EliminationMode,
  finalistCount = 3,
): Promise<EliminateResult> {
  const { pairs, nickById, metadata } = await loadPairsContext(
    supabase,
    eventId,
  );

  const active = pairs.filter((pair) => !pair.is_eliminated);
  const toEliminateAll = getBottomNonFinalistPairs(active, finalistCount);

  if (toEliminateAll.length === 0) {
    throw new EliminationError(
      `Restano già ${finalistCount} coppie o meno — nulla da eliminare.`,
      404,
    );
  }

  const targetIds = new Set(
    (mode === "next"
      ? [toEliminateAll[0]!.id]
      : toEliminateAll.map((pair) => pair.id)),
  );
  const targets = active.filter((pair) => targetIds.has(pair.id));

  const now = new Date().toISOString();
  const eliminated: LastElimination[] = targets.map((pair) =>
    pairToElimination(pair, nickById, now),
  );

  const { error: updateError } = await supabase
    .from("love_roulette_pairs")
    .update({ is_eliminated: true })
    .in(
      "id",
      targets.map((pair) => pair.id),
    );

  if (updateError) {
    throw new Error(updateError.message);
  }

  const remaining = pairs
    .map((pair) =>
      targets.some((target) => target.id === pair.id)
        ? { ...pair, is_eliminated: true }
        : pair,
    )
    .filter((pair) => !pair.is_eliminated);

  const markAsFinalists = mode === "auto_to_finalists";
  if (markAsFinalists) {
    await markFinalists(supabase, eventId, remaining);
  }

  const finalists = buildFinalists(
    pairs.map((pair) =>
      targets.some((target) => target.id === pair.id)
        ? { ...pair, is_eliminated: true }
        : pair,
    ),
    nickById,
  );

  const lastElimination = eliminated[eliminated.length - 1] ?? null;
  const overlayBody = lastElimination
    ? `${lastElimination.maleNick} & ${lastElimination.femaleNick}`
    : "";

  const displayOverlay: DisplayOverlay = {
    type: "custom",
    title:
      mode === "auto_to_finalists"
        ? "Finalisti selezionati!"
        : "Coppia eliminata",
    body: overlayBody,
    updatedAt: now,
  };

  const { error: metadataError } = await supabase
    .from("events")
    .update({
      metadata: {
        ...metadata,
        love_roulette_display: displayOverlay,
        love_roulette_last_elimination: lastElimination,
        love_roulette_finalists: finalists,
      },
    })
    .eq("id", eventId);

  if (metadataError) {
    throw new Error(metadataError.message);
  }

  return {
    eliminated,
    finalists,
    displayOverlay,
    lastElimination,
  };
}
