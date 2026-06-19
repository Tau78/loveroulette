import type { SupabaseClient } from "@supabase/supabase-js";

export interface DisplayAudioCue {
  enabled: boolean;
  updatedAt: string;
}

export function getDisplayAudioCue(
  metadata: Record<string, unknown> | null | undefined,
): DisplayAudioCue | null {
  const raw = metadata?.love_roulette_audio;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const updatedAt = record.updatedAt;
  if (typeof updatedAt !== "string" || !updatedAt.trim()) {
    return null;
  }

  return {
    enabled: record.enabled !== false,
    updatedAt: updatedAt.trim(),
  };
}

export async function setDisplayAudioCue(
  supabase: SupabaseClient,
  eventId: string,
): Promise<DisplayAudioCue> {
  const cue: DisplayAudioCue = {
    enabled: true,
    updatedAt: new Date().toISOString(),
  };

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
        love_roulette_audio: cue,
      },
    })
    .eq("id", eventId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return cue;
}
