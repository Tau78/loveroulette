import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildQuestionReportMailto,
  sendQuestionReportEmail,
  type QuestionReportPayload,
} from "@/lib/admin/question-report";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  questionId: z.string().min(1).optional(),
  category: z.string(),
  body: z.string().min(1),
  options: z.array(z.string()).min(1).max(8),
  cueIndex: z.number().int().min(0).max(199).optional(),
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

    if (pinRequired && !verifyAnimatorPin(metadata, pin)) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    const payload: QuestionReportPayload = {
      eventCode: slug,
      venueName: event.venueName ?? event.title,
      questionId: body.questionId ?? null,
      category: body.category,
      body: body.body,
      options: body.options,
      cueIndex: body.cueIndex ?? null,
    };

    const mail = await sendQuestionReportEmail(payload);
    const mailto = buildQuestionReportMailto(payload);

    if (mail.sent) {
      return NextResponse.json({
        ok: true,
        sent: true,
        via: mail.via,
        mailto,
      });
    }

    // Nessuna key Resend (o errore): il client apre mailto.
    return NextResponse.json({
      ok: true,
      sent: false,
      via: "mailto",
      mailto,
      error: mail.error,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Segnalazione non riuscita";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
