"use client";

import { useEffect, useState } from "react";
import type { DisplayOverlay as DisplayOverlayData } from "@/lib/musicpro/display-overlay";
import {
  DisplayPhaseHero,
  DisplayRevealSplash,
} from "@/components/display/DisplayShowText";
import { DisplayPlayerPresentSwitch } from "@/components/display/DisplayPlayerPresent";
import { DisplaySiglaWarn } from "@/components/display/DisplaySiglaWarn";
import { DisplayStaccoStage } from "@/components/display/DisplayStaccoStage";
import { isSiglaWarnSlide } from "@/lib/display/sigla-warn";
import { isStaccoSlide } from "@/lib/display/stacco";
import { JoinQrCode } from "./JoinQrCode";

const CUSTOM_DURATION_MS = 8000;

interface DisplayOverlayProps {
  overlay: DisplayOverlayData | null;
  joinUrl: string;
}

function playerGenderFromOverlay(
  overlay: DisplayOverlayData,
): "M" | "F" | null {
  const raw = (overlay.kicker ?? overlay.body ?? "").trim().toLowerCase();
  if (raw === "f" || raw === "lei" || raw === "female") return "F";
  if (raw === "m" || raw === "lui" || raw === "male") return "M";
  return null;
}

export function DisplayOverlay({ overlay, joinUrl }: DisplayOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!overlay || overlay.type === "clear") {
      setVisible(false);
      return;
    }

    if (overlay.type === "show_qr" || overlay.type === "slide") {
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

  if (overlay.type === "slide") {
    const gender = playerGenderFromOverlay(overlay);
    if (gender && overlay.title) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-10">
          <DisplayPlayerPresentSwitch
            nick={overlay.title}
            gender={gender}
            photo={overlay.imageUrl}
          />
        </div>
      );
    }

    if (isStaccoSlide(overlay) && overlay.title) {
      return (
        <div className="fixed inset-0 z-50">
          <DisplayStaccoStage value={Number(overlay.title)} />
        </div>
      );
    }

    if (isSiglaWarnSlide(overlay)) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-10 animate-fade-in">
          <DisplaySiglaWarn />
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-10 animate-fade-in">
        <DisplayPhaseHero
          kicker={overlay.kicker}
          headline={overlay.title ?? ""}
          subline={overlay.body}
          uppercase
        />
      </div>
    );
  }

  return (
    <DisplayRevealSplash title={overlay.title} body={overlay.body} />
  );
}
