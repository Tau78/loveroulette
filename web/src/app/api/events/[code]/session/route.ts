import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureLoveRouletteSession,
  getLoveRouletteEvent,
} from "@/lib/musicpro/resolve-event";
import {
  getEventStats,
  updateSessionRuntimeState,
  verifyAnimatorPin,
} from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  runtimeState: z.enum([
    "lobby",
    "quiz",
    "matching",
    "extraction",
    "elimination",
    "finals",
    "winner",
    "closed",
  ]),
});

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

    const stats = await getEventStats(supabase, event.id);

    return NextResponse.json({
      runtimeState: event.runtimeState,
      sessionId: event.sessionId,
      stats,
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

export async function PATCH(
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
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
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

    const pin = request.headers.get("X-Animator-Pin");
    if (
      !verifyAnimatorPin(
        (eventRow?.metadata ?? {}) as Record<string, unknown>,
        pin,
      )
    ) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    await ensureLoveRouletteSession(supabase, event.id);

    const { sessionId, runtimeState } = await updateSessionRuntimeState(
      supabase,
      event.id,
      body.runtimeState,
    );

    return NextResponse.json({ runtimeState, sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session update failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
