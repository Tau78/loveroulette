import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";
import {
  advanceFinalsShow,
  initFinalsShow,
  proclaimWinnerShow,
  startChallengeShow,
  tickFinalsShow,
  normalizeFinalsShow,
} from "@/lib/musicpro/finals-show";
import { submitSimBotVotesForSession } from "@/lib/musicpro/simulate-players";
import {
  closeVotingSession,
  getVotingMetadata,
  startVotingSession,
  submitVote,
  VotingError,
  writeVotingMetadataBundle,
} from "@/lib/musicpro/voting";
import { updateSessionRuntimeState } from "@/lib/musicpro/session";

const postSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start_challenge"),
    challengeId: z.enum(["dance", "kiss", "declaration", "kamasutra"]),
  }),
  z.object({
    action: z.literal("advance"),
  }),
  z.object({
    action: z.literal("tick"),
  }),
  z.object({
    action: z.literal("proclaim_winner"),
  }),
  z.object({
    action: z.literal("vote"),
    participantId: z.string().uuid(),
    pairId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("close"),
  }),
  z.object({
    action: z.literal("simulate_bot_votes"),
  }),
]);

function votingPayload(metadata: Record<string, unknown>) {
  const voting = getVotingMetadata(metadata);
  const show = normalizeFinalsShow(voting.show);
  return { voting: { ...voting, show }, show };
}

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
    const { voting, show } = votingPayload(metadata);

    return NextResponse.json({
      runtimeState: event.runtimeState,
      voting,
      show,
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
  const needsPin =
    body.action === "start_challenge" ||
    body.action === "close" ||
    body.action === "advance" ||
    body.action === "proclaim_winner" ||
    body.action === "simulate_bot_votes";
  const isPublicTick = body.action === "tick";

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

    if (
      event.runtimeState !== "finals" &&
      event.runtimeState !== "winner" &&
      body.action !== "close" &&
      body.action !== "tick"
    ) {
      return NextResponse.json(
        { error: "Disponibile solo in fase finali." },
        { status: 409 },
      );
    }

    switch (body.action) {
      case "start_challenge": {
        const result = await startChallengeShow(
          supabase,
          event.id,
          body.challengeId,
        );
        return NextResponse.json({
          show: result.show,
          session: result.session,
          runtimeState: event.runtimeState,
        });
      }
      case "advance": {
        const result = await advanceFinalsShow(supabase, event.id);
        return NextResponse.json({
          show: result.show,
          session: result.session,
          runtimeState: event.runtimeState,
        });
      }
      case "tick": {
        const result = await tickFinalsShow(supabase, event.id);
        let runtimeState = event.runtimeState;
        if (result.show?.phase === "winner_podium" && runtimeState === "finals") {
          await updateSessionRuntimeState(supabase, event.id, "winner");
          runtimeState = "winner";
        }
        return NextResponse.json({
          show: result.show,
          session: result.session,
          runtimeState,
        });
      }
      case "proclaim_winner": {
        const result = await proclaimWinnerShow(supabase, event.id);
        if (!result.tie && result.show.phase === "winner_spectacle") {
          await updateSessionRuntimeState(supabase, event.id, "winner");
        }
        return NextResponse.json({
          show: result.show,
          session: result.session,
          tie: result.tie,
          runtimeState: result.tie ? event.runtimeState : "winner",
        });
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
      case "simulate_bot_votes": {
        const votingMeta = getVotingMetadata(metadata);
        const session = votingMeta.current;
        if (!session || session.status !== "open") {
          return NextResponse.json(
            { error: "Nessuna votazione aperta." },
            { status: 409 },
          );
        }
        const result = await submitSimBotVotesForSession(
          supabase,
          event.id,
          session,
        );
        await writeVotingMetadataBundle(supabase, event.id, {
          ...votingMeta,
          current: result.session,
        });
        return NextResponse.json({
          session: result.session,
          votesSubmitted: result.votesSubmitted,
          runtimeState: event.runtimeState,
        });
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
