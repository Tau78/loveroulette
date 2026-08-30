"use client";

import { Heart } from "lucide-react";
import type { SocialAspect, WinnerNightPayload } from "@/lib/social/types";
import { SocialCardShell, SocialPlate } from "../SocialCardShell";

export function WinnerNightCard({
  payload,
  aspect,
}: {
  payload: WinnerNightPayload;
  aspect: SocialAspect;
}) {
  return (
    <SocialCardShell
      aspect={aspect}
      venueName={payload.venueName}
      kicker="Vincitori"
    >
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <SocialPlate className="w-full max-w-[900px]">
          <p className="text-[26px] font-bold uppercase tracking-[0.3em] text-amber-200/90">
            {payload.prizeKicker.trim() || "Stasera"}
          </p>
          <p
            className="mt-6 font-display text-[72px] font-bold uppercase leading-none tracking-[0.04em]"
            style={{
              fontFamily: "var(--font-display), Georgia, serif",
              textShadow:
                "0 3px 0 rgba(0,0,0,1), 0 0 48px rgba(233,30,140,0.55), 0 0 24px rgba(255,215,0,0.25)",
            }}
          >
            {payload.coupleLabel}
          </p>
          <Heart
            className="mx-auto mt-6 size-14 fill-pink-500/50 text-pink-400"
            strokeWidth={1.25}
            aria-hidden
          />
        </SocialPlate>

        <div className="mt-14 w-full max-w-[820px] rounded-[1.75rem] border border-amber-200/25 bg-black/55 px-10 py-8 backdrop-blur-md">
          <p className="text-[24px] font-bold uppercase tracking-[0.28em] text-amber-100/80">
            {payload.prizeHeadline.trim() || "Il premio"}
          </p>
          {payload.prizeSub.trim() ? (
            <p className="mt-4 text-[36px] font-semibold leading-snug text-white/90">
              {payload.prizeSub}
            </p>
          ) : null}
        </div>
      </div>
    </SocialCardShell>
  );
}
