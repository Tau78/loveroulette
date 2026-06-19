import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteParticipantAdmin,
  getEventParticipant,
  setParticipantOfflineAdmin,
  updateParticipantAdmin,
} from "@/lib/musicpro/participant-admin";
import { JoinParticipantError } from "@/lib/musicpro/participants";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const patchSchema = z.object({
  nickname: z.string().min(1).max(40).optional(),
  gender: z.enum(["male", "female"]).optional(),
  badgeCode: z.string().max(20).nullable().optional(),
  role: z
    .enum(["player", "finalist", "audience", "jury", "animator"])
    .optional(),
  forceOffline: z.boolean().optional(),
});

async function authorize(
  metadata: Record<string, unknown>,
  pin: string | null,
): Promise<boolean> {
  const pinRequired =
    typeof metadata.animator_pin === "string" &&
    metadata.animator_pin.trim().length > 0;
  if (pinRequired && !verifyAnimatorPin(metadata, pin)) {
    return false;
  }
  return true;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string; participantId: string }> },
) {
  const { code, participantId } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
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
    if (!(await authorize(metadata, pin))) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    const participant = await getEventParticipant(
      supabase,
      event.id,
      participantId,
    );
    if (!participant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ participant });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string; participantId: string }> },
) {
  const { code, participantId } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  const pin = request.headers.get("X-Animator-Pin");

  let body: z.infer<typeof patchSchema>;
  try {
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
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

    const metadata = (eventRow?.metadata ?? {}) as Record<string, unknown>;
    if (!(await authorize(metadata, pin))) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    if (body.forceOffline) {
      const participant = await setParticipantOfflineAdmin(
        supabase,
        event.id,
        participantId,
      );
      return NextResponse.json({ participant });
    }

    const participant = await updateParticipantAdmin(
      supabase,
      event.id,
      participantId,
      {
        nickname: body.nickname,
        gender: body.gender,
        badgeCode: body.badgeCode,
        role: body.role,
      },
    );

    return NextResponse.json({ participant });
  } catch (err) {
    if (err instanceof JoinParticipantError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string; participantId: string }> },
) {
  const { code, participantId } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
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
    if (!(await authorize(metadata, pin))) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    await deleteParticipantAdmin(supabase, event.id, participantId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
