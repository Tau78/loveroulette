import { NextResponse } from "next/server";
import { z } from "zod";
import {
  advanceQuizQuestion,
  backQuizQuestion,
  finishQuizSession,
  setQuizAutoplayEnabled,
  setQuizAutoplaySeconds,
  setQuizDisplayPhase,
  skipQuizPhase,
  startQuizSession,
  tickQuizPhase,
} from "@/lib/musicpro/quiz-state";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  action: z.enum([
    "start",
    "advance",
    "back",
    "finish",
    "setAutoplaySeconds",
    "setAutoplayEnabled",
    "tick",
    "skipPhase",
    "setPhase",
  ]),
  autoplaySeconds: z.number().int().min(3).max(120).optional(),
  questionCount: z.number().int().min(1).max(200).optional(),
  questionSeconds: z.number().int().min(5).max(120).optional(),
  enabled: z.boolean().optional(),
  displayPhase: z
    .enum([
      "start_countdown",
      "theme_intro",
      "question",
      "answers",
      "results",
      "next_question",
    ])
    .optional(),
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

  const pin = request.headers.get("X-Animator-Pin");
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

    if (!isPublicTick && pinRequired && !verifyAnimatorPin(metadata, pin)) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    switch (body.action) {
      case "start": {
        const quiz = await startQuizSession(supabase, event.id, {
          questionCount: body.questionCount,
          questionSeconds: body.questionSeconds,
        });
        return NextResponse.json({
          quiz,
          runtimeState: "quiz" as const,
        });
      }
      case "advance": {
        const result = await advanceQuizQuestion(supabase, event.id);
        return NextResponse.json(result);
      }
      case "back": {
        const quiz = await backQuizQuestion(supabase, event.id);
        return NextResponse.json({ quiz, runtimeState: "quiz" as const });
      }
      case "finish": {
        const runtimeState = await finishQuizSession(supabase, event.id);
        return NextResponse.json({ quiz: null, runtimeState });
      }
      case "setAutoplaySeconds": {
        if (body.autoplaySeconds === undefined) {
          return NextResponse.json(
            { error: "autoplaySeconds required" },
            { status: 400 },
          );
        }
        const quiz = await setQuizAutoplaySeconds(
          supabase,
          event.id,
          body.autoplaySeconds,
        );
        return NextResponse.json({ quiz, runtimeState: "quiz" as const });
      }
      case "setAutoplayEnabled": {
        if (body.enabled === undefined) {
          return NextResponse.json(
            { error: "enabled required" },
            { status: 400 },
          );
        }
        const quiz = await setQuizAutoplayEnabled(
          supabase,
          event.id,
          body.enabled,
        );
        return NextResponse.json({ quiz, runtimeState: "quiz" as const });
      }
      case "tick": {
        const result = await tickQuizPhase(supabase, event.id, false);
        return NextResponse.json(result);
      }
      case "skipPhase": {
        if (pinRequired && !verifyAnimatorPin(metadata, pin)) {
          return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
        }
        const result = await skipQuizPhase(supabase, event.id);
        return NextResponse.json(result);
      }
      case "setPhase": {
        if (!body.displayPhase) {
          return NextResponse.json(
            { error: "displayPhase required" },
            { status: 400 },
          );
        }
        const quiz = await setQuizDisplayPhase(
          supabase,
          event.id,
          body.displayPhase as QuizDisplayPhase,
        );
        return NextResponse.json({ quiz, runtimeState: "quiz" as const });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quiz action failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
