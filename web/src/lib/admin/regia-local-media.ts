export const REGIA_LOCAL_MEDIA_CHANNEL_PREFIX = "love-roulette-regia-media";

export const REGIA_IMAGE_SLIDE_MS = 8000;

export interface RegiaLocalMediaItem {
  url: string;
  name: string;
  kind: "video" | "image";
}

export interface RegiaLocalMediaState {
  folderName: string;
  items: RegiaLocalMediaItem[];
  index: number;
  playing: boolean;
  muted: boolean;
}

export type RegiaLocalMediaMessage =
  | { type: "sync_request" }
  | { type: "state"; state: RegiaLocalMediaState }
  | { type: "control"; playing?: boolean; muted?: boolean; index?: number }
  | { type: "clear" };

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogv",
  ".mkv",
]);

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
]);

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function classifyMediaFile(file: File): "video" | "image" | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";

  const ext = fileExtension(file.name);
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  return null;
}

export function filterAndSortMediaFiles(files: Iterable<File>): File[] {
  return [...files]
    .filter((file) => classifyMediaFile(file) !== null)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );
}

export function regiaLocalMediaChannel(eventCode: string): string {
  return `${REGIA_LOCAL_MEDIA_CHANNEL_PREFIX}:${eventCode.toLowerCase()}`;
}

export function buildLocalMediaItems(files: File[]): RegiaLocalMediaItem[] {
  return filterAndSortMediaFiles(files).map((file) => {
    const kind = classifyMediaFile(file)!;
    return {
      url: URL.createObjectURL(file),
      name: file.name,
      kind,
    };
  });
}

export function revokeLocalMediaItems(items: RegiaLocalMediaItem[]): void {
  for (const item of items) {
    URL.revokeObjectURL(item.url);
  }
}

export function postRegiaLocalMediaMessage(
  eventCode: string,
  message: RegiaLocalMediaMessage,
): void {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  const channel = new BroadcastChannel(regiaLocalMediaChannel(eventCode));
  channel.postMessage(message);
  channel.close();
}
