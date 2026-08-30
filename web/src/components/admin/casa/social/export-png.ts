"use client";

import { toPng } from "html-to-image";
import { SOCIAL_ASPECT_PX, type SocialAspect } from "@/lib/social/types";

export async function exportNodePng(
  node: HTMLElement,
  filename: string,
  aspect: SocialAspect,
): Promise<void> {
  const { w, h } = SOCIAL_ASPECT_PX[aspect];
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    width: w,
    height: h,
    style: {
      transform: "none",
      width: `${w}px`,
      height: `${h}px`,
    },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadTextFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
