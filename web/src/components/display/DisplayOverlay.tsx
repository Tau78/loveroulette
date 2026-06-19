"use client";

import { useEffect, useState } from "react";
import type { DisplayOverlay as DisplayOverlayData } from "@/lib/musicpro/display-overlay";
import { DisplayRevealSplash } from "@/components/display/DisplayShowText";
import { JoinQrCode } from "./JoinQrCode";

const CUSTOM_DURATION_MS = 8000;

interface DisplayOverlayProps {
  overlay: DisplayOverlayData | null;
  joinUrl: string;
}

export function DisplayOverlay({ overlay, joinUrl }: DisplayOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!overlay || overlay.type === "clear") {
      setVisible(false);
      return;
    }

    if (overlay.type === "show_qr") {
      setVisible(true);
      return;
    }

    if (overlay.type === "custom") {
      const elapsed = Date.now() - new Date(overlay.updatedAt).getTime();
      const remaining = CUSTOM_DURATION_MS - elapsed;

      if (remaining <= 0) {
        setVisible(false);
        return;
      }

      setVisible(true);
      const timer = window.setTimeout(() => setVisible(false), remaining);
      return () => window.clearTimeout(timer);
    }
  }, [overlay]);

  if (!visible || !overlay || overlay.type === "clear") {
    return null;
  }

  if (overlay.type === "show_qr") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
        <JoinQrCode url={joinUrl} size={320} />
        <p className="mt-8 text-xl md:text-2xl text-white/75">
          Scansiona per unirti al gioco
        </p>
      </div>
    );
  }

  return (
    <DisplayRevealSplash title={overlay.title} body={overlay.body} />
  );
}
