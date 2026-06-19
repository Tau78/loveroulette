import { NextResponse } from "next/server";
import {
  joinParticipant,
  JoinParticipantError,
} from "@/lib/musicpro/participants";
import {
  ensureLoveRouletteSession,
  getLoveRouletteEvent,
} from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";
import { joinParticipantBodySchema } from "@/lib/player/join-body-schema";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  let body: import("@/lib/player/join-body-schema").JoinParticipantBody;
  try {
    const json = await request.json();
    const parsed = joinParticipantBodySchema.safeParse(json);
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

    if (event.runtimeState === "closed") {
      return NextResponse.json({ error: "Event is closed" }, { status: 403 });
    }

    await ensureLoveRouletteSession(supabase, event.id);

    const participant = await joinParticipant(supabase, {
      eventId: event.id,
      nickname: body.nickname,
      gender: body.gender,
      badgeCode: body.badgeCode,
      dataVisibility: body.dataVisibility,
      participantId: body.participantId,
    });

    return NextResponse.json({ participant, eventSlug: event.slug });
  } catch (err) {
    if (err instanceof JoinParticipantError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Join failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
