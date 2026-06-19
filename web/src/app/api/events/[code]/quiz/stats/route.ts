import { NextResponse } from "next/server";
import { getQuestionAnswerStats } from "@/lib/musicpro/quiz-results";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const slug = normalizeEventSlug(code);

  if (!isValidEventSlug(slug)) {
    return NextResponse.json({ error: "Invalid event slug" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get("questionId");

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  try {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();

    const event = await getLoveRouletteEvent(supabase, slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const stats = await getQuestionAnswerStats(
      supabase,
      event.id,
      questionId,
    );

    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stats unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
