import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";
import {
  closeVotingSession,
  getVotingMetadata,
  startVotingSession,
  submitVote,
  VotingError,
} from "@/lib/musicpro/voting";

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start_challenge"),
    challengeId: z.enum(["dance", "kiss", "declaration", "kamasutra"]),
  }),
  z.object({
    action: z.literal("vote"),
    participantId: z.string().uuid(),
    pairId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("close"),
  }),
]);

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

    const { data: eventRow } = await supabase
      .from("events")
      .select("metadata")
      .eq("id", event.id)
      .maybeSingle();

    const metadata = (eventRow?.metadata ?? {}) as Record<string, unknown>;
    const voting = getVotingMetadata(metadata);

    return NextResponse.json({
      runtimeState: event.runtimeState,
      voting,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voting state failed";
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

  let body: z.infer<typeof postSchema>;
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const pin = request.headers.get("X-Animator-Pin");
  const needsPin = body.action === "start_challenge" || body.action === "close";

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

    if (needsPin && pinRequired && !verifyAnimatorPin(metadata, pin)) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    if (event.runtimeState !== "finals" && body.action !== "close") {
      return NextResponse.json(
        { error: "La votazione è disponibile solo in fase finali." },
        { status: 409 },
      );
    }

    switch (body.action) {
      case "start_challenge": {
        const session = await startVotingSession(
          supabase,
          event.id,
          body.challengeId,
        );
        return NextResponse.json({ session, runtimeState: event.runtimeState });
      }
      case "vote": {
        const session = await submitVote(
          supabase,
          event.id,
          body.participantId,
          body.pairId,
        );
        return NextResponse.json({ session, runtimeState: event.runtimeState });
      }
      case "close": {
        const session = await closeVotingSession(supabase, event.id);
        return NextResponse.json({ session, runtimeState: event.runtimeState });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof VotingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Voting action failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
