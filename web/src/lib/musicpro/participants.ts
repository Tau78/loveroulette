import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  normalizeParticipantDataVisibility,
} from "@/lib/player/data-visibility";
import type {
  LoveRouletteGender,
  LoveRouletteParticipant,
  ParticipantDataVisibility,
} from "./types";

export type JoinParticipantErrorCode =
  | "NICKNAME_TAKEN"
  | "BADGE_TAKEN";

export class JoinParticipantError extends Error {
  readonly code: JoinParticipantErrorCode;

  constructor(code: JoinParticipantErrorCode, message: string) {
    super(message);
    this.name = "JoinParticipantError";
    this.code = code;
  }
}

export interface JoinParticipantInput {
  eventId: string;
  nickname: string;
  gender: LoveRouletteGender;
  badgeCode?: string | null;
  dataVisibility?: ParticipantDataVisibility;
  /** Reconnect stesso dispositivo (localStorage). */
  participantId?: string | null;
}

const PARTICIPANT_SELECT_BASE =
  "id, event_id, nickname, gender, badge_code, role, is_online";

const PARTICIPANT_SELECT_WITH_VISIBILITY = `${PARTICIPANT_SELECT_BASE}, data_visibility`;

function isMissingDataVisibilityColumn(error: { message?: string }): boolean {
  const msg = error.message?.toLowerCase() ?? "";
  return msg.includes("data_visibility") && msg.includes("does not exist");
}

function mapParticipantRow(row: Record<string, unknown>): LoveRouletteParticipant {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    nickname: String(row.nickname),
    gender: row.gender === "female" ? "female" : "male",
    badge_code:
      row.badge_code === null || row.badge_code === undefined
        ? null
        : String(row.badge_code),
    role: (row.role as LoveRouletteParticipant["role"]) ?? "player",
    is_online: Boolean(row.is_online),
    data_visibility: normalizeParticipantDataVisibility(row.data_visibility),
  };
}

function normalizeNickname(value: string): string {
  return value.trim();
}

function normalizeBadge(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveDataVisibility(
  input: JoinParticipantInput,
): ParticipantDataVisibility {
  return normalizeParticipantDataVisibility(
    input.dataVisibility ?? DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  );
}

async function findParticipantById(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
): Promise<LoveRouletteParticipant | null> {
  const withVisibility = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT_WITH_VISIBILITY)
    .eq("event_id", eventId)
    .eq("id", participantId)
    .maybeSingle();

  if (!withVisibility.error) {
    return withVisibility.data
      ? mapParticipantRow(withVisibility.data as Record<string, unknown>)
      : null;
  }

  if (!isMissingDataVisibilityColumn(withVisibility.error)) {
    throw new Error(withVisibility.error.message);
  }

  const fallback = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT_BASE)
    .eq("event_id", eventId)
    .eq("id", participantId)
    .maybeSingle();

  if (fallback.error) throw new Error(fallback.error.message);
  return fallback.data
    ? mapParticipantRow(fallback.data as Record<string, unknown>)
    : null;
}

async function findParticipantByNickname(
  supabase: SupabaseClient,
  eventId: string,
  nickname: string,
): Promise<LoveRouletteParticipant | null> {
  const withVisibility = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT_WITH_VISIBILITY)
    .eq("event_id", eventId)
    .ilike("nickname", nickname)
    .maybeSingle();

  if (!withVisibility.error) {
    return withVisibility.data
      ? mapParticipantRow(withVisibility.data as Record<string, unknown>)
      : null;
  }

  if (!isMissingDataVisibilityColumn(withVisibility.error)) {
    throw new Error(withVisibility.error.message);
  }

  const fallback = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT_BASE)
    .eq("event_id", eventId)
    .ilike("nickname", nickname)
    .maybeSingle();

  if (fallback.error) throw new Error(fallback.error.message);
  return fallback.data
    ? mapParticipantRow(fallback.data as Record<string, unknown>)
    : null;
}

async function findParticipantByBadge(
  supabase: SupabaseClient,
  eventId: string,
  badgeCode: string,
): Promise<LoveRouletteParticipant | null> {
  const withVisibility = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT_WITH_VISIBILITY)
    .eq("event_id", eventId)
    .eq("badge_code", badgeCode)
    .maybeSingle();

  if (!withVisibility.error) {
    return withVisibility.data
      ? mapParticipantRow(withVisibility.data as Record<string, unknown>)
      : null;
  }

  if (!isMissingDataVisibilityColumn(withVisibility.error)) {
    throw new Error(withVisibility.error.message);
  }

  const fallback = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT_BASE)
    .eq("event_id", eventId)
    .eq("badge_code", badgeCode)
    .maybeSingle();

  if (fallback.error) throw new Error(fallback.error.message);
  return fallback.data
    ? mapParticipantRow(fallback.data as Record<string, unknown>)
    : null;
}

async function markParticipantOnline(
  supabase: SupabaseClient,
  participantId: string,
  input: {
    gender: LoveRouletteGender;
    nickname?: string;
    badgeCode?: string | null;
    dataVisibility?: ParticipantDataVisibility;
  },
): Promise<LoveRouletteParticipant> {
  const update: Record<string, unknown> = {
    is_online: true,
    gender: input.gender,
    last_seen_at: new Date().toISOString(),
  };

  if (input.nickname !== undefined) {
    update.nickname = input.nickname;
  }

  if (input.badgeCode !== undefined) {
    update.badge_code = input.badgeCode;
  }

  if (input.dataVisibility !== undefined) {
    update.data_visibility = input.dataVisibility;
  }

  let result = await supabase
    .from("love_roulette_participants")
    .update(update)
    .eq("id", participantId)
    .select(PARTICIPANT_SELECT_WITH_VISIBILITY)
    .single();

  if (result.error && isMissingDataVisibilityColumn(result.error)) {
    const { data_visibility: _removed, ...updateWithoutVisibility } = update;
    result = await supabase
      .from("love_roulette_participants")
      .update(updateWithoutVisibility)
      .eq("id", participantId)
      .select(PARTICIPANT_SELECT_BASE)
      .single();
  }

  if (result.error) throw new Error(result.error.message);
  return mapParticipantRow(result.data as Record<string, unknown>);
}

export async function setParticipantPresence(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
  online: boolean,
): Promise<void> {
  const participant = await findParticipantById(
    supabase,
    eventId,
    participantId,
  );
  if (!participant) {
    throw new Error("Participant not found");
  }

  const { error } = await supabase
    .from("love_roulette_participants")
    .update({
      is_online: online,
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", participantId);

  if (error) throw new Error(error.message);
}

export async function joinParticipant(
  supabase: SupabaseClient,
  input: JoinParticipantInput,
): Promise<LoveRouletteParticipant> {
  const nickname = normalizeNickname(input.nickname);
  const badge_code = normalizeBadge(input.badgeCode);
  const data_visibility = resolveDataVisibility(input);

  if (input.participantId) {
    const existingById = await findParticipantById(
      supabase,
      input.eventId,
      input.participantId,
    );

    if (existingById) {
      if (badge_code) {
        const badgeOwner = await findParticipantByBadge(
          supabase,
          input.eventId,
          badge_code,
        );
        if (badgeOwner && badgeOwner.id !== existingById.id) {
          throw new JoinParticipantError(
            "BADGE_TAKEN",
            "Questo numero non sembra il tuo, ricontrolla?",
          );
        }
      }

      return markParticipantOnline(supabase, existingById.id, {
        gender: input.gender,
        nickname,
        badgeCode: badge_code,
        dataVisibility: data_visibility,
      });
    }
  }

  const existingNick = await findParticipantByNickname(
    supabase,
    input.eventId,
    nickname,
  );

  if (existingNick) {
    const isReconnectById =
      input.participantId && existingNick.id === input.participantId;
    const isReconnectByBadge =
      Boolean(badge_code) &&
      Boolean(existingNick.badge_code) &&
      existingNick.badge_code === badge_code;

    if (!isReconnectById && !isReconnectByBadge) {
      throw new JoinParticipantError(
        "NICKNAME_TAKEN",
        "Questo nickname è già in sala — scegline un altro.",
      );
    }

    if (badge_code) {
      const badgeOwner = await findParticipantByBadge(
        supabase,
        input.eventId,
        badge_code,
      );
      if (badgeOwner && badgeOwner.id !== existingNick.id) {
        throw new JoinParticipantError(
          "BADGE_TAKEN",
          "Questo numero non sembra il tuo, ricontrolla?",
        );
      }
    }

    return markParticipantOnline(supabase, existingNick.id, {
      gender: input.gender,
      nickname,
      badgeCode: badge_code,
      dataVisibility: data_visibility,
    });
  }

  if (badge_code) {
    const badgeOwner = await findParticipantByBadge(
      supabase,
      input.eventId,
      badge_code,
    );
    if (badgeOwner) {
      throw new JoinParticipantError(
        "BADGE_TAKEN",
        "Questo numero non sembra il tuo, ricontrolla?",
      );
    }
  }

  const insertBase = {
    event_id: input.eventId,
    nickname,
    gender: input.gender,
    badge_code,
    is_online: true,
    last_seen_at: new Date().toISOString(),
  };

  let result = await supabase
    .from("love_roulette_participants")
    .insert({ ...insertBase, data_visibility })
    .select(PARTICIPANT_SELECT_WITH_VISIBILITY)
    .single();

  if (result.error && isMissingDataVisibilityColumn(result.error)) {
    result = await supabase
      .from("love_roulette_participants")
      .insert(insertBase)
      .select(PARTICIPANT_SELECT_BASE)
      .single();
  }

  if (result.error) {
    if (result.error.code === "23505") {
      const msg = result.error.message.toLowerCase();
      if (msg.includes("badge")) {
        throw new JoinParticipantError(
          "BADGE_TAKEN",
          "Questo numero non sembra il tuo, ricontrolla?",
        );
      }
      throw new JoinParticipantError(
        "NICKNAME_TAKEN",
        "Questo nickname è già in sala — scegline un altro.",
      );
    }
    throw new Error(result.error.message);
  }

  return mapParticipantRow(result.data as Record<string, unknown>);
}
