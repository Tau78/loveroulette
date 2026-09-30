/**
 * Volume per HTMLMediaElement che funziona anche su iOS / WKWebView.
 * Safari ignora `element.volume` (resta sempre 1): usiamo Web Audio GainNode.
 */

export type MediaGainHandle = {
  /** 0–1 linear */
  setVolume: (v: number) => void;
  getVolume: () => number;
};

type Wired = {
  handle: MediaGainHandle;
  gain: GainNode | null;
  ctx: AudioContext | null;
  linear: number;
};

const wired = new WeakMap<HTMLMediaElement, Wired>();

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function audioContextCtor(): (typeof AudioContext) | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

/**
 * Una sola volta per elemento (createMediaElementSource è one-shot).
 * Su desktop: dopo il wire `el.volume` resta a 1 e attenua solo il gain.
 * Se Web Audio non c’è, fallback a `el.volume`.
 */
export function mediaGain(el: HTMLMediaElement): MediaGainHandle {
  const existing = wired.get(el);
  if (existing) return existing.handle;

  const state: Wired = {
    handle: null as unknown as MediaGainHandle,
    gain: null,
    ctx: null,
    linear: clamp01(
      typeof el.volume === "number" && Number.isFinite(el.volume)
        ? el.volume
        : 1,
    ),
  };

  function ensureGraph(): void {
    if (state.gain) return;
    const Ctor = audioContextCtor();
    if (!Ctor) return;
    try {
      const ctx = new Ctor();
      const gain = ctx.createGain();
      gain.gain.value = state.linear;
      const src = ctx.createMediaElementSource(el);
      src.connect(gain);
      gain.connect(ctx.destination);
      state.ctx = ctx;
      state.gain = gain;
      // Evita doppia attenuazione dove el.volume funziona.
      try {
        el.volume = 1;
      } catch {
        /* iOS: read-only */
      }
    } catch {
      /* createMediaElementSource già chiamato / autoplay policy */
    }
  }

  const handle: MediaGainHandle = {
    setVolume(v: number) {
      state.linear = clamp01(v);
      ensureGraph();
      if (state.gain && state.ctx) {
        if (state.ctx.state === "suspended") {
          void state.ctx.resume().catch(() => undefined);
        }
        state.gain.gain.value = state.linear;
        return;
      }
      try {
        el.volume = state.linear;
      } catch {
        /* iOS senza Web Audio: niente da fare */
      }
    },
    getVolume() {
      return state.linear;
    },
  };

  state.handle = handle;
  wired.set(el, state);
  return handle;
}

export function setMediaVolume(el: HTMLMediaElement, volume: number): void {
  mediaGain(el).setVolume(volume);
}

export function getMediaVolume(el: HTMLMediaElement): number {
  return mediaGain(el).getVolume();
}
