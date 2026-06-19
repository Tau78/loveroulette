import { NextResponse } from "next/server";
import { setDisplayAudioCue } from "@/lib/musicpro/display-audio";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();

    const event = await getLoveRouletteEvent(supabase, slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: row, error: metaError } = await supabase
      .from("events")
      .select("metadata")
      .eq("id", event.id)
      .maybeSingle();

    if (metaError || !row) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const pin = request.headers.get("X-Animator-Pin");
    if (!verifyAnimatorPin(metadata, pin)) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    const displayAudioCue = await setDisplayAudioCue(supabase, event.id);

    return NextResponse.json({ displayAudioCue, eventSlug: event.slug });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Start display audio failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
