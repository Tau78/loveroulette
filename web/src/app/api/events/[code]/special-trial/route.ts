import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import {
  SpecialTrialError,
  handleSpecialTrialAction,
} from "@/lib/musicpro/special-trial";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const participantSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().min(1),
});

const bodySchema = z.object({
  action: z.enum([
    "book",
    "unbook",
    "setDuration",
    "pickChallenge",
    "pickMode",
    "setParticipants",
    "start",
    "close",
    "advance",
    "tick",
    "vote",
  ]),
  durationSec: z.number().int().min(10).max(600).optional(),
  challengeId: z
    .enum(["dance", "declaration", "approach", "gaze"])
    .optional(),
  mode: z.enum(["scegli", "chiedi"]).optional(),
  participants: z.array(participantSchema).optional(),
  voterId: z.string().min(1).optional(),
  choiceId: z.string().min(1).optional(),
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
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isPublic = body.action === "tick" || body.action === "vote";

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();

    const event = await getLoveRouletteEvent(supabase, slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.runtimeState !== "quiz") {
      return NextResponse.json(
        { error: "Prova speciale solo durante il quiz." },
        { status: 409 },
      );
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

    if (pinRequired && !isPublic) {
      const pin = request.headers.get("X-Animator-Pin");
      if (!verifyAnimatorPin(metadata, pin)) {
        return NextResponse.json({ error: "Invalid animator pin" }, { status: 403 });
      }
    }

    const result = await handleSpecialTrialAction(supabase, event.id, body);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SpecialTrialError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
