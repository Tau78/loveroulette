import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventState } from "@/lib/types";
import {
  buildJoinUrl,
  getDisplayOverlay,
} from "./display-overlay";
import { getLastReveal } from "./extraction";
import {
  ensureFinalistsForEvent,
  getFinalistsFromMetadata,
  getLastElimination,
} from "./elimination";
import { getDisplayAudioCue } from "./display-audio";
import { getQuizSessionState, getQuizSetupPrefs } from "./quiz-state";
import { getVotingMetadata } from "./voting";
import {
  getFinalsShowFromMetadata,
  initFinalsShow,
} from "./finals-show";
import {
  getLoveRouletteJoinCode,
  getLoveRouletteTitle,
  parseLoveRouletteConfig,
} from "./event-config";
import type {
  LoveRouletteEvent,
  LoveRouletteSessionRow,
  MusicProEventRow,
} from "./types";
import { ensureDemoEvent, isDemoJoinCode } from "./demo-event";
import { isEventUuid, isJoinCode, normalizeEventSlug } from "./slug";

async function fetchEventRow(
  supabase: SupabaseClient,
  slug: string,
): Promise<MusicProEventRow | null> {
  const normalized = normalizeEventSlug(slug);

  let query = supabase
    .from("events")
    .select("id, game_format, event_date, event_time, metadata, venues(name)")
    .eq("game_format", "love_roulette");

  if (isEventUuid(normalized)) {
    query = query.eq("id", normalized);
  } else if (isJoinCode(normalized)) {
    query = query.filter("metadata->>love_roulette_code", "eq", normalized);
  } else {
    return null;
  }

  const { data, error } = await query
    .order("event_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as MusicProEventRow;
}

async function fetchLatestSession(
  supabase: SupabaseClient,
  eventId: string,
): Promise<LoveRouletteSessionRow | null> {
  const { data } = await supabase
    .from("love_roulette_sessions")
    .select("id, runtime_state, session_number")
    .eq("event_id", eventId)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as LoveRouletteSessionRow | null;
}

function venueNameFromRow(row: MusicProEventRow): string | null {
  const v = row.venues;
  if (!v) return null;
  if (Array.isArray(v)) return v[0]?.name ?? null;
  return v.name ?? null;
}

export function toLoveRouletteEventView(
  row: MusicProEventRow,
  session: LoveRouletteSessionRow | null,
  urlSlug: string,
): LoveRouletteEvent {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const venueName = venueNameFromRow(row);
  const joinCode = getLoveRouletteJoinCode(meta);

  return {
    id: row.id,
    slug: normalizeEventSlug(urlSlug),
    joinCode,
    title: getLoveRouletteTitle(meta, venueName, row.event_date),
    gameFormat: "love_roulette",
    eventDate: row.event_date,
    eventTime: row.event_time,
    runtimeState: (session?.runtime_state ?? "lobby") as EventState,
    sessionId: session?.id ?? null,
    config: parseLoveRouletteConfig(meta),
    venueName,
    displayOverlay: getDisplayOverlay(meta),
    displayAudioCue: getDisplayAudioCue(meta),
    quizState: getQuizSessionState(meta),
    quizSetup: getQuizSetupPrefs(meta),
    lastReveal: getLastReveal(meta),
    lastElimination: getLastElimination(meta),
    finalists: getFinalistsFromMetadata(meta),
    voting: getVotingMetadata(meta),
    finalsShow: getFinalsShowFromMetadata(meta),
    joinUrl: buildJoinUrl(normalizeEventSlug(urlSlug)),
    animatorPinRequired:
      typeof meta.animator_pin === "string" && meta.animator_pin.trim().length > 0,
  };
}

export async function getLoveRouletteEvent(
  supabase: SupabaseClient,
  slug: string,
): Promise<LoveRouletteEvent | null> {
  const normalized = normalizeEventSlug(slug);
  if (isDemoJoinCode(normalized)) {
    await ensureDemoEvent(supabase);
  }

  const row = await fetchEventRow(supabase, slug);
  if (!row) return null;

  const session = await fetchLatestSession(supabase, row.id);
  let event = toLoveRouletteEventView(row, session, slug);

  if (event.runtimeState === "finals" || event.runtimeState === "winner") {
    const finalists = await ensureFinalistsForEvent(supabase, row.id);
    await initFinalsShow(supabase, row.id);
    const refreshed = await fetchEventRow(supabase, slug);
    const refreshedMeta = (refreshed?.metadata ?? row.metadata ?? {}) as Record<
      string,
      unknown
    >;
    event = {
      ...event,
      finalists,
      voting: getVotingMetadata(refreshedMeta),
      finalsShow: getFinalsShowFromMetadata(refreshedMeta),
    };
  }

  return event;
}

export async function ensureLoveRouletteSession(
  supabase: SupabaseClient,
  eventId: string,
): Promise<LoveRouletteSessionRow> {
  const existing = await fetchLatestSession(supabase, eventId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("love_roulette_sessions")
    .insert({
      event_id: eventId,
      session_number: 1,
      label: "live",
      runtime_state: "lobby",
    })
    .select("id, runtime_state, session_number")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create session");
  }

  await supabase.from("love_roulette_mood_state").upsert(
    { event_id: eventId },
    { onConflict: "event_id" },
  );

  return data as LoveRouletteSessionRow;
}
