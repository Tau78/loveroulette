import { NextResponse } from "next/server";
import { z } from "zod";
import {
  FragmentDonationError,
  donateFragment,
  getFragmentExchangePayload,
} from "@/lib/musicpro/fragment-exchange";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const donateSchema = z.object({
  action: z.literal("donate"),
  fromParticipantId: z.string().uuid(),
  toParticipantId: z.string().uuid(),
  fragmentId: z.string().min(1),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  const url = new URL(request.url);
  const participantId = url.searchParams.get("participantId");
  if (!participantId) {
    return NextResponse.json(
      { error: "participantId query param required" },
      { status: 400 },
    );
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();
    const event = await getLoveRouletteEvent(supabase, slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const payload = await getFragmentExchangePayload(
      supabase,
      event.id,
      participantId,
      event.quizState?.questionIds ?? [],
    );

    return NextResponse.json(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Fragment state unavailable";
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

  let body: z.infer<typeof donateSchema>;
  try {
    const parsed = donateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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

    await donateFragment(
      supabase,
      event.id,
      body.fromParticipantId,
      body.toParticipantId,
      body.fragmentId,
    );

    const payload = await getFragmentExchangePayload(
      supabase,
      event.id,
      body.fromParticipantId,
      event.quizState?.questionIds ?? [],
    );

    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    if (err instanceof FragmentDonationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Donation failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
