#!/usr/bin/env node
/**
 * Verifica che i file MP3 referenziati in public/audio/manifest.json esistano.
 * Uso: npm run check:audio
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicAudio = join(webRoot, "public", "audio");
const manifestPath = join(publicAudio, "manifest.json");

if (!existsSync(manifestPath)) {
  console.error("check:audio FAIL — manifest.json non trovato in public/audio/");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const missing = [];

for (const [trackId, track] of Object.entries(manifest.tracks ?? {})) {
  for (const variant of ["A", "B"]) {
    const rel = track.files?.[variant];
    if (!rel) continue;

    const abs = join(publicAudio, rel);
    if (!existsSync(abs)) {
      missing.push({ trackId, variant, rel });
    }
  }
}

if (missing.length === 0) {
  console.log("check:audio OK — tutti i file MP3 del manifest sono presenti.");
  process.exit(0);
}

console.error(`check:audio FAIL — ${missing.length} file MP3 mancanti:`);
for (const entry of missing) {
  console.error(
    `  - ${entry.trackId} (${entry.variant}): public/audio/${entry.rel}`,
  );
}
console.error(
  "\nCarica i file in public/audio/ oppure, se hai le tracce in music/, lancia: npm run sync:audio",
);
process.exit(1);
