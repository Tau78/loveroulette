/** Risoluzione di riferimento proiettore — anteprima e sala identici (Full HD). */
export const PROJECTOR_REFERENCE = {
  width: 1920,
  height: 1080,
  aspect: 16 / 9,
} as const;

export { PROJECTOR_CANVAS } from "@/lib/display/projector-canvas";

export function projectorPreviewScale(
  containerWidth: number,
  containerHeight: number,
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;
  return Math.min(
    containerWidth / PROJECTOR_REFERENCE.width,
    containerHeight / PROJECTOR_REFERENCE.height,
  );
}

/** Anteprima dashboard: grafica sola, nessun audio dal proiettore embedded. */
export function displayPath(
  eventCode: string,
  options: { embed?: boolean; present?: boolean } = {},
): string {
  const base = `/s/${eventCode}/display`;
  const params = new URLSearchParams();
  if (options.embed) params.set("embed", "1");
  if (options.present) params.set("present", "1");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function displayUrl(
  eventCode: string,
  options: { embed?: boolean; present?: boolean; origin?: string } = {},
): string {
  const path = displayPath(eventCode, {
    embed: options.embed,
    present: options.present,
  });
  if (options.origin) return `${options.origin}${path}`;
  return path;
}

const PROJECTOR_WINDOW_NAME = "love-roulette-display";

export function openProjectorWindow(
  eventCode: string,
  options: { present?: boolean; origin?: string } = {},
): Window | null {
  if (typeof window === "undefined") return null;
  const url = displayUrl(eventCode, {
    present: options.present,
    origin: options.origin ?? window.location.origin,
  });
  const { width, height } = PROJECTOR_REFERENCE;
  const features = [
    "noopener",
    "noreferrer",
    `width=${width}`,
    `height=${height}`,
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
  ].join(",");
  return window.open(url, PROJECTOR_WINDOW_NAME, features);
}

export function isDisplayEmbedMode(
  params: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  return params?.get("embed") === "1";
}
