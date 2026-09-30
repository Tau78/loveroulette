"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { AVANTI_CROSSFADE_MS } from "@/lib/audio/types";
import { JoinQrCode } from "./JoinQrCode";
import type { StageGender } from "@/lib/player/identity";

const CUSTOM_DURATION_MS = 8000;

interface DisplayOverlayProps {
  overlay: DisplayOverlayData | null;
  joinUrl: string;
}

/**
 * Card giocatore: kicker = sola lettera F/M/N (vedi playerCardDisplayCommand).
 * I dettagli (Cerca, Nome, …) usano kicker testuale e NON devono finire qui,
 * altrimenti headline/valore spariscono e resta solo nick + sesso.
 */
function playerGenderFromOverlay(
  overlay: DisplayOverlayData,
): StageGender | null {
  const raw = (overlay.kicker ?? "").trim().toUpperCase();
  if (raw === "F") return "F";
  if (raw === "N") return "N";
  if (raw === "M") return "M";
  return null;
}

function overlayKey(overlay: DisplayOverlayData): string {
  return [
    overlay.type,
    overlay.title ?? "",
    overlay.kicker ?? "",
    overlay.body ?? "",
    overlay.imageUrl ?? "",
    overlay.updatedAt ?? "",
  ].join("|");
}

export function DisplayOverlay({ overlay, joinUrl }: DisplayOverlayProps) {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();
  const fadeSec = (reduceMotion ? 0 : AVANTI_CROSSFADE_MS) / 1000;

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

  const show = Boolean(visible && overlay && overlay.type !== "clear");
  const staccoTick =
    show && overlay?.type === "slide" && isStaccoSlide(overlay);
  const activeFadeSec = staccoTick ? (reduceMotion ? 0 : 0.12) : fadeSec;

  return (
    <AnimatePresence mode="sync">
      {show && overlay ? (
        <motion.div
          key={
            staccoTick
              ? `stacco:${overlay.title ?? ""}`
              : overlayKey(overlay)
          }
          className="fixed inset-0 z-50 bg-black"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: activeFadeSec, ease: "easeInOut" }}
        >
          <OverlayBody overlay={overlay} joinUrl={joinUrl} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function OverlayBody({
  overlay,
  joinUrl,
}: {
  overlay: DisplayOverlayData;
  joinUrl: string;
}) {
  if (overlay.type === "show_qr") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
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
        <div className="relative h-full w-full bg-black">
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
        <div className="h-full bg-black">
          <DisplayStaccoStage value={Number(overlay.title)} />
        </div>
      );
    }

    if (isSiglaWarnSlide(overlay)) {
      return (
        <div className="flex h-full items-center justify-center bg-black p-10">
          <DisplaySiglaWarn />
        </div>
      );
    }

    // Dettaglio giocatore (o altra slide testo): cover pieno + valore in headline.
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 bg-black p-10">
        {overlay.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={overlay.imageUrl}
            alt=""
            className="relative z-10 size-[min(26vh,200px)] rounded-full border-[5px] border-primary/85 object-cover shadow-[0_0_48px_rgba(233,30,140,0.45)]"
          />
        ) : null}
        <DisplayPhaseHero
          kicker={overlay.kicker}
          headline={overlay.title ?? ""}
          subline={overlay.body}
          uppercase
        />
      </div>
    );
  }

  return <DisplayRevealSplash title={overlay.title} body={overlay.body} />;
}
