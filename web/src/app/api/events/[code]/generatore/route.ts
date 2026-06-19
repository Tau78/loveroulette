import { NextResponse } from "next/server";
import { z } from "zod";
import {
  exportMancheDocument,
  importMancheDocument,
} from "@/lib/generatore/manche";
import type { GeneratoreMancheDocument } from "@/lib/generatore/types";
import { GENERATORE_FORMAT_ID } from "@/lib/generatore/types";
import {
  advanceQuizQuestion,
  finishQuizSession,
  getQuizSessionState,
  skipQuizPhase,
  startQuizSession,
  tickQuizPhase,
} from "@/lib/musicpro/quiz-state";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("import_manche"),
    document: z.object({
      format: z.literal(GENERATORE_FORMAT_ID),
      version: z.literal(1),
      manche: z.array(z.unknown()).min(1),
    }).passthrough(),
  }),
  z.object({ action: z.literal("export_manche") }),
  z.object({ action: z.literal("get_quiz_state") }),
  z.object({ action: z.literal("start_quiz") }),
  z.object({ action: z.literal("advance") }),
  z.object({ action: z.literal("tick") }),
  z.object({ action: z.literal("skip_phase") }),
  z.object({ action: z.literal("finish") }),
]);

function authorizeGeneratore(
  metadata: Record<string, unknown>,
  request: Request,
  pin: string | null,
): boolean {
  const generatoreKey = metadata.generatore_api_key;
  const headerKey = request.headers.get("X-Generatore-Key");

  if (typeof generatoreKey === "string" && generatoreKey.length > 0) {
    if (headerKey === generatoreKey) return true;
  }

  const pinRequired =
    typeof metadata.animator_pin === "string" &&
    metadata.animator_pin.trim().length > 0;

  if (pinRequired && verifyAnimatorPin(metadata, pin)) {
    return true;
  }

  const keyRequired =
    typeof generatoreKey === "string" && generatoreKey.length > 0;

  if (!keyRequired && !pinRequired) {
    return true;
  }

  return false;
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
    if (!authorizeGeneratore(metadata, request, pin)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const document = await exportMancheDocument(
      supabase,
      event.id,
      slug,
    );

    return NextResponse.json({ ok: true, document });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
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

  let body: z.infer<typeof commandSchema>;
  try {
    const parsed = commandSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid command body" },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
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

    if (!isPublicTick && !authorizeGeneratore(metadata, request, pin)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    switch (body.action) {
      case "import_manche": {
        const imported = await importMancheDocument(
          supabase,
          event.id,
          body.document as unknown as GeneratoreMancheDocument,
        );
        return NextResponse.json({
          ok: true,
          imported: {
            mancheCount: imported.manche.length,
            questionCount: imported.questionCount,
          },
        });
      }
      case "export_manche": {
        const document = await exportMancheDocument(
          supabase,
          event.id,
          slug,
        );
        return NextResponse.json({ ok: true, document });
      }
      case "get_quiz_state": {
        const quiz = getQuizSessionState(metadata);
        return NextResponse.json({
          ok: true,
          quiz,
          runtimeState: event.runtimeState,
        });
      }
      case "start_quiz": {
        const quiz = await startQuizSession(supabase, event.id);
        return NextResponse.json({
          ok: true,
          quiz,
          runtimeState: "quiz",
        });
      }
      case "advance": {
        const result = await advanceQuizQuestion(supabase, event.id);
        return NextResponse.json({ ok: true, ...result });
      }
      case "tick": {
        const result = await tickQuizPhase(supabase, event.id, false);
        return NextResponse.json({ ok: true, ...result });
      }
      case "skip_phase": {
        const result = await skipQuizPhase(supabase, event.id);
        return NextResponse.json({ ok: true, ...result });
      }
      case "finish": {
        const runtimeState = await finishQuizSession(supabase, event.id);
        return NextResponse.json({ ok: true, quiz: null, runtimeState });
      }
      default:
        return NextResponse.json(
          { ok: false, error: "Unknown action" },
          { status: 400 },
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Command failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
