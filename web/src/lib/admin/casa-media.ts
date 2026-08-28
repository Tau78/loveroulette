/**
 * Session-oriented CasaPad media helpers.
 *
 * Track URLs are blob: object URLs from File picks. They live only for the
 * browser session — never persist them (or these state objects) to localStorage.
 */

export type CasaRepeatMode = "off" | "all" | "one";

export type CasaMediaTrack = { name: string; url: string };

export type CasaGongAtmosphere = {
  enabled: boolean;
  track: CasaMediaTrack | null;
};

export type CasaVideoState = {
  list: CasaMediaTrack[];
  index: number;
  repeat: CasaRepeatMode;
  muted: boolean;
  /** item currently sent to projector via double-tap; null = none */
  onScreenUrl: string | null;
  onScreenName: string | null;
};

export type CasaBedPlayerState = {
  folder: string | null;
  list: CasaMediaTrack[];
  index: number;
  repeat: CasaRepeatMode;
  playing: boolean;
};

export const DEFAULT_BED_PLAYER: CasaBedPlayerState = {
  folder: null,
  list: [],
  index: 0,
  repeat: "all",
  playing: false,
};

export const DEFAULT_VIDEO: CasaVideoState = {
  list: [],
  index: 0,
  repeat: "off",
  muted: true,
  onScreenUrl: null,
  onScreenName: null,
};

export const DEFAULT_GONG_ATMOSPHERE: CasaGongAtmosphere = {
  enabled: false,
  track: null,
};

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|ogg|aac|flac|opus)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|ogv|mkv)$/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i;

export function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.test(file.name);
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return VIDEO_EXTENSIONS.test(file.name);
}

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.test(file.name);
}

function sortByName(a: File, b: File): number {
  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function tracksFromFiles(
  files: File[],
  kind: "audio" | "av",
): CasaMediaTrack[] {
  const match =
    kind === "audio"
      ? isAudioFile
      : (file: File) => isVideoFile(file) || isImageFile(file);

  return files
    .filter(match)
    .sort(sortByName)
    .map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
}

export function revokeTracks(list: CasaMediaTrack[]): void {
  for (const track of list) {
    URL.revokeObjectURL(track.url);
  }
}

/**
 * Advance playlist cursor.
 * - `off`: next item, or `null` past the end
 * - `all`: wrap to 0
 * - `one`: stay on the same index
 */
export function nextIndex(
  index: number,
  len: number,
  repeat: CasaRepeatMode,
): number | null {
  if (len <= 0 || !Number.isFinite(index)) return null;
  const i = Math.trunc(index);
  if (repeat === "one") {
    return Math.min(Math.max(0, i), len - 1);
  }
  const next = i + 1;
  if (next < len) return next;
  if (repeat === "all") return 0;
  return null;
}

type DirectoryHandleLike = {
  name: string;
  values: () => AsyncIterableIterator<{
    kind: string;
    getFile: () => Promise<File>;
  }>;
};

/**
 * Opens a directory via File System Access API.
 * Returns `null` when unsupported, cancelled, or on error (caller can fall back to `<input>`).
 */
export async function pickDirectoryFiles(): Promise<{
  name: string;
  files: File[];
} | null> {
  if (typeof window === "undefined") return null;
  const picker = (
    window as Window & {
      showDirectoryPicker?: () => Promise<DirectoryHandleLike>;
    }
  ).showDirectoryPicker;
  if (typeof picker !== "function") return null;

  try {
    const dir = await picker();
    const files: File[] = [];
    for await (const entry of dir.values()) {
      if (entry.kind === "file") files.push(await entry.getFile());
    }
    return { name: dir.name, files };
  } catch {
    return null;
  }
}
