import type { SupabaseClient } from "@supabase/supabase-js";

export const DEMO_JOIN_CODE = "DEMO01";
export const DEMO_ANIMATOR_PIN = "123456";
export const DEMO_TITLE = "Love Roulette — Demo";

export function isDemoJoinCode(slug: string): boolean {
  return slug.toUpperCase() === DEMO_JOIN_CODE;
}

function demoMetadata(): Record<string, unknown> {
  return {
    love_roulette_code: DEMO_JOIN_CODE,
    love_roulette_title: DEMO_TITLE,
    animator_pin: DEMO_ANIMATOR_PIN,
    love_roulette: {
      theme: "dark_fuchsia",
      extraction_mode: "random",
      challenge_order: ["dance", "kiss", "declaration", "kamasutra"],
      stats_visibility: {
        animator_dashboard: true,
        projector: false,
        player_feedback: true,
      },
      chat_enabled: true,
      chat_anonymous: true,
      jury_enabled: false,
      question_mode: "dynamic",
    },
  };
}

async function resolveDemoVenueId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const fromEnv = process.env.LOVE_ROULETTE_DEMO_VENUE_ID?.trim();
  if (fromEnv) return fromEnv;

  const { data, error } = await supabase
    .from("venues")
    .select("id")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.id ?? null;
}

async function ensureDemoSession(
  supabase: SupabaseClient,
  eventId: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("love_roulette_sessions")
    .select("id")
    .eq("event_id", eventId)
    .order("session_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    await supabase.from("love_roulette_sessions").insert({
      event_id: eventId,
      session_number: 1,
      label: "demo",
      runtime_state: "lobby",
      is_rehearsal: true,
    });
  }

  await supabase
    .from("love_roulette_mood_state")
    .upsert({ event_id: eventId }, { onConflict: "event_id" });
}

async function createDemoEvent(
  supabase: SupabaseClient,
): Promise<string | null> {
  const venueId = await resolveDemoVenueId(supabase);
  if (!venueId) return null;

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 7);
  const eventDateIso = eventDate.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("events")
    .insert({
      legacy_event_id: `LR-DEMO-${Date.now()}`,
      event_date: eventDateIso,
      event_time: "21:30:00",
      venue_id: venueId,
      status: "assigned",
      booking_status: "open",
      game_format: "love_roulette",
      is_public: false,
      is_bookable_online: false,
      notes_rounds: "Love Roulette demo",
      metadata: demoMetadata(),
    })
    .select("id")
    .single();

  if (error || !data?.id) return null;

  await ensureDemoSession(supabase, data.id);
  return data.id;
}

async function dedupeDemoEvents(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data: rows, error } = await supabase
    .from("events")
    .select("id, event_date")
    .eq("game_format", "love_roulette")
    .filter("metadata->>love_roulette_code", "eq", DEMO_JOIN_CODE)
    .order("event_date", { ascending: false });

  if (error || !rows?.length) return null;
  if (rows.length === 1) return rows[0].id;

  const eventIds = rows.map((row) => row.id);
  const { data: sessions } = await supabase
    .from("love_roulette_sessions")
    .select("event_id, runtime_state")
    .in("event_id", eventIds);

  const lobbyEventId = sessions?.find(
    (session) => session.runtime_state === "lobby",
  )?.event_id;

  const keepId = lobbyEventId ?? rows[0].id;
  const deleteIds = eventIds.filter((id) => id !== keepId);

  if (deleteIds.length > 0) {
    await supabase.from("events").delete().in("id", deleteIds);
  }

  return keepId;
}

/** Idempotent: one DEMO01 event; dedupes duplicates; creates only if missing. */
export async function ensureDemoEvent(supabase: SupabaseClient): Promise<void> {
  const { data: rows, error } = await supabase
    .from("events")
    .select("id, event_date")
    .eq("game_format", "love_roulette")
    .filter("metadata->>love_roulette_code", "eq", DEMO_JOIN_CODE)
    .order("event_date", { ascending: false });

  if (error) return;

  let eventId: string | null = null;

  if (!rows?.length) {
    eventId = await createDemoEvent(supabase);
  } else if (rows.length > 1) {
    eventId = await dedupeDemoEvents(supabase);
  } else {
    eventId = rows[0].id;
  }

  if (!eventId) return;
  await ensureDemoSession(supabase, eventId);
}

export async function isDemoEventId(
  supabase: SupabaseClient,
  eventId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .eq("game_format", "love_roulette")
    .maybeSingle();

  const code = data?.metadata?.love_roulette_code;
  return typeof code === "string" && code.toUpperCase() === DEMO_JOIN_CODE;
}
