import { NextResponse } from "next/server";
import { z } from "zod";
import { simulatePlayersForEvent } from "@/lib/musicpro/simulate-players";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  coupleCount: z.number().int().min(1).max(20).optional(),
  replace: z.boolean().optional(),
  goToMatching: z.boolean().optional(),
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

  let body: z.infer<typeof bodySchema> = {};
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    // Empty body is valid.
  }

  const pin = request.headers.get("X-Animator-Pin");

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();

    const event = await getLoveRouletteEvent(supabase, slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.runtimeState === "closed") {
      return NextResponse.json({ error: "Event is closed" }, { status: 403 });
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

    const result = await simulatePlayersForEvent(
      supabase,
      event.id,
      slug,
      metadata,
      {
        coupleCount: body.coupleCount,
        replace: body.replace,
        goToMatching: body.goToMatching,
      },
    );

    return NextResponse.json({ ...result, eventSlug: slug });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Simulate players failed";
    const status =
      message.includes("Nessuna") || message.includes("domanda") ? 422 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
