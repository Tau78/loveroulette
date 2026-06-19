import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevApp, isProductionApp } from "./env";

describe("env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isProductionApp", () => {
    it("returns true when NODE_ENV is production", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(isProductionApp()).toBe(true);
    });

    it("returns false when NODE_ENV is development", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isProductionApp()).toBe(false);
    });

    it("returns false when NODE_ENV is test", () => {
      vi.stubEnv("NODE_ENV", "test");
      expect(isProductionApp()).toBe(false);
    });
  });

  describe("isDevApp", () => {
    it("returns true when NODE_ENV is development", () => {
      vi.stubEnv("NODE_ENV", "development");
      expect(isDevApp()).toBe(true);
    });

    it("returns false when NODE_ENV is production", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(isDevApp()).toBe(false);
    });
  });
});
