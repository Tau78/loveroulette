import type { SupabaseClient } from "@supabase/supabase-js";

export type DisplayOverlayType = "show_qr" | "custom" | "clear";

export interface DisplayOverlay {
  type: DisplayOverlayType;
  title?: string;
  body?: string;
  updatedAt: string;
}

const OVERLAY_TYPES = new Set<DisplayOverlayType>(["show_qr", "custom", "clear"]);

export function getDisplayOverlay(
  metadata: Record<string, unknown> | null | undefined,
): DisplayOverlay | null {
  const raw = metadata?.love_roulette_display;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const type = record.type;
  if (typeof type !== "string" || !OVERLAY_TYPES.has(type as DisplayOverlayType)) {
    return null;
  }

  const updatedAt = record.updatedAt;
  if (typeof updatedAt !== "string" || !updatedAt.trim()) {
    return null;
  }

  const overlay: DisplayOverlay = {
    type: type as DisplayOverlayType,
    updatedAt: updatedAt.trim(),
  };

  if (typeof record.title === "string" && record.title.trim()) {
    overlay.title = record.title.trim();
  }
  if (typeof record.body === "string" && record.body.trim()) {
    overlay.body = record.body.trim();
  }

  return overlay;
}

export function buildJoinUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/s/${slug}/play`;
}

export async function setDisplayOverlay(
  supabase: SupabaseClient,
  eventId: string,
  overlay: Omit<DisplayOverlay, "updatedAt"> & { updatedAt?: string },
): Promise<DisplayOverlay> {
  const stored: DisplayOverlay = {
    type: overlay.type,
    updatedAt: overlay.updatedAt ?? new Date().toISOString(),
  };

  if (overlay.title !== undefined) {
    stored.title = overlay.title;
  }
  if (overlay.body !== undefined) {
    stored.body = overlay.body;
  }

  const { data: row, error: fetchError } = await supabase
    .from("events")
    .select("metadata")
    .eq("id", eventId)
    .maybeSingle();

  if (fetchError || !row) {
    throw new Error(fetchError?.message ?? "Event not found");
  }

  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  const { error: updateError } = await supabase
    .from("events")
    .update({
      metadata: {
        ...metadata,
        love_roulette_display: stored,
      },
    })
    .eq("id", eventId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return stored;
}
