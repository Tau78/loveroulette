import { audioUrl } from "@/lib/audio/phase-tracks";
import type { SoundtrackManifest } from "@/lib/audio/types";

/** Percorsi relativi (sotto public/audio/) referenziati nel manifest. */
export function collectManifestFilePaths(manifest: SoundtrackManifest): string[] {
  const paths: string[] = [];

  for (const track of Object.values(manifest.tracks)) {
    for (const variant of ["A", "B"] as const) {
      const rel = track.files[variant];
      if (rel) paths.push(rel);
    }
  }

  return paths;
}

export async function probeAudioFileHead(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function probeMissingManifestFiles(
  manifest: SoundtrackManifest,
): Promise<string[]> {
  const paths = collectManifestFilePaths(manifest);
  const missing: string[] = [];

  await Promise.all(
    paths.map(async (rel) => {
      const ok = await probeAudioFileHead(audioUrl(rel));
      if (!ok) missing.push(rel);
    }),
  );

  return missing.sort();
}

export function formatMissingMp3Warning(missingPaths: string[]): string | null {
  if (missingPaths.length === 0) return null;

  const listed = missingPaths
    .slice(0, 3)
    .map((rel) => `public/audio/${rel}`)
    .join(", ");
  const extra =
    missingPaths.length > 3 ? ` (+${missingPaths.length - 3} altri)` : "";

  return `File MP3 mancanti — carica in ${listed}${extra}`;
}
