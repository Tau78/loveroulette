import { playQuizGongSound } from "@/lib/audio/gong";
import { audioUrl } from "@/lib/audio/phase-tracks";
import { STINGER_IDS } from "@/lib/audio/stingers";
import { STINGER_VOLUME, type SoundtrackManifest } from "@/lib/audio/types";

let manifestCache: SoundtrackManifest | null = null;
let oneshot: HTMLAudioElement | null = null;

async function loadManifest(): Promise<SoundtrackManifest | null> {
  if (manifestCache) return manifestCache;
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/audio/manifest.json");
    if (!res.ok) return null;
    manifestCache = (await res.json()) as SoundtrackManifest;
    return manifestCache;
  } catch {
    return null;
  }
}

/** One-shot dagli stinger veri. Gong usa il path già collaudato. */
export async function playPlanciaSfx(trackId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (trackId === STINGER_IDS.quizQuestionGong) {
    await playQuizGongSound();
    return true;
  }

  const manifest = await loadManifest();
  const track = manifest?.tracks[trackId];
  const rel = track?.files[track.primary];
  if (!rel) return false;

  if (!oneshot) oneshot = new Audio();
  oneshot.src = audioUrl(rel);
  oneshot.loop = false;
  oneshot.volume = STINGER_VOLUME;
  oneshot.currentTime = 0;

  try {
    await oneshot.play();
    return true;
  } catch {
    return false;
  }
}
