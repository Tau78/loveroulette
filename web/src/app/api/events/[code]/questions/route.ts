import { NextResponse } from "next/server";
import { ensureDefaultGeneratoreImport } from "@/lib/generatore/auto-import";
import { getQuestionsForEvent } from "@/lib/musicpro/questions";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

export async function GET(
  _request: Request,
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

    const { data: eventRow } = await supabase
      .from("events")
      .select("metadata")
      .eq("id", event.id)
      .maybeSingle();

    const metadata = (eventRow?.metadata ?? {}) as Record<string, unknown>;

    const autoImport = await ensureDefaultGeneratoreImport(
      supabase,
      event.id,
      slug,
      metadata,
    );

    const { source, questions } = await getQuestionsForEvent(
      supabase,
      event.id,
    );

    return NextResponse.json({
      source,
      questions,
      eventSlug: event.slug,
      autoImport,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Database not configured",
        hint: "Set SUPABASE env vars for MusicPro project fvxdghqpavdcohczrvsc",
      },
      { status: 503 },
    );
  }
}
