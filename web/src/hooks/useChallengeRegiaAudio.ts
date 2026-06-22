"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SoundtrackManifest } from "@/lib/audio/types";
import {
  CHALLENGE_DANCE_BED_ID,
  CHALLENGE_ROMANTIC_BED_ID,
  DANCE_MIX_TRACK_IDS,
  DANCE_TRACK_OPTIONS,
  resolveManifestTrackUrl,
} from "@/lib/display/challenge-regia";
import { setChallengeRegiaBedActive } from "@/lib/admin/challenge-regia-bed";

export function useChallengeRegiaAudio(eventCode: string) {
  const [manifest, setManifest] = useState<SoundtrackManifest | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mixTimerRef = useRef<number | null>(null);
  const mixIndexRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/audio/manifest.json");
        if (!res.ok) return;
        const data = (await res.json()) as SoundtrackManifest;
        if (!cancelled) setManifest(data);
      } catch {
        // ignore
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  const stop = useCallback(() => {
    if (mixTimerRef.current !== null) {
      window.clearTimeout(mixTimerRef.current);
      mixTimerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    setChallengeRegiaBedActive(eventCode, false);
  }, [eventCode]);

  const playTrackId = useCallback(
    async (trackId: string, loop = false): Promise<boolean> => {
      if (!manifest) return false;

      const candidates = [
        trackId,
        CHALLENGE_DANCE_BED_ID,
        "LR_05_Extraction_Underscore",
        "LR_02_Quiz_Tension",
      ];

      for (const id of [...new Set(candidates)]) {
        const url = resolveManifestTrackUrl(manifest, id);
        if (!url) continue;

        const probe = await fetch(url, { method: "HEAD" }).catch(() => null);
        if (!probe?.ok) continue;

        const audio = ensureAudio();
        audio.src = url;
        audio.loop = loop;
        audio.volume = 0.78;

        try {
          await audio.play();
          setChallengeRegiaBedActive(eventCode, true);
          return true;
        } catch {
          continue;
        }
      }

      return false;
    },
    [ensureAudio, eventCode, manifest],
  );

  const playRomanticBed = useCallback(async () => {
    stop();
    return playTrackId(CHALLENGE_ROMANTIC_BED_ID, true);
  }, [playTrackId, stop]);

  const playDanceTrack = useCallback(
    async (manifestTrackId: string) => {
      stop();
      return playTrackId(manifestTrackId, true);
    },
    [playTrackId, stop],
  );

  const playDanceMix = useCallback(async () => {
    if (!manifest) return false;

    stop();
    mixIndexRef.current = 0;

    const playNextInMix = async () => {
      const ids = DANCE_MIX_TRACK_IDS;
      let played = false;

      for (let attempt = 0; attempt < ids.length; attempt++) {
        const idx = (mixIndexRef.current + attempt) % ids.length;
        const trackId = ids[idx]!;
        const ok = await playTrackId(trackId, false);
        if (ok) {
          mixIndexRef.current = (idx + 1) % ids.length;
          played = true;
          break;
        }
      }

      if (!played) return false;

      const audio = ensureAudio();
      const onEnded = () => {
        audio.removeEventListener("ended", onEnded);
        mixTimerRef.current = window.setTimeout(() => {
          void playNextInMix();
        }, 400);
      };
      audio.addEventListener("ended", onEnded);
      return true;
    };

    return playNextInMix();
  }, [ensureAudio, manifest, playTrackId, stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    manifestReady: Boolean(manifest),
    danceOptions: DANCE_TRACK_OPTIONS,
    playRomanticBed,
    playDanceTrack,
    playDanceMix,
    stop,
  };
}
