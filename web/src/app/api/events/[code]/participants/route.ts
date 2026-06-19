import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createParticipantAdmin,
  listEventParticipants,
} from "@/lib/musicpro/participant-admin";
import { JoinParticipantError } from "@/lib/musicpro/participants";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const createSchema = z.object({
  nickname: z.string().min(1).max(40),
  gender: z.enum(["male", "female"]),
  badgeCode: z.string().max(20).nullable().optional(),
  role: z
    .enum(["player", "finalist", "audience", "jury", "animator"])
    .optional(),
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
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
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

    const participants = await listEventParticipants(supabase, event.id);
    return NextResponse.json({ participants, eventSlug: slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "List failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  const pin = request.headers.get("X-Animator-Pin");

  let body: z.infer<typeof createSchema>;
  try {
    const parsed = createSchema.safeParse(await request.json());
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

    const participant = await createParticipantAdmin(supabase, {
      eventId: event.id,
      nickname: body.nickname,
      gender: body.gender,
      badgeCode: body.badgeCode ?? null,
      role: body.role,
    });

    return NextResponse.json({ participant });
  } catch (err) {
    if (err instanceof JoinParticipantError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
