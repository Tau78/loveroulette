import { NextResponse } from "next/server";
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

    return NextResponse.json(event);
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
