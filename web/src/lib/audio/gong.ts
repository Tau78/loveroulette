import {
  duckSoundtrackBed,
  restoreSoundtrackBed,
} from "@/lib/audio/bed-duck";
import { audioUrl } from "@/lib/audio/phase-tracks";
import { STINGER_IDS } from "@/lib/audio/stingers";
import type { SoundtrackManifest } from "@/lib/audio/types";

/** Proiettore / PA: leggermente sotto il full per evitare picchi. */
export const QUIZ_GONG_VOLUME = 0.85;

const GONG_TRACK_ID = STINGER_IDS.quizQuestionGong;

let manifestCache: SoundtrackManifest | null = null;
let manifestLoadPromise: Promise<SoundtrackManifest | null> | null = null;
let preloadedUrl: string | null = null;
let preloadedAudio: HTMLAudioElement | null = null;
let preloadPromise: Promise<boolean> | null = null;

export interface PlayQuizGongOptions {
  volume?: number;
  onEnded?: () => void;
  /** Evita doppio trigger sulla stessa domanda/fase. */
  dedupKey?: string;
}

const playedKeys = new Set<string>();

function shouldSkipGongDedup(dedupKey: string | undefined): boolean {
  if (!dedupKey) return false;
  if (playedKeys.has(dedupKey)) return true;
  playedKeys.add(dedupKey);
  if (playedKeys.size > 32) {
    const first = playedKeys.values().next().value;
    if (first) playedKeys.delete(first);
  }
  return false;
}

async function loadManifest(): Promise<SoundtrackManifest | null> {
  if (manifestCache) return manifestCache;
  if (manifestLoadPromise) return manifestLoadPromise;

  manifestLoadPromise = (async () => {
    if (typeof window === "undefined") return null;

    try {
      const res = await fetch("/audio/manifest.json");
      if (!res.ok) return null;
      const manifest = (await res.json()) as SoundtrackManifest;
      manifestCache = manifest;
      return manifest;
    } catch {
      return null;
    } finally {
      manifestLoadPromise = null;
    }
  })();

  return manifestLoadPromise;
}

function resolveGongUrl(manifest: SoundtrackManifest): string | null {
  const track = manifest.tracks[GONG_TRACK_ID];
  if (!track) return null;

  const rel = track.files[track.primary] ?? track.files.A;
  return rel ? audioUrl(rel) : null;
}

/** Precarica il file manifest (no-op se mancante). */
export function preloadQuizGongSound(): void {
  void preloadQuizGong();
}

export async function preloadQuizGong(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (preloadedUrl) return true;
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    const manifest = await loadManifest();
    if (!manifest) return false;

    const url = resolveGongUrl(manifest);
    if (!url) return false;

    try {
      const probe = await fetch(url, { method: "HEAD" });
      if (!probe.ok) return false;
    } catch {
      return false;
    }

    const audio = new Audio(url);
    audio.preload = "auto";

    const ready = await new Promise<boolean>((resolve) => {
      const finish = (ok: boolean) => {
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("error", onError);
        resolve(ok);
      };
      const onReady = () => finish(true);
      const onError = () => finish(false);

      audio.addEventListener("canplaythrough", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.load();
    });

    if (!ready) return false;

    preloadedUrl = url;
    preloadedAudio = audio;
    return true;
  })().finally(() => {
    preloadPromise = null;
  });

  return preloadPromise;
}

export async function playQuizGongFromManifest(
  options: PlayQuizGongOptions = {},
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const { volume = QUIZ_GONG_VOLUME, onEnded } = options;

  let url = preloadedUrl;
  if (!url) {
    const manifest = await loadManifest();
    if (!manifest) return false;
    url = resolveGongUrl(manifest);
  }
  if (!url) return false;

  const audio =
    preloadedUrl === url && preloadedAudio
      ? preloadedAudio
      : new Audio(url);

  if (audio !== preloadedAudio) {
    audio.preload = "auto";
  }

  audio.volume = volume;
  audio.currentTime = 0;

  const onEnd = () => {
    audio.removeEventListener("ended", onEnd);
    onEnded?.();
  };
  audio.addEventListener("ended", onEnd);

  try {
    await audio.play();
    return true;
  } catch {
    audio.removeEventListener("ended", onEnd);
    return false;
  }
}

/** Gong sintetico WebAudio — solo se fetch/play del file manifest fallisce. */
export function playQuizGong(
  volume = QUIZ_GONG_VOLUME,
  onEnded?: () => void,
): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const now = ctx.currentTime;

    const partials = [
      { freq: 880, gain: 1 },
      { freq: 1320, gain: 0.45 },
      { freq: 1760, gain: 0.2 },
    ];

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(volume, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    master.connect(ctx.destination);

    for (const partial of partials) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(partial.freq, now);
      gain.gain.setValueAtTime(partial.gain, now);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 1);
    }

    window.setTimeout(() => {
      void ctx.close();
      onEnded?.();
    }, 1000);
  } catch {
    // ignore autoplay restrictions
  }
}

export async function playQuizGongSound(
  options: PlayQuizGongOptions = {},
): Promise<void> {
  if (shouldSkipGongDedup(options.dedupKey)) return;

  duckSoundtrackBed();

  const userOnEnded = options.onEnded;
  const onEnded = () => {
    restoreSoundtrackBed();
    userOnEnded?.();
  };

  const played = await playQuizGongFromManifest({ ...options, onEnded });
  if (!played) {
    playQuizGong(options.volume ?? QUIZ_GONG_VOLUME, onEnded);
  }
}
