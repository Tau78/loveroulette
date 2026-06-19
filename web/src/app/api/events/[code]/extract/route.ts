import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractNextCouple,
  ExtractionError,
} from "@/lib/musicpro/extraction";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  mode: z.enum(["random", "ranked", "hybrid"]).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pin = request.headers.get("X-Animator-Pin");

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
    const pinRequired =
      typeof metadata.animator_pin === "string" &&
      metadata.animator_pin.trim().length > 0;

    if (pinRequired && !verifyAnimatorPin(metadata, pin)) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    const mode = body.mode ?? event.config.extraction_mode;
    const result = await extractNextCouple(supabase, event.id, mode);

    return NextResponse.json({
      maleNick: result.maleNick,
      femaleNick: result.femaleNick,
      pairId: result.pairId,
      affinityScore: result.affinityScore,
      displayOverlay: result.displayOverlay,
      lastReveal: {
        maleNick: result.lastReveal.maleNick,
        femaleNick: result.lastReveal.femaleNick,
        updatedAt: result.lastReveal.updatedAt,
      },
      eventSlug: event.slug,
    });
  } catch (err) {
    if (err instanceof ExtractionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    const message =
      err instanceof Error ? err.message : "Couple extraction failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
