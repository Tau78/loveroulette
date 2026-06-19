import {
  duckSoundtrackBed,
  restoreSoundtrackBed,
} from "@/lib/audio/bed-duck";
import { audioUrl } from "@/lib/audio/phase-tracks";
import { STINGER_IDS } from "@/lib/audio/stingers";
import type { SoundtrackManifest } from "@/lib/audio/types";

/** Proiettore / PA: leggermente sotto il full per evitare picchi. */
export const QUIZ_GONG_VOLUME = 0.9;

/** Pitch del gong in semitoni (negativo = più grave). */
export const QUIZ_GONG_PITCH_SEMITONES = -24;

const GONG_TRACK_ID = STINGER_IDS.quizQuestionGong;

let manifestCache: SoundtrackManifest | null = null;
let manifestLoadPromise: Promise<SoundtrackManifest | null> | null = null;
let preloadedAudio: HTMLAudioElement | null = null;
let preloadPromise: Promise<boolean> | null = null;

export interface PlayQuizGongOptions {
  volume?: number;
  /** Pitch shift in semitoni (default -24). */
  pitchSemitones?: number;
  onEnded?: () => void;
  /** Evita doppio trigger (Strict Mode / sorgenti multiple) entro 2s. */
  dedupKey?: string;
}

const GONG_DEDUP_MS = 2000;
let lastPlayedKey: string | null = null;
let lastPlayedAt = 0;

function shouldSkipGongDedup(dedupKey: string | undefined): boolean {
  const key = dedupKey ?? "__default__";
  const now = Date.now();
  if (key === lastPlayedKey && now - lastPlayedAt < GONG_DEDUP_MS) {
    return true;
  }
  lastPlayedKey = key;
  lastPlayedAt = now;
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
  if (preloadedAudio) return true;
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

  const {
    volume = QUIZ_GONG_VOLUME,
    pitchSemitones = QUIZ_GONG_PITCH_SEMITONES,
    onEnded,
  } = options;

  const manifest = await loadManifest();
  if (!manifest) return false;

  const url = resolveGongUrl(manifest);
  if (!url) return false;

  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return false;

    const ctx = new AudioContextCtor();
    const res = await fetch(url);
    if (!res.ok) {
      await ctx.close();
      return false;
    }

    const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.detune.value = pitchSemitones * 100;

    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);

    source.onended = () => {
      void ctx.close();
      onEnded?.();
    };

    source.start();
    return true;
  } catch {
    return false;
  }
}

/** Gong sintetico WebAudio — solo se fetch/play del file manifest fallisce. */
export function playQuizGong(
  volume = QUIZ_GONG_VOLUME,
  onEnded?: () => void,
  pitchSemitones = QUIZ_GONG_PITCH_SEMITONES,
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
    const pitchRatio = Math.pow(2, pitchSemitones / 12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(520 * pitchRatio, now);
    osc.frequency.exponentialRampToValueAtTime(180 * pitchRatio, now + 1.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);

    osc.onended = () => {
      void ctx.close();
      onEnded?.();
    };
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
    playQuizGong(
      options.volume ?? QUIZ_GONG_VOLUME,
      onEnded,
      options.pitchSemitones ?? QUIZ_GONG_PITCH_SEMITONES,
    );
  }
}
