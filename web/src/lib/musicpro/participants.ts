import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoveRouletteGender, LoveRouletteParticipant } from "./types";

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
  /** Reconnect stesso dispositivo (localStorage). */
  participantId?: string | null;
}

const PARTICIPANT_SELECT =
  "id, event_id, nickname, gender, badge_code, role, is_online";

function normalizeNickname(value: string): string {
  return value.trim();
}

function normalizeBadge(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function findParticipantById(
  supabase: SupabaseClient,
  eventId: string,
  participantId: string,
): Promise<LoveRouletteParticipant | null> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT)
    .eq("event_id", eventId)
    .eq("id", participantId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as LoveRouletteParticipant | null) ?? null;
}

async function findParticipantByNickname(
  supabase: SupabaseClient,
  eventId: string,
  nickname: string,
): Promise<LoveRouletteParticipant | null> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT)
    .eq("event_id", eventId)
    .ilike("nickname", nickname)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as LoveRouletteParticipant | null) ?? null;
}

async function findParticipantByBadge(
  supabase: SupabaseClient,
  eventId: string,
  badgeCode: string,
): Promise<LoveRouletteParticipant | null> {
  const { data, error } = await supabase
    .from("love_roulette_participants")
    .select(PARTICIPANT_SELECT)
    .eq("event_id", eventId)
    .eq("badge_code", badgeCode)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as LoveRouletteParticipant | null) ?? null;
}

async function markParticipantOnline(
  supabase: SupabaseClient,
  participantId: string,
  input: {
    gender: LoveRouletteGender;
    nickname?: string;
    badgeCode?: string | null;
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

  const { data, error } = await supabase
    .from("love_roulette_participants")
    .update(update)
    .eq("id", participantId)
    .select(PARTICIPANT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return data as LoveRouletteParticipant;
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

  const { data, error } = await supabase
    .from("love_roulette_participants")
    .insert({
      event_id: input.eventId,
      nickname,
      gender: input.gender,
      badge_code,
      is_online: true,
      last_seen_at: new Date().toISOString(),
    })
    .select(PARTICIPANT_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      const msg = error.message.toLowerCase();
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
    throw new Error(error.message);
  }

  return data as LoveRouletteParticipant;
}
