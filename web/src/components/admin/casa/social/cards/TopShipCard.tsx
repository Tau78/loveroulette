"use client";

import { Heart } from "lucide-react";
import type { SocialAspect, TopShipPayload } from "@/lib/social/types";
import { SocialCardShell, SocialPlate } from "../SocialCardShell";

export function TopShipCard({
  payload,
  aspect,
}: {
  payload: TopShipPayload;
  aspect: SocialAspect;
}) {
  return (
    <SocialCardShell
      aspect={aspect}
      venueName={payload.venueName}
      kicker="Top ship"
    >
      <SocialPlate className="mb-10 text-center">
        <p
          className="font-display text-[56px] font-bold uppercase tracking-[0.08em]"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            textShadow:
              "0 2px 0 rgba(0,0,0,0.95), 0 0 40px rgba(233,30,140,0.45)",
          }}
        >
          Le coppie più shipped
        </p>
      </SocialPlate>

      <ol className="flex flex-col gap-6">
        {payload.couples.map((c) => (
          <li
            key={`${c.rank}-${c.maleNickname}-${c.femaleNickname}`}
            className="flex items-center gap-5 rounded-[1.5rem] border border-white/15 bg-black/55 px-7 py-6 backdrop-blur-md"
          >
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E91E8C] to-[#FF4757] font-display text-[36px] font-bold">
              {c.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate font-display text-[40px] font-bold"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                {c.maleNickname}
                <Heart
                  className="mx-2 inline size-7 fill-pink-500/40 text-pink-400 align-[-0.15em]"
                  aria-hidden
                />
                {c.femaleNickname}
              </p>
            </div>
            {c.score != null ? (
              <span className="shrink-0 text-[36px] font-bold text-pink-300">
                {Math.round(c.score)}%
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </SocialCardShell>
  );
}
