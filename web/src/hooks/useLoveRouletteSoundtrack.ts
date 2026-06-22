"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventState } from "@/lib/types";
import type { QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
import { registerSoundtrackBedDuck } from "@/lib/audio/bed-duck";
import { playQuizGongSound } from "@/lib/audio/gong";
import {
  formatMissingMp3Warning,
  probeMissingManifestFiles,
} from "@/lib/audio/manifest-files";
import { QUIZ_RESULTS_BED_ID } from "@/lib/audio/quiz-theme-tracks";
import { trackIdForPhase, audioUrl } from "@/lib/audio/phase-tracks";
import {
  EXTRACTION_BED_ID,
  STINGER_IDS,
  VOTING_SUSPENSE_ID,
} from "@/lib/audio/stingers";
import type { FinalsShowPhase } from "@/lib/musicpro/finals-show";
import { EXTRACTION_SPIN_DURATION_MS } from "@/lib/game/extraction-timing";
import { WINNER_ANTHEM_CROSSFADE_MS } from "@/lib/game/winner-timing";
import { subscribeChallengeRegiaBed } from "@/lib/admin/challenge-regia-bed";
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
  /** Sotto-fase quiz sincronizzata (es. results → bed reveal %). */
  quizDisplayPhase?: QuizDisplayPhase | null;
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
  /** Fase spettacolo finali — blocca bed winner fino a LR_16 → LR_15. */
  finalsShowPhase?: FinalsShowPhase | null;
  /** Categoria domanda corrente (manche/tema slide) → mood sottofondo quiz. */
  quizThemeCategory?: string | null;
  /** Codice evento — per duck del bed quando parte la regia prova. */
  eventCode?: string | null;
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
  /** Duck LR_05 → LR_06 drumroll → LR_07 reveal (sync spin proiettore). */
  playExtractionSequence: (cueKey: string) => void;
  /** LR_16 hit → crossfade 2 s → LR_15 loop. */
  playWinnerSequence: (cueKey: string) => void;
  /** LR_13 countdown → LR_14 loop (brief: open voting). */
  playVotingSequence: (
    cueKey: string,
    options?: { resumeOnly?: boolean },
  ) => void;
}

export function useLoveRouletteSoundtrack({
  runtimeState,
  quizDisplayPhase = null,
  enabled = true,
  stingerId = null,
  stingerToken = 0,
  externalUnlockAt = null,
  autoUnlock = false,
  viewerMode = false,
  stingerDedupKey = null,
  finalsShowPhase = null,
  quizThemeCategory = null,
  eventCode = null,
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
  const overlayStingerRef = useRef<HTMLAudioElement | null>(null);
  const playingUrlRef = useRef<string | null>(null);
  const fadeTokenRef = useRef(0);
  const bedVolumeRef = useRef(DEFAULT_VOLUME);
  const extractionTimersRef = useRef<number[]>([]);
  const extractionCueRef = useRef<string | null>(null);
  const extractionSequenceActiveRef = useRef(false);
  const winnerTimersRef = useRef<number[]>([]);
  const winnerCueRef = useRef<string | null>(null);
  const winnerAnthemStartedRef = useRef(false);
  const votingTimersRef = useRef<number[]>([]);
  const votingCueRef = useRef<string | null>(null);
  const votingSuspenseStartedRef = useRef(false);
  const challengeRegiaBedActiveRef = useRef(false);
  const [challengeRegiaBedEpoch, setChallengeRegiaBedEpoch] = useState(0);

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
    if (!overlayStingerRef.current) {
      overlayStingerRef.current = new Audio();
      overlayStingerRef.current.preload = "auto";
    }
    return {
      active: activeRef.current,
      idle: idleRef.current,
      stinger: stingerRef.current,
      overlayStinger: overlayStingerRef.current,
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

      if (playingUrlRef.current === url) {
        if (!active.paused) {
          setCurrentTrackId(trackId);
          return;
        }
        if (
          extractionSequenceActiveRef.current &&
          trackId === EXTRACTION_BED_ID
        ) {
          return;
        }
      }

      if (
        extractionSequenceActiveRef.current &&
        trackId === EXTRACTION_BED_ID
      ) {
        return;
      }

      const rel = track.files[track.primary];
      if (rel && missingPathsRef.current.has(rel)) {
        return;
      }

      const token = ++fadeTokenRef.current;
      const instantIn = trackId === QUIZ_RESULTS_BED_ID;
      idle.src = url;
      idle.loop = track.loop;
      idle.volume = instantIn ? DEFAULT_VOLUME : 0;

      try {
        await idle.play();
      } catch {
        idle.pause();
        idle.removeAttribute("src");
        return;
      }

      bedVolumeRef.current = DEFAULT_VOLUME;

      if (instantIn) {
        if (active.src && !active.paused) {
          active.pause();
        }
      } else {
        fadeVolume(idle, 0, DEFAULT_VOLUME, CROSSFADE_MS);

        if (active.src && !active.paused) {
          fadeVolume(active, active.volume, 0, CROSSFADE_MS, () => {
            if (fadeTokenRef.current !== token) return;
            active.pause();
          });
        }
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

  const clearExtractionTimers = useCallback(() => {
    for (const id of extractionTimersRef.current) {
      window.clearTimeout(id);
    }
    extractionTimersRef.current = [];
  }, []);

  const pauseExtractionBed = useCallback(() => {
    const { active } = ensureAudioPair();
    if (active.src && !active.paused) {
      active.pause();
    }
  }, [ensureAudioPair]);

  const restoreExtractionBed = useCallback(() => {
    extractionSequenceActiveRef.current = false;
    if (!enabled || !unlocked || muted) return;

    const { active } = ensureAudioPair();
    if (!active.src) return;

    active.volume = bedVolumeRef.current;
    if (active.paused) {
      void active.play().catch(() => {});
    }
  }, [enabled, ensureAudioPair, muted, unlocked]);

  const playManifestOneShot = useCallback(
    async (audio: HTMLAudioElement, trackId: string): Promise<boolean> => {
      if (!manifest) return false;

      const url = resolveTrackUrl(manifest, trackId);
      const track = manifest.tracks[trackId];
      if (!url || !track) return false;

      const rel = track.files[track.primary];
      if (rel && missingPathsRef.current.has(rel)) return false;

      audio.src = url;
      audio.loop = false;
      audio.currentTime = 0;
      audio.volume = STINGER_VOLUME;

      try {
        await audio.play();
        return true;
      } catch {
        return false;
      }
    },
    [manifest],
  );

  const clearWinnerTimers = useCallback(() => {
    for (const id of winnerTimersRef.current) {
      window.clearTimeout(id);
    }
    winnerTimersRef.current = [];
  }, []);

  const clearVotingTimers = useCallback(() => {
    for (const id of votingTimersRef.current) {
      window.clearTimeout(id);
    }
    votingTimersRef.current = [];
  }, []);

  const startWinnerAnthem = useCallback(() => {
    if (!manifest) return;

    const trackId = "LR_15_Winner_Anthem";
    const track = manifest.tracks[trackId];
    const url = resolveTrackUrl(manifest, trackId);
    if (!track || !url) return;

    winnerAnthemStartedRef.current = true;
    void playTrack(trackId, track, url);
  }, [manifest, playTrack]);

  const startVotingSuspense = useCallback(() => {
    if (!manifest) return;

    const trackId = VOTING_SUSPENSE_ID;
    const track = manifest.tracks[trackId];
    const url = resolveTrackUrl(manifest, trackId);
    if (!track || !url) return;

    votingSuspenseStartedRef.current = true;
    void playTrack(trackId, track, url);
  }, [manifest, playTrack]);

  const playVotingSequence = useCallback(
    (cueKey: string, options?: { resumeOnly?: boolean }) => {
      if (!enabled || !unlocked || muted || !manifest) return;
      if (votingCueRef.current === cueKey) return;

      votingCueRef.current = cueKey;
      clearVotingTimers();
      votingSuspenseStartedRef.current = false;

      if (options?.resumeOnly) {
        startVotingSuspense();
        return;
      }

      const { active, stinger } = ensureAudioPair();

      if (active.src && !active.paused) {
        fadeVolume(active, active.volume, BED_DUCK_VOLUME, 200);
      }

      void playManifestOneShot(stinger, STINGER_IDS.votingCountdown).then(
        (played) => {
          if (played) {
            setLastStingerId(STINGER_IDS.votingCountdown);
          }

          const onCountdownEnd = () => {
            stinger.removeEventListener("ended", onCountdownEnd);
            startVotingSuspense();
          };

          if (played) {
            stinger.addEventListener("ended", onCountdownEnd);
            return;
          }

          startVotingSuspense();
        },
      );
    },
    [
      clearVotingTimers,
      enabled,
      ensureAudioPair,
      manifest,
      muted,
      playManifestOneShot,
      startVotingSuspense,
      unlocked,
    ],
  );

  const playWinnerSequence = useCallback(
    (cueKey: string) => {
      if (!enabled || !unlocked || muted || !manifest) return;
      if (winnerCueRef.current === cueKey) return;

      winnerCueRef.current = cueKey;
      clearWinnerTimers();
      winnerAnthemStartedRef.current = false;

      const { active, stinger } = ensureAudioPair();

      if (active.src && !active.paused) {
        fadeVolume(active, active.volume, 0, 300, () => {
          active.pause();
        });
      }

      void playManifestOneShot(stinger, STINGER_IDS.winnerStinger).then(
        (played) => {
          if (played) {
            setLastStingerId(STINGER_IDS.winnerStinger);
          }
        },
      );

      const anthemTimer = window.setTimeout(() => {
        startWinnerAnthem();
      }, WINNER_ANTHEM_CROSSFADE_MS);

      winnerTimersRef.current.push(anthemTimer);
    },
    [
      clearWinnerTimers,
      enabled,
      ensureAudioPair,
      manifest,
      muted,
      playManifestOneShot,
      startWinnerAnthem,
      unlocked,
    ],
  );

  const playExtractionSequence = useCallback(
    (cueKey: string) => {
      if (!enabled || !unlocked || muted || !manifest) return;
      if (extractionCueRef.current === cueKey) return;

      extractionCueRef.current = cueKey;
      clearExtractionTimers();
      extractionSequenceActiveRef.current = true;

      const { stinger, overlayStinger } = ensureAudioPair();

      stinger.pause();
      stinger.currentTime = 0;
      overlayStinger.pause();
      overlayStinger.currentTime = 0;
      pauseExtractionBed();

      void playManifestOneShot(stinger, STINGER_IDS.extractionDrumroll).then(
        (played) => {
          if (played) {
            setLastStingerId(STINGER_IDS.extractionDrumroll);
          }
        },
      );

      const revealTimer = window.setTimeout(() => {
        stinger.pause();
        stinger.currentTime = 0;

        void playManifestOneShot(
          overlayStinger,
          STINGER_IDS.extractionReveal,
        ).then((played) => {
          if (!played) {
            restoreExtractionBed();
            return;
          }

          setLastStingerId(STINGER_IDS.extractionReveal);

          const onRevealEnd = () => {
            overlayStinger.removeEventListener("ended", onRevealEnd);
            restoreExtractionBed();
          };
          overlayStinger.addEventListener("ended", onRevealEnd);
        });
      }, EXTRACTION_SPIN_DURATION_MS);

      extractionTimersRef.current.push(revealTimer);
    },
    [
      clearExtractionTimers,
      enabled,
      ensureAudioPair,
      manifest,
      muted,
      pauseExtractionBed,
      playManifestOneShot,
      restoreExtractionBed,
      unlocked,
    ],
  );

  useEffect(() => {
    if (runtimeState !== "extraction") {
      extractionCueRef.current = null;
      extractionSequenceActiveRef.current = false;
    }
  }, [runtimeState]);

  useEffect(() => {
    if (runtimeState !== "winner") {
      winnerAnthemStartedRef.current = false;
      winnerCueRef.current = null;
    }
  }, [runtimeState]);

  useEffect(() => {
    if (
      finalsShowPhase !== "voting" &&
      finalsShowPhase !== "voting_prep"
    ) {
      votingSuspenseStartedRef.current = false;
      votingCueRef.current = null;
    }
  }, [finalsShowPhase]);

  useEffect(() => {
    if (!eventCode) return;
    return subscribeChallengeRegiaBed(eventCode, (active) => {
      challengeRegiaBedActiveRef.current = active;
      setChallengeRegiaBedEpoch((epoch) => epoch + 1);
      if (active) {
        void playTrack(null, null, null);
      }
    });
  }, [eventCode, playTrack]);

  useEffect(() => {
    if (!manifest || !enabled || !unlocked) return;

    if (challengeRegiaBedActiveRef.current) {
      void playTrack(null, null, null);
      return;
    }

    if (runtimeState === "extraction" && extractionSequenceActiveRef.current) {
      return;
    }

    const trackId = trackIdForPhase(
      runtimeState,
      quizDisplayPhase,
      finalsShowPhase,
      quizThemeCategory,
    );

    if (
      runtimeState === "winner" &&
      finalsShowPhase === "winner_spectacle" &&
      !winnerAnthemStartedRef.current
    ) {
      return;
    }

    if (
      runtimeState === "finals" &&
      (finalsShowPhase === "voting" || finalsShowPhase === "voting_prep") &&
      !votingSuspenseStartedRef.current
    ) {
      return;
    }

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
  }, [
    manifest,
    runtimeState,
    quizDisplayPhase,
    finalsShowPhase,
    quizThemeCategory,
    enabled,
    unlocked,
    playTrack,
    challengeRegiaBedEpoch,
  ]);

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
      clearExtractionTimers();
      clearWinnerTimers();
      clearVotingTimers();
      activeRef.current?.pause();
      idleRef.current?.pause();
      stingerRef.current?.pause();
      overlayStingerRef.current?.pause();
    };
  }, [clearExtractionTimers, clearWinnerTimers, clearVotingTimers]);

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
    playExtractionSequence,
    playWinnerSequence,
    playVotingSequence,
  };
}
