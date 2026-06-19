import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z.object({
  pin: z.string().trim().min(1).max(32),
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
      return NextResponse.json({ error: "PIN mancante" }, { status: 400 });
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

    const { data: eventRow } = await supabase
      .from("events")
      .select("metadata")
      .eq("id", event.id)
      .maybeSingle();

    const metadata = (eventRow?.metadata ?? {}) as Record<string, unknown>;
    const configured = metadata.animator_pin;

    if (
      configured === undefined ||
      configured === null ||
      String(configured).trim() === ""
    ) {
      return NextResponse.json({ ok: true, required: false });
    }

    if (!verifyAnimatorPin(metadata, body.pin)) {
      return NextResponse.json(
        { error: "PIN non valido. Riprova." },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true, required: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verify PIN failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
