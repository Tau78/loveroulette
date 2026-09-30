/** Playback helpers for the Casa sigla (intro video + audio fallback). */

import { SIGLA_AUDIO_CANDIDATES } from "@/lib/admin/casa-slides";

/**
 * True when we should mount a `<video>` for the sigla.
 * Never mount when the asset is known missing — iOS WKWebView can kill the
 * content process on a 404 / decode error mid-play.
 */
export function shouldMountSiglaVideo(
  src: string | null | undefined,
  missing: boolean,
): boolean {
  if (!src?.trim()) return false;
  if (missing) return false;
  return true;
}

/** Local file picks use blob: — skip network probe. */
export function isLocalSiglaSrc(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("file:");
}

/**
 * Probe whether the sigla asset is reachable.
 * Returns true if missing / unusable.
 */
export async function probeSiglaMissing(src: string): Promise<boolean> {
  const trimmed = src.trim();
  if (!trimmed) return true;
  if (isLocalSiglaSrc(trimmed)) return false;
  if (typeof window === "undefined") return false;

  try {
    const url = new URL(trimmed, window.location.origin);
    const res = await fetch(url.href, { method: "HEAD", cache: "no-store" });
    if (res.ok) return false;
    // Some hosts reject HEAD — try a ranged GET.
    if (res.status === 405 || res.status === 501) {
      const get = await fetch(url.href, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        cache: "no-store",
      });
      return !(get.ok || get.status === 206);
    }
    return true;
  } catch {
    return true;
  }
}

/** First reachable sigla audio path, or null if none. */
export async function resolveSiglaAudioSrc(
  candidates: readonly string[] = SIGLA_AUDIO_CANDIDATES,
): Promise<string | null> {
  for (const src of candidates) {
    const missing = await probeSiglaMissing(src);
    if (!missing) return src;
  }
  return null;
}
