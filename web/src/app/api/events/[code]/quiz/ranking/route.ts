import { NextResponse } from "next/server";
import { computePreviewPairs } from "@/lib/musicpro/matching";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

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

    const liveQuiz = event.quizState;
    const answeredIds = liveQuiz
      ? liveQuiz.questionIds.slice(0, liveQuiz.currentIndex + 1)
      : undefined;

    const preview = await computePreviewPairs(supabase, event.id, {
      questionIds: answeredIds,
      limit: 8,
    });

    return NextResponse.json({
      ...preview,
      temporary: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ranking unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
