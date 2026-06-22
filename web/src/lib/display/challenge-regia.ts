import type { ChallengeId } from "@/lib/types";
import type { RegiaLocalMediaItem } from "@/lib/admin/regia-local-media";
import { audioUrl } from "@/lib/audio/phase-tracks";

/** Mazzo fiori Love Roulette — full screen in prova dichiarazione. */
export const DECLARATION_BOUQUET_SRC =
  "/finals/love-roulette-bouquet.svg";

export const CHALLENGE_ROMANTIC_BED_ID = "LR_11_Finals_Romantic";
export const CHALLENGE_DANCE_BED_ID = "LR_10_Finals_Dance";
export const CHALLENGE_PLAYFUL_BED_ID = "LR_12_Finals_Playful";

/** Brani ballo selezionabili (manifest id → etichetta animatore). */
export const DANCE_TRACK_OPTIONS: ReadonlyArray<{
  id: string;
  label: string;
  manifestTrackId: string;
}> = [
  { id: "dance_main", label: "Ballo 1 — Dancefloor", manifestTrackId: CHALLENGE_DANCE_BED_ID },
  { id: "dance_latino", label: "Ballo 2 — Latino", manifestTrackId: "LR_10_Finals_Dance_B" },
  { id: "dance_edm", label: "Ballo 3 — EDM pop", manifestTrackId: "LR_10_Finals_Dance_C" },
  { id: "dance_funk", label: "Ballo 4 — Funk", manifestTrackId: "LR_10_Finals_Dance_D" },
];

export const DANCE_MIX_TRACK_IDS = DANCE_TRACK_OPTIONS.map((t) => t.manifestTrackId);

/** Media bundled sotto `public/finals/` (aggiungi file MP4/JPG in produzione). */
function presetItem(
  path: string,
  name: string,
  kind: "video" | "image",
): RegiaLocalMediaItem {
  return { url: path, name, kind };
}

export const KISS_PRESET_MEDIA: RegiaLocalMediaItem[] = [
  presetItem("/finals/kiss/01-cinema-classic.mp4", "Bacio cinema", "video"),
  presetItem("/finals/kiss/02-spider-man.mp4", "Spider-Man", "video"),
  presetItem("/finals/kiss/03-titanic.mp4", "Titanic", "video"),
  presetItem("/finals/kiss/04-lady-tramp.mp4", "Lilli e il Vagabondo", "video"),
];

export const KAMASUTRA_PRESET_MEDIA: RegiaLocalMediaItem[] = [
  presetItem("/finals/kamasutra/01.jpg", "Posizione 1", "image"),
  presetItem("/finals/kamasutra/02.jpg", "Posizione 2", "image"),
  presetItem("/finals/kamasutra/03.jpg", "Posizione 3", "image"),
  presetItem("/finals/kamasutra/04.jpg", "Posizione 4", "image"),
  presetItem("/finals/kamasutra/05.jpg", "Posizione 5", "image"),
  presetItem("/finals/kamasutra/06.jpg", "Posizione 6", "image"),
];

export function resolveManifestTrackUrl(
  manifest: { tracks: Record<string, { files: { A: string; B?: string }; primary: "A" | "B" }> },
  trackId: string,
): string | null {
  const track = manifest.tracks[trackId];
  if (!track) return null;
  const rel = track.files[track.primary] ?? track.files.A;
  return rel ? audioUrl(rel) : null;
}

export function challengeUsesFullScreenBackdrop(
  challengeId: ChallengeId | null,
): boolean {
  return challengeId === "declaration";
}

export function challengeUsesRegiaMedia(
  challengeId: ChallengeId | null,
): boolean {
  return challengeId === "kiss" || challengeId === "kamasutra";
}
