import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeParticipantDataVisibility } from "@/lib/player/data-visibility";
import type {
  LoveRouletteGender,
  LoveRouletteParticipant,
  LoveRouletteParticipantRole,
} from "./types";
import { isDataVisibilitySchemaError } from "./participant-schema";
import { JoinParticipantError } from "./participants";

const PARTICIPANT_ADMIN_SELECT_BASE =
  "id, event_id, nickname, gender, badge_code, role, is_online, last_seen_at";

const PARTICIPANT_ADMIN_SELECT = `${PARTICIPANT_ADMIN_SELECT_BASE}, data_visibility`;

type AdminParticipantQueryResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
};

async function withDataVisibilityFallback<T>(
  run: (select: string) => PromiseLike<AdminParticipantQueryResult>,
  map: (rows: Record<string, unknown>[]) => T,
): Promise<T> {
  const primary = await run(PARTICIPANT_ADMIN_SELECT);
  if (!primary.error) {
    const rows = Array.isArray(primary.data)
      ? (primary.data as Record<string, unknown>[])
      : primary.data
        ? [primary.data as Record<string, unknown>]
        : [];
    return map(rows);
  }

  if (!isDataVisibilitySchemaError(primary.error)) {
    throw new Error(primary.error.message);
  }

  const fallback = await run(PARTICIPANT_ADMIN_SELECT_BASE);
  if (fallback.error) throw new Error(fallback.error.message);

  const rows = Array.isArray(fallback.data)
    ? (fallback.data as Record<string, unknown>[])
    : fallback.data
      ? [fallback.data as Record<string, unknown>]
      : [];
  return map(rows);
}

export interface AdminParticipantRow extends LoveRouletteParticipant {
  last_seen_at: string | null;
  created_at: string | null;
}

export interface CreateParticipantAdminInput {
  eventId: string;
  nickname: string;
  gender: LoveRouletteGender;
  badgeCode?: string | null;
  role?: LoveRouletteParticipantRole;
}

export interface UpdateParticipantAdminInput {
  nickname?: string;
  gender?: LoveRouletteGender;
  badgeCode?: string | null;
  role?: LoveRouletteParticipantRole;
}

function mapRow(row: Record<string, unknown>): AdminParticipantRow {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    nickname: String(row.nickname),
    gender: row.gender === "female" ? "female" : "male",
    badge_code: (row.badge_code as string | null) ?? null,
    role: (row.role as LoveRouletteParticipantRole) ?? "player",
    is_online: Boolean(row.is_online),
    data_visibility: normalizeParticipantDataVisibility(row.data_visibility),
    last_seen_at: (row.last_seen_at as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  };
}

export async function listEventParticipants(
  supabase: SupabaseClient,
  eventId: string,
): Promise<AdminParticipantRow[]> {
  return withDataVisibilityFallback(
    (select) =>
      supabase
        .from("love_roulette_participants")
        .select(select)
        .eq("event_id", eventId)
        .order("nickname", { ascending: true }),
    (rows) => rows.map((row) => mapRow(row)),
  );
}

export async function getEventParticipant(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
): Promise<AdminParticipantRow | null> {
  return withDataVisibilityFallback(
    (select) =>
      supabase
        .from("love_roulette_participants")
        .select(select)
        .eq("event_id", eventId)
        .eq("id", participantId)
        .maybeSingle(),
    (rows) => (rows[0] ? mapRow(rows[0]) : null),
  );
}

async function assertNicknameAvailable(
  supabase: SupabaseClient,
  eventId: string,
  nickname: string,
  excludeId?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId)
    .ilike("nickname", nickname.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data && data.id !== excludeId) {
    throw new JoinParticipantError(
      "NICKNAME_TAKEN",
      "Nickname già in uso per questo evento.",
    );
  }
}

async function assertBadgeAvailable(
  supabase: SupabaseClient,
  eventId: string,
  badgeCode: string | null,
  excludeId?: string,
): Promise<void> {
  if (!badgeCode) return;

  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("badge_code", badgeCode)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data && data.id !== excludeId) {
    throw new JoinParticipantError(
      "BADGE_TAKEN",
      "Badge già assegnato a un altro giocatore.",
    );
  }
}

export async function createParticipantAdmin(
  supabase: SupabaseClient,
  input: CreateParticipantAdminInput,
): Promise<AdminParticipantRow> {
  const nickname = input.nickname.trim();
  if (!nickname) throw new Error("Nickname obbligatorio.");

  const badge_code = input.badgeCode?.trim() || null;

  await assertNicknameAvailable(supabase, input.eventId, nickname);
  await assertBadgeAvailable(supabase, input.eventId, badge_code);

  const insertResult = await supabase
    .from("love_roulette_participants")
    .insert({
      event_id: input.eventId,
      nickname,
      gender: input.gender,
      badge_code,
      role: input.role ?? "player",
      is_online: false,
    })
    .select("id")
    .single();

  if (insertResult.error) {
    if (insertResult.error.code === "23505") {
      throw new JoinParticipantError("NICKNAME_TAKEN", "Nickname già in uso.");
    }
    throw new Error(insertResult.error.message);
  }

  const created = await getEventParticipant(
    supabase,
    input.eventId,
    String(insertResult.data.id),
  );
  if (!created) throw new Error("Giocatore creato ma non trovato.");
  return created;
}

export async function updateParticipantAdmin(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
  input: UpdateParticipantAdminInput,
): Promise<AdminParticipantRow> {
  const existing = await getEventParticipant(supabase, eventId, participantId);
  if (!existing) throw new Error("Giocatore non trovato.");

  const nickname =
    input.nickname !== undefined ? input.nickname.trim() : existing.nickname;
  const badge_code =
    input.badgeCode !== undefined
      ? input.badgeCode?.trim() || null
      : existing.badge_code;

  if (!nickname) throw new Error("Nickname obbligatorio.");

  if (input.nickname !== undefined) {
    await assertNicknameAvailable(supabase, eventId, nickname, participantId);
  }

  if (input.badgeCode !== undefined) {
    await assertBadgeAvailable(supabase, eventId, badge_code, participantId);
  }

  const update: Record<string, unknown> = {};
  if (input.nickname !== undefined) update.nickname = nickname;
  if (input.gender !== undefined) update.gender = input.gender;
  if (input.badgeCode !== undefined) update.badge_code = badge_code;
  if (input.role !== undefined) update.role = input.role;

  const { error } = await supabase
    .from("love_roulette_participants")
    .update(update)
    .eq("id", participantId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  const updated = await getEventParticipant(supabase, eventId, participantId);
  if (!updated) throw new Error("Giocatore non trovato dopo aggiornamento.");
  return updated;
}

export async function deleteParticipantAdmin(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
): Promise<void> {
  const existing = await getEventParticipant(supabase, eventId, participantId);
  if (!existing) throw new Error("Giocatore non trovato.");

  const { error: answersError } = await supabase
    .from("love_roulette_answers")
    .delete()
    .eq("participant_id", participantId);

  if (answersError) throw new Error(answersError.message);

  const { error: pairsError } = await supabase
    .from("love_roulette_pairs")
    .delete()
    .eq("event_id", eventId)
    .or(
      `participant_male_id.eq.${participantId},participant_female_id.eq.${participantId}`,
    );

  if (pairsError) throw new Error(pairsError.message);

  const { error } = await supabase
    .from("love_roulette_participants")
    .delete()
    .eq("id", participantId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);
}

export async function setParticipantOfflineAdmin(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
): Promise<AdminParticipantRow> {
  const { error } = await supabase
    .from("love_roulette_participants")
    .update({ is_online: false })
    .eq("id", participantId)
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);

  const updated = await getEventParticipant(supabase, eventId, participantId);
  if (!updated) throw new Error("Giocatore non trovato.");
  return updated;
}
