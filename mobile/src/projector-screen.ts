/** Scelta dello schermo esterno per il proiettore (HDMI / AirPlay). */

export type ExternalScreenInfo = {
  id: string;
  width: number;
  height: number;
  mirrored?: boolean;
};

export type ExternalScreensMap = Record<string, ExternalScreenInfo>;

/**
 * Preferisce uno schermo non in mirror; altrimenti il primo esterno
 * (anche mirrored: montare una UIWindow lì toglie il duplicato e mostra /display).
 */
export function pickExternalScreenId(
  screens: ExternalScreensMap,
): string | null {
  const entries = Object.entries(screens);
  if (entries.length === 0) return null;
  const nonMirrored = entries.find(([, screen]) => screen.mirrored !== true);
  if (nonMirrored) return nonMirrored[0];
  return entries[0]![0];
}

export type ProjectorBridgeMessage =
  | { type: "open"; url: string }
  | { type: "close" }
  | { type: "overlay"; overlay: unknown };

export function parseProjectorBridgeMessage(
  raw: string,
): ProjectorBridgeMessage | null {
  try {
    const data = JSON.parse(raw) as {
      type?: string;
      url?: string;
      overlay?: unknown;
    };
    if (data?.type === "lr-close-projector") return { type: "close" };
    if (data?.type === "lr-display-overlay") {
      return { type: "overlay", overlay: data.overlay ?? null };
    }
    if (data?.type !== "lr-open-projector") return null;
    if (typeof data.url !== "string" || !data.url) return null;
    return { type: "open", url: data.url };
  } catch {
    return null;
  }
}

/** Inject overlay sul WebView HDMI — stesso evento che ascolta /display. */
export function injectDisplayOverlayJs(overlay: unknown): string {
  const payload = JSON.stringify(overlay ?? null);
  return `(function(){try{window.dispatchEvent(new CustomEvent('lr-native-display-overlay',{detail:${payload}}));}catch(e){} })();true;`;
}
