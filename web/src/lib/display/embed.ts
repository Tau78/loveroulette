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
  options: { embed?: boolean; present?: boolean; fill?: boolean } = {},
): string {
  const base = `/s/${eventCode}/display`;
  const params = new URLSearchParams();
  if (options.embed) params.set("embed", "1");
  if (options.present) params.set("present", "1");
  /** Secondo schermo nativo: riempie già la finestra, niente overlay «clicca». */
  if (options.fill) params.set("fill", "1");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function displayUrl(
  eventCode: string,
  options: {
    embed?: boolean;
    present?: boolean;
    fill?: boolean;
    origin?: string;
  } = {},
): string {
  const path = displayPath(eventCode, {
    embed: options.embed,
    present: options.present,
    fill: options.fill,
  });
  if (options.origin) return `${options.origin}${path}`;
  return path;
}

const PROJECTOR_WINDOW_NAME = "love-roulette-display";

/** Forma minima di Screen / ScreenDetailed (Window Management API). */
export type ProjectorScreenLike = {
  isPrimary?: boolean;
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
};

/**
 * Sceglie lo schermo non-primario (HDMI / monitor esteso).
 * Se `isPrimary` manca, preferisce uno schermo spostato (availLeft/Top ≠ 0).
 */
export function pickSecondaryScreen(
  screens: readonly ProjectorScreenLike[],
): ProjectorScreenLike | null {
  if (screens.length === 0) return null;
  const marked = screens.find((s) => s.isPrimary === false);
  if (marked) return marked;
  const offset = screens.find(
    (s) =>
      (Number.isFinite(s.availLeft) && s.availLeft !== 0) ||
      (Number.isFinite(s.availTop) && s.availTop !== 0),
  );
  if (offset) return offset;
  return screens.length > 1 ? screens[1]! : null;
}

function popupFeatures(screen?: ProjectorScreenLike | null): string {
  const base = [
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "resizable=yes",
  ];
  if (screen) {
    return [
      ...base,
      `left=${Math.round(screen.availLeft)}`,
      `top=${Math.round(screen.availTop)}`,
      `width=${Math.round(screen.availWidth || PROJECTOR_REFERENCE.width)}`,
      `height=${Math.round(screen.availHeight || PROJECTOR_REFERENCE.height)}`,
    ].join(",");
  }
  return [
    ...base,
    `width=${PROJECTOR_REFERENCE.width}`,
    `height=${PROJECTOR_REFERENCE.height}`,
  ].join(",");
}

type RnWebViewBridge = {
  ReactNativeWebView?: { postMessage?: (msg: string) => void };
};

export function isReactNativeWebView(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as RnWebViewBridge).ReactNativeWebView?.postMessage,
  );
}

function postNativeProjectorMessage(payload: object): boolean {
  if (typeof window === "undefined") return false;
  const rn = (window as unknown as RnWebViewBridge).ReactNativeWebView;
  if (!rn?.postMessage) return false;
  rn.postMessage(JSON.stringify(payload));
  return true;
}

function notifyNativeOpenProjector(url: string): boolean {
  return postNativeProjectorMessage({ type: "lr-open-projector", url });
}

/** Chiude il proiettore nativo (secondo schermo / Modal) sulla plancia iPad. */
export function notifyNativeCloseProjector(): boolean {
  return postNativeProjectorMessage({ type: "lr-close-projector" });
}

/** Overlay istantaneo sul WebView proiettore (HDMI) — bypass poll. */
export function notifyNativeDisplayOverlay(overlay: unknown): boolean {
  return postNativeProjectorMessage({
    type: "lr-display-overlay",
    overlay: overlay ?? null,
  });
}

export function isDisplayOverlayNativeMessage(
  raw: string,
): { overlay: unknown } | null {
  try {
    const data = JSON.parse(raw) as { type?: string; overlay?: unknown };
    if (data?.type !== "lr-display-overlay") return null;
    return { overlay: data.overlay ?? null };
  } catch {
    return null;
  }
}

export type OpenProjectorMode =
  | "secondary"
  | "popup"
  | "native-bridge"
  | "blocked";

export type OpenProjectorResult = {
  window: Window | null;
  mode: OpenProjectorMode;
  url: string;
};

/**
 * Apre `/display` preferendo uno schermo secondario (Window Management API,
 * Chrome/Edge desktop). In WebView iPad: bridge nativo **prima** di
 * `window.open` (evita crash WKWebView con HDMI / mirror).
 */
export async function openProjectorWindowAsync(
  eventCode: string,
  options: { present?: boolean; fill?: boolean; origin?: string } = {},
): Promise<OpenProjectorResult> {
  if (typeof window === "undefined") {
    return { window: null, mode: "blocked", url: displayUrl(eventCode, options) };
  }
  const onNative = isReactNativeWebView();
  const url = displayUrl(eventCode, {
    present: options.present ?? true,
    // iPad/secondo schermo: già a tutta area — niente «Clicca per schermo intero».
    fill: options.fill ?? onNative,
    origin: options.origin ?? window.location.origin,
  });

  // iPad / plancia nativa: niente window.open (crash con secondo schermo).
  if (notifyNativeOpenProjector(url)) {
    return { window: null, mode: "native-bridge", url };
  }

  try {
    const getScreenDetails = (
      window as unknown as {
        getScreenDetails?: () => Promise<{ screens?: ProjectorScreenLike[] }>;
      }
    ).getScreenDetails;
    if (typeof getScreenDetails === "function") {
      const details = await getScreenDetails.call(window);
      const secondary = pickSecondaryScreen(details.screens ?? []);
      if (secondary) {
        const win = window.open(
          url,
          PROJECTOR_WINDOW_NAME,
          popupFeatures(secondary),
        );
        if (win) return { window: win, mode: "secondary", url };
      }
    }
  } catch {
    /* permesso negato o API assente */
  }

  const win = window.open(url, PROJECTOR_WINDOW_NAME, popupFeatures());
  if (win) return { window: win, mode: "popup", url };

  return { window: null, mode: "blocked", url };
}

/** Sync legacy — popup locale. Preferire `openProjectorWindowAsync` sulla board. */
export function openProjectorWindow(
  eventCode: string,
  options: { present?: boolean; origin?: string } = {},
): Window | null {
  if (typeof window === "undefined") return null;
  const url = displayUrl(eventCode, {
    present: options.present,
    origin: options.origin ?? window.location.origin,
  });
  if (notifyNativeOpenProjector(url)) return null;
  const win = window.open(url, PROJECTOR_WINDOW_NAME, popupFeatures());
  return win;
}

export function isDisplayEmbedMode(
  params: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  return params?.get("embed") === "1";
}

export function isOpenProjectorNativeMessage(
  raw: string,
): { url: string } | null {
  try {
    const data = JSON.parse(raw) as { type?: string; url?: string };
    if (data?.type !== "lr-open-projector") return null;
    if (typeof data.url !== "string" || !data.url) return null;
    return { url: data.url };
  } catch {
    return null;
  }
}

export function isCloseProjectorNativeMessage(raw: string): boolean {
  try {
    const data = JSON.parse(raw) as { type?: string };
    return data?.type === "lr-close-projector";
  } catch {
    return false;
  }
}
