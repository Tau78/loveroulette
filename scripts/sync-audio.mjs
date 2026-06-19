#!/usr/bin/env node
/**
 * Copia loop MP3 da music/ → web/public/audio/ e genera manifest per il player.
 * Uso: node scripts/sync-audio.mjs
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const musicDir = join(root, "music");
const publicAudio = join(root, "web", "public", "audio");
const sourceManifest = join(musicDir, "manifest.json");

if (!existsSync(sourceManifest)) {
  console.error("music/manifest.json non trovato");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(sourceManifest, "utf8"));
const webManifest = {
  theme: raw.theme,
  tracks: raw.tracks,
};

mkdirSync(publicAudio, { recursive: true });

const copied = [];
const missing = [];
const availableTracks = {};

for (const [trackId, track] of Object.entries(webManifest.tracks)) {
  const primaryRel = track.files?.[track.primary];
  if (!primaryRel) continue;

  const src = join(musicDir, primaryRel);
  if (!existsSync(src)) {
    missing.push(`${trackId} (${track.primary}): ${primaryRel}`);
    continue;
  }

  availableTracks[trackId] = track;

  for (const variant of ["A", "B"]) {
    const rel = track.files?.[variant];
    if (!rel) continue;

    const variantSrc = join(musicDir, rel);
    const dest = join(publicAudio, rel);

    if (!existsSync(variantSrc)) {
      if (variant === track.primary) missing.push(`${trackId} ${variant}: ${rel}`);
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    cpSync(variantSrc, dest);
    copied.push(rel);
  }
}

webManifest.tracks = availableTracks;

writeFileSync(
  join(publicAudio, "manifest.json"),
  `${JSON.stringify(webManifest, null, 2)}\n`,
);

console.log(`Sync audio: ${copied.length} file copiati → web/public/audio/`);
if (missing.length) {
  console.log("Mancanti (ok finché non esporti da SUNO):");
  for (const m of missing) console.log(`  - ${m}`);
}
