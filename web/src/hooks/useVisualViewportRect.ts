"use client";

import { useEffect, useState, type CSSProperties } from "react";

export type VisualViewportRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type VisualViewportLike = Pick<
  VisualViewport,
  "offsetTop" | "offsetLeft" | "width" | "height"
>;

export function readVisualViewportRect(
  viewport: VisualViewportLike | null | undefined,
): VisualViewportRect | null {
  if (
    !viewport ||
    typeof viewport.offsetTop !== "number" ||
    typeof viewport.offsetLeft !== "number" ||
    typeof viewport.width !== "number" ||
    typeof viewport.height !== "number"
  ) {
    return null;
  }

  return {
    top: viewport.offsetTop,
    left: viewport.offsetLeft,
    width: viewport.width,
    height: viewport.height,
  };
}

/** Pin a `position:fixed` overlay to the visual viewport; fall back to inset:0. */
export function visualViewportOverlayStyle(
  rect: VisualViewportRect | null,
): CSSProperties {
  if (!rect) {
    return { position: "fixed", inset: 0 };
  }

  return {
    position: "fixed",
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function readWindowVisualViewport(): VisualViewportRect | null {
  if (typeof window === "undefined") return null;
  return readVisualViewportRect(window.visualViewport);
}

/** Tracks `visualViewport` offset + size; `null` when the API is missing. */
export function useVisualViewportRect(enabled: boolean): VisualViewportRect | null {
  const [rect, setRect] = useState<VisualViewportRect | null>(() =>
    enabled ? readWindowVisualViewport() : null,
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setRect(null);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) {
      setRect(null);
      return;
    }

    const update = () => {
      setRect(readVisualViewportRect(viewport));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return enabled ? rect : null;
}
