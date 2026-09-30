/**
 * Countdown pre-domande (stacco 5–4–3–2–1 / start_countdown).
 * Un file drumroll ~6 s allineato alle 5 cifre — niente whoosh sintetico.
 */

import { audioUrl } from "@/lib/audio/phase-tracks";
import { setMediaVolume } from "@/lib/audio/media-element-gain";

/** Path ufficiale bundled (anche su Vercel / TestFlight). */
export const COUNTDOWN_AUDIO_SRC = "/grafiche/audio/countdown.mp3";

/** Alias sotto /audio (stinger manifest-style). */
export const COUNTDOWN_AUDIO_FALLBACK_SRC = audioUrl(
  "dark_fuchsia/stingers/LR_Launch_Countdown_A.mp3",
);

export const COUNTDOWN_VOLUME = 0.78;

let active: HTMLAudioElement | null = null;
let playedKey: string | null = null;

export function playCountdownAudio(options?: {
  /** Dedup per una sequenza (es. `stacco:5` o `launch:5`). */
  cueKey?: string;
  volume?: number;
}): void {
  const cue = options?.cueKey ?? "countdown";
  if (playedKey === cue) return;
  playedKey = cue;

  if (active) {
    active.pause();
    active = null;
  }

  const audio = new Audio(COUNTDOWN_AUDIO_SRC);
  audio.preload = "auto";
  audio.loop = false;
  setMediaVolume(audio, options?.volume ?? COUNTDOWN_VOLUME);
  active = audio;

  const clear = () => {
    if (active === audio) active = null;
  };
  audio.addEventListener("ended", clear);
  audio.addEventListener("error", () => {
    // Fallback path se grafiche/ non è in cache (edge rare).
    if (audio.src.includes(COUNTDOWN_AUDIO_SRC)) {
      audio.src = COUNTDOWN_AUDIO_FALLBACK_SRC;
      void audio.play().catch(clear);
      return;
    }
    clear();
  });

  void audio.play().catch(clear);
}

export function stopCountdownAudio(): void {
  playedKey = null;
  if (!active) return;
  active.pause();
  active = null;
}

/** @deprecated usa playCountdownAudio. */
export function playCountdownWhoosh(volume = COUNTDOWN_VOLUME): void {
  playCountdownAudio({ volume });
}
