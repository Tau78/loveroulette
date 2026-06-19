import { NextResponse } from "next/server";
import { z } from "zod";
import { setDisplayOverlay } from "@/lib/musicpro/display-overlay";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";

const bodySchema = z
  .object({
    type: z.enum(["show_qr", "custom", "clear"]),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().max(280).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "custom" && !value.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "title is required when type is custom",
        path: ["title"],
      });
    }
  });

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

    return NextResponse.json({
      displayOverlay: event.displayOverlay,
      eventSlug: event.slug,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Database not configured",
        hint: "Set SUPABASE env vars for MusicPro project fvxdghqpavdcohczrvsc",
      },
      { status: 503 },
    );
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

    const { data: row, error: metaError } = await supabase
      .from("events")
      .select("metadata")
      .eq("id", event.id)
      .maybeSingle();

    if (metaError || !row) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const pin = request.headers.get("X-Animator-Pin");
    if (!verifyAnimatorPin(metadata, pin)) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    const displayOverlay = await setDisplayOverlay(supabase, event.id, {
      type: body.type,
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.body !== undefined ? { body: body.body } : {}),
    });

    return NextResponse.json({ displayOverlay, eventSlug: event.slug });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Update display overlay failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
