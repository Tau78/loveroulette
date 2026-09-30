/**
 * Hit one-shot LR_25 dopo il gong sul bianco (STOP) + piccolo silenzio.
 * Dedup per cueKey (index + phaseStartedAt).
 */

import { CASA_QUIZ_RESULTS_REVEAL_SRC } from "@/lib/admin/casa-beds";
import { whenQuizGongCleared } from "@/lib/audio/quiz-gong-results-gate";
import { setMediaVolume } from "@/lib/audio/media-element-gain";

const DEFAULT_VOLUME = 0.88;

let lastCue: string | null = null;
let active: HTMLAudioElement | null = null;
let cancelWait: (() => void) | null = null;

export function playCasaResultsRevealHit(options?: {
  cueKey?: string;
  volume?: number;
}): void {
  const cue = options?.cueKey ?? "results";
  if (lastCue === cue) return;
  lastCue = cue;

  cancelWait?.();
  cancelWait = null;

  const start = () => {
    if (active) {
      active.pause();
      active = null;
    }

    const audio = new Audio(CASA_QUIZ_RESULTS_REVEAL_SRC);
    audio.loop = false;
    setMediaVolume(audio, options?.volume ?? DEFAULT_VOLUME);
    active = audio;

    const clear = () => {
      if (active === audio) active = null;
    };
    audio.addEventListener("ended", clear);
    audio.addEventListener("error", clear);

    void audio.play().catch(clear);
  };

  // Se il gong è ancora sul bianco → aspetta coda + gap, poi LR_25.
  cancelWait = whenQuizGongCleared(start);
}

export function resetCasaResultsRevealHit(): void {
  lastCue = null;
  cancelWait?.();
  cancelWait = null;
  if (active) {
    active.pause();
    active = null;
  }
}

/**
 * Segna la cue come già consumata senza suonare — join in ritardo su %
 * (Play dopo che la fase results è già attiva).
 */
export function consumeCasaResultsRevealCue(cueKey: string): void {
  lastCue = cueKey;
  cancelWait?.();
  cancelWait = null;
}
