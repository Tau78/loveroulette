/**
 * Hit one-shot LR_25 all’ingresso della fase results (%).
 * Dedup per cueKey (index + phaseStartedAt) così non riparte a ogni render.
 */

import { CASA_QUIZ_RESULTS_REVEAL_SRC } from "@/lib/admin/casa-beds";

const DEFAULT_VOLUME = 0.88;

let lastCue: string | null = null;
let active: HTMLAudioElement | null = null;

export function playCasaResultsRevealHit(options?: {
  cueKey?: string;
  volume?: number;
}): void {
  const cue = options?.cueKey ?? "results";
  if (lastCue === cue) return;
  lastCue = cue;

  if (active) {
    active.pause();
    active = null;
  }

  const audio = new Audio(CASA_QUIZ_RESULTS_REVEAL_SRC);
  audio.loop = false;
  audio.volume = options?.volume ?? DEFAULT_VOLUME;
  active = audio;

  const clear = () => {
    if (active === audio) active = null;
  };
  audio.addEventListener("ended", clear);
  audio.addEventListener("error", clear);

  void audio.play().catch(clear);
}

export function resetCasaResultsRevealHit(): void {
  lastCue = null;
  if (active) {
    active.pause();
    active = null;
  }
}
