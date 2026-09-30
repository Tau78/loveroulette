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

export function parseProjectorBridgeMessage(
  raw: string,
): { type: "open"; url: string } | { type: "close" } | null {
  try {
    const data = JSON.parse(raw) as { type?: string; url?: string };
    if (data?.type === "lr-close-projector") return { type: "close" };
    if (data?.type !== "lr-open-projector") return null;
    if (typeof data.url !== "string" || !data.url) return null;
    return { type: "open", url: data.url };
  } catch {
    return null;
  }
}
