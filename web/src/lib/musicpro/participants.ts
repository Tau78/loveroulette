import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  normalizeParticipantDataVisibility,
} from "@/lib/player/data-visibility";
import type {
  LoveRouletteAgeBand,
  LoveRouletteGender,
  LoveRouletteParticipant,
  LoveRouletteSeeking,
  ParticipantDataVisibility,
} from "./types";
import {
  isDataVisibilitySchemaError,
  missingOptionalParticipantColumn,
} from "./participant-schema";
import {
  explicitSeeking,
  parseLoveRouletteAgeBand,
  parseLoveRouletteGender,
  parsePublicNameMode,
  publicDisplayName,
  type PublicNameMode,
} from "@/lib/player/identity";

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
  gender: LoveRouletteGender;
  seeking: LoveRouletteSeeking;
  /** Fascia raccolta in ingresso. Non filtra il matching. */
  ageBand?: LoveRouletteAgeBand | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  photoUrl: string;
  nick?: string | null;
  publicNameMode: PublicNameMode;
  badgeCode?: string | null;
  dataVisibility?: ParticipantDataVisibility;
  /** Nome anagrafico opzionale (non mostrato a schermo). */
  realName?: string | null;
  /** Reconnect stesso dispositivo (localStorage). */
  participantId?: string | null;
}

const PARTICIPANT_SELECT_BASE =
  "id, event_id, nickname, gender, badge_code, role, is_online";

const PARTICIPANT_SELECT_WITH_VISIBILITY = `${PARTICIPANT_SELECT_BASE}, data_visibility`;

function participantSelectFor(payload: Record<string, unknown>): string {
  const columns = [
    "id",
    "event_id",
    "nickname",
    "gender",
    "badge_code",
    "role",
    "is_online",
  ];
  if ("data_visibility" in payload) columns.push("data_visibility");
  if ("real_name" in payload) columns.push("real_name");
  if ("seeking" in payload) columns.push("seeking");
  if ("age_band" in payload) columns.push("age_band");
  if ("first_name" in payload) columns.push("first_name");
  if ("last_name" in payload) columns.push("last_name");
  if ("phone" in payload) columns.push("phone");
  if ("email" in payload) columns.push("email");
  if ("photo_url" in payload) columns.push("photo_url");
  if ("nick" in payload) columns.push("nick");
  if ("public_name_mode" in payload) columns.push("public_name_mode");
  return columns.join(", ");
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapParticipantRow(row: Record<string, unknown>): LoveRouletteParticipant {
  const gender = parseLoveRouletteGender(row.gender);
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    nickname: String(row.nickname),
    real_name: textOrNull(row.real_name),
    first_name: textOrNull(row.first_name),
    last_name: textOrNull(row.last_name),
    phone: textOrNull(row.phone),
    email: textOrNull(row.email),
    photo_url: textOrNull(row.photo_url),
    nick: textOrNull(row.nick),
    public_name_mode: parsePublicNameMode(row.public_name_mode),
    gender,
    seeking: explicitSeeking(row.seeking),
    age_band: parseLoveRouletteAgeBand(row.age_band),
    badge_code:
      row.badge_code === null || row.badge_code === undefined
        ? null
        : String(row.badge_code),
    role: (row.role as LoveRouletteParticipant["role"]) ?? "player",
    is_online: Boolean(row.is_online),
    data_visibility: normalizeParticipantDataVisibility(row.data_visibility),
  };
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

  if (!isDataVisibilitySchemaError(withVisibility.error)) {
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

  if (!isDataVisibilitySchemaError(withVisibility.error)) {
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

  if (!isDataVisibilitySchemaError(withVisibility.error)) {
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

async function writeParticipantRow(
  supabase: SupabaseClient,
  mode: "insert" | "update",
  participantId: string | null,
  payload: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string; code?: string } | null }> {
  let body = { ...payload };
  for (let attempt = 0; attempt < 6; attempt++) {
    const select = participantSelectFor(body);
    const query =
      mode === "insert"
        ? supabase
            .from("love_roulette_participants")
            .insert(body)
            .select(select)
            .single()
        : supabase
            .from("love_roulette_participants")
            .update(body)
            .eq("id", participantId ?? "")
            .select(select)
            .single();
    const result = await query;
    if (!result.error) {
      return {
        data: result.data,
        error: null,
      };
    }
    const missing = missingOptionalParticipantColumn(result.error, body);
    if (!missing) {
      return {
        data: result.data,
        error: result.error,
      };
    }
    delete body[missing];
  }
  return { data: null, error: { message: "Participant write failed" } };
}

async function markParticipantOnline(
  supabase: SupabaseClient,
  participantId: string,
  input: {
    gender: LoveRouletteGender;
    seeking: LoveRouletteSeeking;
    ageBand?: LoveRouletteAgeBand | null;
    nickname: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    photoUrl: string;
    nick: string | null;
    publicNameMode: PublicNameMode;
    badgeCode?: string | null;
    dataVisibility?: ParticipantDataVisibility;
    realName?: string | null;
  },
): Promise<LoveRouletteParticipant> {
  const update: Record<string, unknown> = {
    is_online: true,
    gender: input.gender,
    last_seen_at: new Date().toISOString(),
  };

  if (input.seeking !== undefined) {
    update.seeking = input.seeking;
  }

  if (input.ageBand !== undefined) {
    update.age_band = input.ageBand;
  }

  update.first_name = input.firstName;
  update.last_name = input.lastName;
  update.phone = input.phone;
  update.email = input.email;
  update.photo_url = input.photoUrl;
  update.nick = input.nick;
  update.public_name_mode = input.publicNameMode;

  if (input.nickname !== undefined) {
    update.nickname = input.nickname;
  }

  if (input.badgeCode !== undefined) {
    update.badge_code = input.badgeCode;
  }

  if (input.dataVisibility !== undefined) {
    update.data_visibility = input.dataVisibility;
  }

  if (input.realName !== undefined) {
    const trimmed = input.realName?.trim() ?? "";
    update.real_name = trimmed || null;
  }

  const result = await writeParticipantRow(
    supabase,
    "update",
    participantId,
    update,
  );

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
  const explicitNick = input.nick?.trim() ? input.nick.trim() : null;
  const nickname = publicDisplayName({
    firstName: input.firstName,
    lastName: input.lastName,
    nick: explicitNick ?? "",
    mode: input.publicNameMode,
  });
  const badge_code = normalizeBadge(input.badgeCode);
  const data_visibility = resolveDataVisibility(input);
  const real_name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const profile = {
    gender: input.gender,
    seeking: input.seeking,
    ageBand: input.ageBand,
    nickname,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    photoUrl: input.photoUrl.trim(),
    nick: explicitNick,
    publicNameMode: input.publicNameMode,
    badgeCode: badge_code,
    dataVisibility: data_visibility,
    realName: real_name,
  };

  if (explicitNick) {
    const taken = await findParticipantByNickname(
      supabase,
      input.eventId,
      explicitNick,
    );
    if (taken && taken.id !== input.participantId) {
      throw new JoinParticipantError(
        "NICKNAME_TAKEN",
        "Questo nick è già in sala — scegline un altro.",
      );
    }
  }

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
            "Questo badge è già usato da un altro giocatore. Lascia il campo vuoto se non hai una pettorina numerata.",
          );
        }
      }

      return markParticipantOnline(supabase, existingById.id, profile);
    }
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
        "Questo badge è già usato da un altro giocatore. Lascia il campo vuoto se non hai una pettorina numerata.",
      );
    }
  }

  const result = await writeParticipantRow(supabase, "insert", null, {
    event_id: input.eventId,
    nickname,
    gender: input.gender,
    seeking: input.seeking,
    age_band: input.ageBand ?? null,
    first_name: profile.firstName,
    last_name: profile.lastName,
    phone: profile.phone,
    email: profile.email,
    photo_url: profile.photoUrl,
    nick: explicitNick,
    public_name_mode: input.publicNameMode,
    badge_code,
    is_online: true,
    last_seen_at: new Date().toISOString(),
    data_visibility,
    real_name,
  });

  if (result.error) {
    const msg = result.error.message.toLowerCase();
    if (result.error.code === "23505") {
      if (msg.includes("badge")) {
        throw new JoinParticipantError(
          "BADGE_TAKEN",
          "Questo badge è già usato da un altro giocatore. Lascia il campo vuoto se non hai una pettorina numerata.",
        );
      }
      throw new JoinParticipantError(
        "NICKNAME_TAKEN",
        explicitNick
          ? "Questo nick è già in sala — scegline un altro."
          : "Questo nome è già in sala. Scegli un nick.",
      );
    }
    if (
      msg.includes("gender_enum") ||
      msg.includes("invalid input value for enum")
    ) {
      throw new Error(
        "Il database non accetta ancora «non binary». Applica la migration identity.",
      );
    }
    if (
      msg.includes("first_name") ||
      msg.includes("photo_url") ||
      msg.includes("public_name_mode")
    ) {
      throw new Error(
        "Profilo non salvato. Applica la migration del profilo giocatore.",
      );
    }
    throw new Error(result.error.message);
  }

  return mapParticipantRow(result.data as Record<string, unknown>);
}
