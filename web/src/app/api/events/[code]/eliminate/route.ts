import { NextResponse } from "next/server";
import { z } from "zod";
import {
  eliminatePairs,
  EliminationError,
} from "@/lib/musicpro/elimination";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  mode: z.enum(["next", "auto_to_finalists"]),
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

    const result = await eliminatePairs(supabase, event.id, body.mode);

    return NextResponse.json({
      eliminated: result.eliminated.map((item) => ({
        maleNick: item.maleNick,
        femaleNick: item.femaleNick,
        pairId: item.pairId,
        rank: item.rank,
      })),
      finalists: result.finalists,
      displayOverlay: result.displayOverlay,
      lastElimination: result.lastElimination
        ? {
            maleNick: result.lastElimination.maleNick,
            femaleNick: result.lastElimination.femaleNick,
            updatedAt: result.lastElimination.updatedAt,
          }
        : null,
      eventSlug: event.slug,
    });
  } catch (err) {
    if (err instanceof EliminationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    const message =
      err instanceof Error ? err.message : "Elimination failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
