import { NextResponse } from "next/server";
import { z } from "zod";
import { submitAnswer } from "@/lib/musicpro/questions";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  participantId: z.string().uuid(),
  questionId: z.string().uuid(),
  optionId: z.string().uuid(),
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

    const answer = await submitAnswer(supabase, {
      eventId: event.id,
      participantId: body.participantId,
      questionId: body.questionId,
      optionId: body.optionId,
    });

    return NextResponse.json({ answer, eventSlug: event.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submit answer failed";
    const status = message.includes("already submitted")
      ? 409
      : message.includes("not found")
        ? 422
        : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
