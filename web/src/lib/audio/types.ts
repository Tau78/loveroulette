import type { EventState } from "@/lib/types";

export interface SoundtrackTrackFiles {
  A: string;
  B: string;
}

export interface SoundtrackTrack {
  phase: EventState | EventState[];
  loop: boolean;
  primary: "A" | "B";
  alternate: "A" | "B";
  files: SoundtrackTrackFiles;
}

export interface SoundtrackManifest {
  theme: string;
  tracks: Record<string, SoundtrackTrack>;
}

export const CROSSFADE_MS = 2000;
export const DEFAULT_VOLUME = 0.72;
export const STINGER_VOLUME = 0.88;
export const BED_DUCK_VOLUME = 0.32;
