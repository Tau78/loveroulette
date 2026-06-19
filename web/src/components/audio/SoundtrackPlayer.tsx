"use client";

import type { EventState } from "@/lib/types";
import { useLoveRouletteSoundtrack } from "@/hooks/useLoveRouletteSoundtrack";

interface SoundtrackPlayerProps {
  runtimeState: EventState;
  stingerId?: string | null;
  stingerToken?: number;
  stingerDedupKey?: string | null;
  externalUnlockAt?: string | null;
  /** Proiettore: nessun popup o pulsante — solo audio. */
  viewerMode?: boolean;
  /** Anteprima embed (?embed=1): nessun playback. */
  embedMode?: boolean;
}

/** Player audio invisibile (proiettore) o con controlli (dashboard futura). */
export function SoundtrackPlayer({
  runtimeState,
  stingerId = null,
  stingerToken = 0,
  stingerDedupKey = null,
  externalUnlockAt = null,
  viewerMode = false,
  embedMode = false,
}: SoundtrackPlayerProps) {
  useLoveRouletteSoundtrack({
    runtimeState,
    enabled: !embedMode,
    stingerId,
    stingerToken,
    stingerDedupKey,
    externalUnlockAt,
    viewerMode,
  });

  return null;
}
