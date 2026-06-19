import type { EventState } from "@/lib/types";

/** Mappa fase runtime → track id nel manifest (M1 demo: lobby + quiz). */
export function trackIdForPhase(state: EventState): string | null {
  switch (state) {
    case "lobby":
      return "LR_01_Lobby_Ambient";
    case "quiz":
      return "LR_02_Quiz_Tension";
    case "closed":
      return null;
    default:
      // Fasi post-quiz: tieni tension finché non arrivano LR_05+.
      return "LR_02_Quiz_Tension";
  }
}

export function audioUrl(relativePath: string): string {
  return `/audio/${relativePath.replace(/^\/+/, "")}`;
}
