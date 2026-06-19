"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventState } from "@/lib/types";
import { registerSoundtrackBedDuck } from "@/lib/audio/bed-duck";
import { playQuizGongSound } from "@/lib/audio/gong";
import {
  formatMissingMp3Warning,
  probeMissingManifestFiles,
} from "@/lib/audio/manifest-files";
import { trackIdForPhase, audioUrl } from "@/lib/audio/phase-tracks";
import { STINGER_IDS } from "@/lib/audio/stingers";
import {
  BED_DUCK_VOLUME,
  CROSSFADE_MS,
  DEFAULT_VOLUME,
  STINGER_VOLUME,
  type SoundtrackManifest,
  type SoundtrackTrack,
} from "@/lib/audio/types";

function resolveTrackUrl(
  manifest: SoundtrackManifest,
  trackId: string,
): string | null {
  const track = manifest.tracks[trackId];
  if (!track) return null;
  const rel = track.files[track.primary];
  return rel ? audioUrl(rel) : null;
}

function fadeVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  durationMs: number,
  onDone?: () => void,
) {
  const start = performance.now();
  audio.volume = from;

  function step(now: number) {
    const t = Math.min(1, (now - start) / durationMs);
    audio.volume = from + (to - from) * t;
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  }

  requestAnimationFrame(step);
}

export interface UseLoveRouletteSoundtrackOptions {
  runtimeState: EventState;
  enabled?: boolean;
  /** Es. LR_07_Extraction_Reveal — riprodotto quando stingerToken incrementa. */
  stingerId?: string | null;
  stingerToken?: number;
  /** Proiettore: sblocco da dashboard (timestamp cue). */
  externalUnlockAt?: string | null;
  /** Avvia colonna sonora al mount (dashboard animatore). */
  autoUnlock?: boolean;
  /** Proiettore: nessuna UI, solo playback. */
  viewerMode?: boolean;
  /** Chiave stabile per dedup gong (es. currentIndex:phaseStartedAt). */
  stingerDedupKey?: string | null;
}

export interface UseLoveRouletteSoundtrackResult {
  unlocked: boolean;
  muted: boolean;
  currentTrackId: string | null;
  lastStingerId: string | null;
  loadError: string | null;
  missingFilesWarning: string | null;
  unlock: () => void;
  toggleMute: () => void;
}

export function useLoveRouletteSoundtrack({
  runtimeState,
  enabled = true,
  stingerId = null,
  stingerToken = 0,
  externalUnlockAt = null,
  autoUnlock = false,
  viewerMode = false,
  stingerDedupKey = null,
}: UseLoveRouletteSoundtrackOptions): UseLoveRouletteSoundtrackResult {
  const [manifest, setManifest] = useState<SoundtrackManifest | null>(null);
  const [unlocked, setUnlocked] = useState(autoUnlock || viewerMode);
  const [muted, setMuted] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [lastStingerId, setLastStingerId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [missingFilesWarning, setMissingFilesWarning] = useState<string | null>(
    null,
  );

  const activeRef = useRef<HTMLAudioElement | null>(null);
  const missingPathsRef = useRef<Set<string>>(new Set());
  const idleRef = useRef<HTMLAudioElement | null>(null);
  const stingerRef = useRef<HTMLAudioElement | null>(null);
  const playingUrlRef = useRef<string | null>(null);
  const fadeTokenRef = useRef(0);
  const bedVolumeRef = useRef(DEFAULT_VOLUME);

  useEffect(() => {
    let cancelled = false;

    async function loadManifest() {
      try {
        const res = await fetch("/audio/manifest.json");
        if (!res.ok) throw new Error("Manifest audio non trovato");
        const data = (await res.json()) as SoundtrackManifest;
        if (!cancelled) setManifest(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Errore manifest audio",
          );
        }
      }
    }

    void loadManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifest) return;

    const loadedManifest = manifest;
    let cancelled = false;

    async function probeFiles() {
      const missing = await probeMissingManifestFiles(loadedManifest);
      if (cancelled) return;

      missingPathsRef.current = new Set(missing);
      setMissingFilesWarning(formatMissingMp3Warning(missing));
    }

    void probeFiles();
    return () => {
      cancelled = true;
    };
  }, [manifest]);

  const ensureAudioPair = useCallback(() => {
    if (!activeRef.current) {
      activeRef.current = new Audio();
      activeRef.current.preload = "auto";
    }
    if (!idleRef.current) {
      idleRef.current = new Audio();
      idleRef.current.preload = "auto";
    }
    if (!stingerRef.current) {
      stingerRef.current = new Audio();
      stingerRef.current.preload = "auto";
    }
    return {
      active: activeRef.current,
      idle: idleRef.current,
      stinger: stingerRef.current,
    };
  }, []);

  const playTrack = useCallback(
    async (trackId: string | null, track: SoundtrackTrack | null, url: string | null) => {
      if (!enabled || !unlocked || muted) return;

      const { active, idle } = ensureAudioPair();

      if (!trackId || !url || !track) {
        if (active.src && !active.paused) {
          const token = ++fadeTokenRef.current;
          fadeVolume(active, active.volume, 0, CROSSFADE_MS, () => {
            if (fadeTokenRef.current !== token) return;
            active.pause();
            playingUrlRef.current = null;
            setCurrentTrackId(null);
          });
        }
        return;
      }

      if (playingUrlRef.current === url && !active.paused) {
        setCurrentTrackId(trackId);
        return;
      }

      const rel = track.files[track.primary];
      if (rel && missingPathsRef.current.has(rel)) {
        return;
      }

      const token = ++fadeTokenRef.current;
      idle.src = url;
      idle.loop = track.loop;
      idle.volume = 0;

      try {
        await idle.play();
      } catch {
        idle.pause();
        idle.removeAttribute("src");
        return;
      }

      bedVolumeRef.current = DEFAULT_VOLUME;
      fadeVolume(idle, 0, DEFAULT_VOLUME, CROSSFADE_MS);

      if (active.src && !active.paused) {
        fadeVolume(active, active.volume, 0, CROSSFADE_MS, () => {
          if (fadeTokenRef.current !== token) return;
          active.pause();
        });
      }

      const prevActive = active;
      activeRef.current = idle;
      idleRef.current = prevActive;
      playingUrlRef.current = url;
      setCurrentTrackId(trackId);
      setLoadError(null);
    },
    [enabled, ensureAudioPair, muted, unlocked],
  );

  const playStinger = useCallback(
    async (trackId: string, dedupKey?: string | null) => {
      if (!enabled || !unlocked || muted) return;

      if (trackId === STINGER_IDS.quizQuestionGong) {
        void playQuizGongSound({
          volume: STINGER_VOLUME,
          dedupKey: dedupKey ?? undefined,
        });
        setLastStingerId(trackId);
        return;
      }

      if (!manifest) return;

      const url = resolveTrackUrl(manifest, trackId);
      const track = manifest.tracks[trackId];
      if (!url || !track) return;

      const { active, stinger } = ensureAudioPair();

      stinger.src = url;
      stinger.loop = false;
      stinger.volume = STINGER_VOLUME;

      if (active.src && !active.paused) {
        fadeVolume(active, active.volume, BED_DUCK_VOLUME, 200);
      }

      try {
        await stinger.play();
        setLastStingerId(trackId);
      } catch {
        return;
      }

      const onEnd = () => {
        stinger.removeEventListener("ended", onEnd);
        if (active.src && !active.paused && !muted) {
          fadeVolume(active, active.volume, bedVolumeRef.current, 400);
        }
      };
      stinger.addEventListener("ended", onEnd);
    },
    [enabled, ensureAudioPair, manifest, muted, unlocked],
  );

  useEffect(() => {
    if (!manifest || !enabled || !unlocked) return;

    const trackId = trackIdForPhase(runtimeState);
    const track = trackId ? manifest.tracks[trackId] : null;
    const url = trackId ? resolveTrackUrl(manifest, trackId) : null;

    if (trackId && track && url) {
      void playTrack(trackId, track, url);
      return;
    }

    if (trackId && !track) {
      return;
    }

    void playTrack(null, null, null);
  }, [manifest, runtimeState, enabled, unlocked, playTrack]);

  useEffect(() => {
    if (!stingerId || stingerToken <= 0 || !unlocked) return;
    void playStinger(stingerId, stingerDedupKey);
  }, [stingerId, stingerToken, stingerDedupKey, unlocked, playStinger]);

  useEffect(() => {
    const { active } = ensureAudioPair();
    if (muted) {
      active.volume = 0;
    } else if (unlocked && playingUrlRef.current) {
      active.volume = bedVolumeRef.current;
    }
  }, [muted, unlocked, ensureAudioPair]);

  useEffect(() => {
    if (!enabled || !unlocked || muted) {
      registerSoundtrackBedDuck(null);
      return;
    }

    registerSoundtrackBedDuck({
      duck: () => {
        const { active } = ensureAudioPair();
        if (active.src && !active.paused) {
          fadeVolume(active, active.volume, BED_DUCK_VOLUME, 200);
        }
      },
      restore: () => {
        const { active } = ensureAudioPair();
        if (active.src && !active.paused && !muted) {
          fadeVolume(active, active.volume, bedVolumeRef.current, 400);
        }
      },
    });

    return () => registerSoundtrackBedDuck(null);
  }, [enabled, unlocked, muted, ensureAudioPair]);

  useEffect(() => {
    return () => {
      activeRef.current?.pause();
      idleRef.current?.pause();
      stingerRef.current?.pause();
    };
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    setLoadError(null);
  }, []);

  const lastExternalUnlock = useRef<string | null>(null);

  useEffect(() => {
    if (autoUnlock || viewerMode) {
      unlock();
    }
  }, [autoUnlock, viewerMode, unlock]);

  useEffect(() => {
    if (!externalUnlockAt || externalUnlockAt === lastExternalUnlock.current) {
      return;
    }
    lastExternalUnlock.current = externalUnlockAt;
    unlock();
  }, [externalUnlockAt, unlock]);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  return {
    unlocked,
    muted,
    currentTrackId,
    lastStingerId,
    loadError,
    missingFilesWarning,
    unlock,
    toggleMute,
  };
}
