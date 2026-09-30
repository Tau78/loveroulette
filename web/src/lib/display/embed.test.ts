import { describe, expect, it } from "vitest";
import {
  PROJECTOR_REFERENCE,
  isCloseProjectorNativeMessage,
  isOpenProjectorNativeMessage,
  pickSecondaryScreen,
  projectorPreviewScale,
} from "@/lib/display/embed";

describe("projectorPreviewScale", () => {
  it("returns 1 at native Full HD", () => {
    expect(
      projectorPreviewScale(
        PROJECTOR_REFERENCE.width,
        PROJECTOR_REFERENCE.height,
      ),
    ).toBe(1);
  });

  it("letterboxes uniformly when viewport is narrower", () => {
    expect(projectorPreviewScale(960, 1080)).toBe(0.5);
  });

  it("letterboxes uniformly when viewport is shorter", () => {
    expect(projectorPreviewScale(1920, 540)).toBe(0.5);
  });

  it("fits preview panel 640×360", () => {
    expect(projectorPreviewScale(640, 360)).toBeCloseTo(1 / 3, 5);
  });
});

describe("pickSecondaryScreen", () => {
  it("returns null for empty list", () => {
    expect(pickSecondaryScreen([])).toBeNull();
  });

  it("prefers isPrimary=false", () => {
    const secondary = {
      isPrimary: false,
      availLeft: 1920,
      availTop: 0,
      availWidth: 1920,
      availHeight: 1080,
    };
    expect(
      pickSecondaryScreen([
        {
          isPrimary: true,
          availLeft: 0,
          availTop: 0,
          availWidth: 1512,
          availHeight: 982,
        },
        secondary,
      ]),
    ).toBe(secondary);
  });

  it("falls back to offset screen when isPrimary missing", () => {
    const hdmi = {
      availLeft: 1920,
      availTop: 0,
      availWidth: 1920,
      availHeight: 1080,
    };
    expect(
      pickSecondaryScreen([
        { availLeft: 0, availTop: 0, availWidth: 1512, availHeight: 982 },
        hdmi,
      ]),
    ).toBe(hdmi);
  });
});

describe("displayPath fill", () => {
  it("adds fill=1 for native external screen", async () => {
    const { displayPath } = await import("@/lib/display/embed");
    expect(displayPath("DEMO01", { present: true, fill: true })).toBe(
      "/s/DEMO01/display?present=1&fill=1",
    );
  });
});

describe("isOpenProjectorNativeMessage", () => {
  it("parses bridge payload", () => {
    expect(
      isOpenProjectorNativeMessage(
        JSON.stringify({
          type: "lr-open-projector",
          url: "https://loveroulette.vercel.app/s/DEMO01/display?present=1",
        }),
      ),
    ).toEqual({
      url: "https://loveroulette.vercel.app/s/DEMO01/display?present=1",
    });
  });

  it("rejects junk", () => {
    expect(isOpenProjectorNativeMessage("nope")).toBeNull();
    expect(
      isOpenProjectorNativeMessage(JSON.stringify({ type: "other" })),
    ).toBeNull();
  });
});

describe("isCloseProjectorNativeMessage", () => {
  it("accepts close payload", () => {
    expect(
      isCloseProjectorNativeMessage(
        JSON.stringify({ type: "lr-close-projector" }),
      ),
    ).toBe(true);
  });

  it("rejects open and junk", () => {
    expect(
      isCloseProjectorNativeMessage(
        JSON.stringify({ type: "lr-open-projector", url: "x" }),
      ),
    ).toBe(false);
    expect(isCloseProjectorNativeMessage("nope")).toBe(false);
  });
});
