import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("mediaGain / setMediaVolume", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clamps and sets el.volume when Web Audio is unavailable", async () => {
    vi.stubGlobal("window", {
      AudioContext: undefined,
      webkitAudioContext: undefined,
    });
    const { setMediaVolume, getMediaVolume } = await import(
      "./media-element-gain"
    );
    const el = {
      volume: 1,
    } as HTMLMediaElement;

    setMediaVolume(el, 0.45);
    expect(el.volume).toBeCloseTo(0.45);
    expect(getMediaVolume(el)).toBeCloseTo(0.45);

    setMediaVolume(el, 2);
    expect(el.volume).toBe(1);
    setMediaVolume(el, -1);
    expect(el.volume).toBe(0);
  });

  it("routes through GainNode when AudioContext exists", async () => {
    const gainParam = { value: 1 };
    const gainNode = {
      gain: gainParam,
      connect: vi.fn(),
    };
    const source = { connect: vi.fn() };
    const ctx = {
      state: "running" as AudioContextState,
      resume: vi.fn(async () => undefined),
      createGain: vi.fn(() => gainNode),
      createMediaElementSource: vi.fn(() => source),
      destination: {},
    };
    vi.stubGlobal(
      "window",
      {
        AudioContext: vi.fn(function AudioContext() {
          return ctx;
        }),
      },
    );

    const { setMediaVolume, getMediaVolume, mediaGain } = await import(
      "./media-element-gain"
    );
    const el = { volume: 0.5 } as HTMLMediaElement;

    const handle = mediaGain(el);
    handle.setVolume(0.3);
    expect(ctx.createMediaElementSource).toHaveBeenCalledWith(el);
    expect(source.connect).toHaveBeenCalledWith(gainNode);
    expect(gainNode.connect).toHaveBeenCalledWith(ctx.destination);
    expect(el.volume).toBe(1);
    expect(gainParam.value).toBeCloseTo(0.3);
    expect(getMediaVolume(el)).toBeCloseTo(0.3);

    setMediaVolume(el, 0.8);
    expect(gainParam.value).toBeCloseTo(0.8);
    // Second call reuses the same graph
    expect(ctx.createMediaElementSource).toHaveBeenCalledTimes(1);
  });
});
