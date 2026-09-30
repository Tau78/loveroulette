"use client";

import type { EventState } from "@/lib/types";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import type { SpecialTrialStatus } from "@/lib/musicpro/special-trial";
import { useLoveRouletteSoundtrack } from "@/hooks/useLoveRouletteSoundtrack";

interface SoundtrackPlayerProps {
  runtimeState: EventState;
  quizDisplayPhase?: QuizDisplayPhase | null;
  quizThemeCategory?: string | null;
  specialTrialStatus?: SpecialTrialStatus | null;
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
  quizDisplayPhase = null,
  quizThemeCategory = null,
  specialTrialStatus = null,
  stingerId = null,
  stingerToken = 0,
  stingerDedupKey = null,
  externalUnlockAt = null,
  viewerMode = false,
  embedMode = false,
}: SoundtrackPlayerProps) {
  useLoveRouletteSoundtrack({
    runtimeState,
    quizDisplayPhase,
    quizThemeCategory,
    specialTrialStatus,
    enabled: !embedMode,
    stingerId,
    stingerToken,
    stingerDedupKey,
    externalUnlockAt,
    viewerMode,
  });

  return null;
}
