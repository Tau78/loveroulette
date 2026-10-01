import type { DisplayOverlay } from "@/lib/musicpro/display-overlay";
import { notifyNativeDisplayOverlay } from "@/lib/display/embed";

export const DISPLAY_OVERLAY_CHANNEL_PREFIX = "love-roulette-display-overlay";
export const DISPLAY_OVERLAY_EVENT = "lr-display-overlay";
export const DISPLAY_OVERLAY_MESSAGE_TYPE = "lr-display-overlay";

export type DisplayOverlayBroadcastMessage = {
  type: typeof DISPLAY_OVERLAY_MESSAGE_TYPE;
  eventCode: string;
  overlay: DisplayOverlay | null;
};

export function displayOverlayChannel(eventCode: string): string {
  return `${DISPLAY_OVERLAY_CHANNEL_PREFIX}:${eventCode.toLowerCase()}`;
}

/** Comando plancia → overlay con clock fresco (merge poll per updatedAt). */
export function displayCommandToOverlay(
  body: Record<string, string>,
): DisplayOverlay {
  const updatedAt = new Date().toISOString();
  const type = (body.type ?? "clear") as DisplayOverlay["type"];
  if (type === "clear") {
    return { type: "clear", updatedAt };
  }
  const overlay: DisplayOverlay = { type, updatedAt };
  if (body.title) overlay.title = body.title;
  if (body.body) overlay.body = body.body;
  if (body.kicker) overlay.kicker = body.kicker;
  if (body.imageUrl) overlay.imageUrl = body.imageUrl;
  if (body.startedAt) overlay.startedAt = body.startedAt;
  return overlay;
}

function postToSameOriginIframes(message: DisplayOverlayBroadcastMessage): void {
  if (typeof document === "undefined") return;
  const frames = document.querySelectorAll("iframe");
  for (const frame of frames) {
    try {
      frame.contentWindow?.postMessage(message, window.location.origin);
    } catch {
      /* cross-origin */
    }
  }
}

/**
 * Push istantaneo a anteprima (iframe / BroadcastChannel) e SCHERMO nativo.
 * Il POST API resta per persistenza / altri device.
 */
export function broadcastDisplayOverlay(
  eventCode: string,
  overlay: DisplayOverlay | null,
): void {
  if (typeof window === "undefined") return;
  const message: DisplayOverlayBroadcastMessage = {
    type: DISPLAY_OVERLAY_MESSAGE_TYPE,
    eventCode: eventCode.toUpperCase(),
    overlay,
  };

  try {
    window.dispatchEvent(
      new CustomEvent(DISPLAY_OVERLAY_EVENT, { detail: message }),
    );
  } catch {
    /* ignore */
  }

  if ("BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel(displayOverlayChannel(eventCode));
      channel.postMessage(message);
      channel.close();
    } catch {
      /* ignore */
    }
  }

  postToSameOriginIframes(message);
  notifyNativeDisplayOverlay(overlay);
}

export function parseDisplayOverlayBroadcast(
  raw: unknown,
  eventCode: string,
): DisplayOverlay | null | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const data = raw as Partial<DisplayOverlayBroadcastMessage>;
  if (data.type !== DISPLAY_OVERLAY_MESSAGE_TYPE) return undefined;
  if (
    typeof data.eventCode === "string" &&
    data.eventCode.toUpperCase() !== eventCode.toUpperCase()
  ) {
    return undefined;
  }
  if (data.overlay === null) return null;
  if (!data.overlay || typeof data.overlay !== "object") return undefined;
  const o = data.overlay as DisplayOverlay;
  if (typeof o.type !== "string" || typeof o.updatedAt !== "string") {
    return undefined;
  }
  return o;
}

/** Preferisci l’overlay più recente (evita che un poll lento cancelli il tap). */
export function preferFresherDisplayOverlay(
  current: DisplayOverlay | null,
  incoming: DisplayOverlay | null,
): DisplayOverlay | null {
  if (!incoming) {
    if (!current) return null;
    const age = Date.now() - Date.parse(current.updatedAt);
    // Poll senza overlay: non cancellare un push locale fresco.
    if (Number.isFinite(age) && age >= 0 && age < 2500) return current;
    return null;
  }
  if (!current) return incoming;
  const a = Date.parse(current.updatedAt);
  const b = Date.parse(incoming.updatedAt);
  if (!Number.isFinite(a)) return incoming;
  if (!Number.isFinite(b)) return current;
  return b >= a ? incoming : current;
}
