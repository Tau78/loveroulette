import { NextResponse } from "next/server";
import { z } from "zod";
import { updateLoveRouletteConfig } from "@/lib/musicpro/event-config";
import { getLoveRouletteEvent } from "@/lib/musicpro/resolve-event";
import { verifyAnimatorPin } from "@/lib/musicpro/session";
import { isValidEventSlug, normalizeEventSlug } from "@/lib/musicpro/slug";
import { TYPE_SCALE_MAX, TYPE_SCALE_MIN } from "@/lib/display/type-scale";

const bodySchema = z.object({
  badgeRequired: z.boolean().optional(),
  extractionCount: z.number().int().min(1).max(20).nullable().optional(),
  salvaSec: z.number().int().min(5).max(120).nullable().optional(),
  displayTypeScale: z.number().min(TYPE_SCALE_MIN).max(TYPE_SCALE_MAX).nullable().optional(),
  planciaTypeScale: z.number().min(TYPE_SCALE_MIN).max(TYPE_SCALE_MAX).nullable().optional(),
});

export async function PATCH(
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
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    body.badgeRequired === undefined &&
    body.extractionCount === undefined &&
    body.salvaSec === undefined &&
    body.displayTypeScale === undefined &&
    body.planciaTypeScale === undefined
  ) {
    return NextResponse.json({ error: "No config fields to update" }, { status: 400 });
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

    const pin = request.headers.get("X-Animator-Pin");
    if (
      !verifyAnimatorPin(
        (eventRow?.metadata ?? {}) as Record<string, unknown>,
        pin,
      )
    ) {
      return NextResponse.json({ error: "Invalid animator PIN" }, { status: 401 });
    }

    const config = await updateLoveRouletteConfig(supabase, event.id, {
      ...(body.badgeRequired !== undefined
        ? { badge_required: body.badgeRequired }
        : {}),
      ...(body.extractionCount !== undefined
        ? { extraction_count: body.extractionCount }
        : {}),
      ...(body.salvaSec !== undefined ? { salva_sec: body.salvaSec } : {}),
      ...(body.displayTypeScale !== undefined
        ? { display_type_scale: body.displayTypeScale }
        : {}),
      ...(body.planciaTypeScale !== undefined
        ? { plancia_type_scale: body.planciaTypeScale }
        : {}),
    });

    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Config update failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
