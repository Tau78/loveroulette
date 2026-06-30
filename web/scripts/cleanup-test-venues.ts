import { pathToFileURL } from "node:url";
import { createServiceClient } from "@/lib/supabase/service";

const TEST_VENUE_PATTERNS = [
  "%test%",
  "%demo%",
  "%prova%",
  "%temp%",
  "%sandbox%",
] as const;

export interface CleanupTestVenuesOptions {
  /** Se false (default), elenca solo cosa verrebbe eliminato. */
  apply?: boolean;
  /** Esclude il venue usato da DEMO01 (env LOVE_ROULETTE_DEMO_VENUE_ID). */
  excludeDemoVenue?: boolean;
}

interface TestVenueRow {
  id: string;
  name: string;
  city: string | null;
}

interface EventRow {
  id: string;
  event_date: string;
  game_format: string | null;
}

async function listTestVenues(
  supabase: ReturnType<typeof createServiceClient>,
  excludeVenueId: string | null,
): Promise<TestVenueRow[]> {
  const orFilter = [
    "name.ilike.%test%",
    "name.ilike.%demo%",
    "name.ilike.%prova%",
    "name.ilike.%temp%",
    "name.ilike.%sandbox%",
    "city.ilike.%test%",
  ].join(",");

  let query = supabase
    .from("venues")
    .select("id, name, city")
    .or(orFilter)
    .order("name", { ascending: true });

  if (excludeVenueId) {
    query = query.neq("id", excludeVenueId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as TestVenueRow[];
}

async function deleteLoveRouletteEventData(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string,
): Promise<void> {
  const { data: participants } = await supabase
    .from("love_roulette_participants")
    .select("id")
    .eq("event_id", eventId);

  const participantIds = (participants ?? []).map((row) => row.id);

  if (participantIds.length > 0) {
    const { error: answersError } = await supabase
      .from("love_roulette_answers")
      .delete()
      .in("participant_id", participantIds);
    if (answersError) throw new Error(answersError.message);
  }

  const tables = [
    "love_roulette_pairs",
    "love_roulette_participants",
    "love_roulette_sessions",
    "love_roulette_mood_state",
    "love_roulette_questions",
  ] as const;

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("event_id", eventId);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function deleteEvent(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string,
): Promise<void> {
  await deleteLoveRouletteEventData(supabase, eventId);

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    throw new Error(
      `Impossibile eliminare evento ${eventId}: ${error.message}. Potrebbero esserci dipendenze Cervellone/booking — vedi scripts/cleanup-test-venues.sql`,
    );
  }
}

export async function runCleanupTestVenues(
  options: CleanupTestVenuesOptions = {},
): Promise<void> {
  const apply = options.apply === true;
  const excludeDemoVenue = options.excludeDemoVenue !== false;
  const supabase = createServiceClient();

  const excludeVenueId =
    excludeDemoVenue && process.env.LOVE_ROULETTE_DEMO_VENUE_ID?.trim()
      ? process.env.LOVE_ROULETTE_DEMO_VENUE_ID.trim()
      : null;

  const venues = await listTestVenues(supabase, excludeVenueId);

  if (venues.length === 0) {
    console.log("Nessun locale di test trovato.", TEST_VENUE_PATTERNS.join(", "));
    return;
  }

  let eventTotal = 0;

  for (const venue of venues) {
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, event_date, game_format")
      .eq("venue_id", venue.id)
      .order("event_date", { ascending: false });

    if (eventsError) throw new Error(eventsError.message);

    const venueEvents = (events ?? []) as EventRow[];
    eventTotal += venueEvents.length;

    console.log(
      `${apply ? "Elimino" : "[dry-run]"} locale "${venue.name}" (${venue.city ?? "—"}) — ${venueEvents.length} eventi`,
    );

    for (const event of venueEvents) {
      console.log(`  · ${event.event_date} | ${event.game_format ?? "—"} | ${event.id}`);
      if (apply) {
        await deleteEvent(supabase, event.id);
      }
    }

    if (apply) {
      const { error: venueError } = await supabase
        .from("venues")
        .delete()
        .eq("id", venue.id);
      if (venueError) throw new Error(venueError.message);
    }
  }

  console.log(
    apply
      ? `Pulizia completata: ${venues.length} locali, ${eventTotal} eventi.`
      : `Dry-run: ${venues.length} locali, ${eventTotal} eventi. Usa --apply per eliminare.`,
  );
}

function parseArgs(argv: string[]): CleanupTestVenuesOptions {
  return {
    apply: argv.includes("--apply"),
    excludeDemoVenue: !argv.includes("--include-demo-venue"),
  };
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  await runCleanupTestVenues(parseArgs(argv));
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((err) => {
    console.error(
      "cleanup:test-venues FAIL —",
      err instanceof Error ? err.message : err,
    );
    process.exit(1);
  });
}
