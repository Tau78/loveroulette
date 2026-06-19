import { mergeEventConfig } from "@/lib/events";
import type { EventConfig } from "@/lib/types";

/** LR config stored in events.metadata.love_roulette (MusicPro convention). */
export function parseLoveRouletteConfig(
  metadata: Record<string, unknown> | null | undefined,
): EventConfig {
  const raw = metadata?.love_roulette;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return mergeEventConfig(raw as Partial<EventConfig>);
  }
  return mergeEventConfig(undefined);
}

export function getLoveRouletteJoinCode(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const code = metadata?.love_roulette_code;
  if (typeof code === "string" && code.trim()) {
    return code.trim().toUpperCase();
  }
  return null;
}

export function getLoveRouletteTitle(
  metadata: Record<string, unknown> | null | undefined,
  venueName: string | null,
  eventDate: string,
): string {
  const custom = metadata?.love_roulette_title;
  if (typeof custom === "string" && custom.trim()) {
    return custom.trim();
  }
  if (venueName) {
    return `Love Roulette @ ${venueName}`;
  }
  return `Love Roulette — ${eventDate}`;
}
