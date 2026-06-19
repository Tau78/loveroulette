import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { resetLoveRouletteEvent } from "@/lib/musicpro/reset-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  clearParticipants: z.boolean().optional(),
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
    const raw = await request.text();
    if (raw.trim()) {
      const parsed = bodySchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
      body = parsed.data;
    }
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

    const result = await resetLoveRouletteEvent(supabase, event.id, {
      clearParticipants: body.clearParticipants,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      eventSlug: slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
