import { NextResponse } from "next/server";
import { z } from "zod";
import {
  joinParticipant,
  JoinParticipantError,
} from "@/lib/musicpro/participants";
import {
  ensureLoveRouletteSession,
  getLoveRouletteEvent,
} from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  nickname: z.string().trim().min(1).max(24),
  gender: z.enum(["male", "female"]),
  badgeCode: z.string().trim().max(32).optional().nullable(),
  participantId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
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

    if (event.runtimeState === "closed") {
      return NextResponse.json({ error: "Event is closed" }, { status: 403 });
    }

    await ensureLoveRouletteSession(supabase, event.id);

    const participant = await joinParticipant(supabase, {
      eventId: event.id,
      nickname: body.nickname,
      gender: body.gender,
      badgeCode: body.badgeCode,
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
