import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

const isProductionApp = vi.fn();

vi.mock("@/lib/env", () => ({
  isProductionApp: () => isProductionApp(),
}));

import Home from "./page";

describe("Home (/) production entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notFound in production so dev demo links never render", () => {
    isProductionApp.mockReturnValue(true);

    expect(() => Home()).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("renders dev demo hub when not in production", () => {
    isProductionApp.mockReturnValue(false);

    const markup = renderToStaticMarkup(Home());

    expect(notFound).not.toHaveBeenCalled();
    expect(markup).toContain("DEMO01");
    expect(markup).toContain("Demo serata");
  });
});
