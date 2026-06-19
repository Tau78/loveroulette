import { describe, expect, it } from "vitest";
import demo01FullDocument from "../../../data/generatore/DEMO01-manche-full-v1.json";
import type { GeneratoreMancheDocument } from "./types";
import {
  DEMO01_MANCHE_BUNDLE_ID,
  resolveDefaultGeneratoreBundle,
} from "./auto-import";

const demo01Full = demo01FullDocument as GeneratoreMancheDocument;

describe("resolveDefaultGeneratoreBundle", () => {
  it("returns DEMO01 bundle for demo event code by default", () => {
    const result = resolveDefaultGeneratoreBundle("DEMO01", {});
    expect(result?.bundleId).toBe(DEMO01_MANCHE_BUNDLE_ID);
    expect(result?.document.manche.length).toBeGreaterThan(0);
  });

  it("returns null when auto import is disabled", () => {
    expect(
      resolveDefaultGeneratoreBundle("DEMO01", {
        generatore_auto_import: false,
      }),
    ).toBeNull();
  });

  it("uses configured bundle id from metadata", () => {
    const result = resolveDefaultGeneratoreBundle("CUSTOM", {
      generatore_default_bundle: DEMO01_MANCHE_BUNDLE_ID,
    });
    expect(result?.bundleId).toBe(DEMO01_MANCHE_BUNDLE_ID);
    expect(result?.document).toEqual(demo01Full);
  });
});
