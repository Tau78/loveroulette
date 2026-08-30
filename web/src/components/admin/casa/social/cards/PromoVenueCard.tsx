"use client";

import { Heart } from "lucide-react";
import type { PromoVenuePayload, SocialAspect } from "@/lib/social/types";
import { SocialCardShell, SocialPlate } from "../SocialCardShell";

export type PromoFrame = "invite" | "energia" | "highlight";

export function PromoVenueCard({
  payload,
  aspect,
  frame,
}: {
  payload: PromoVenuePayload;
  aspect: SocialAspect;
  frame: PromoFrame;
}) {
  const where = payload.venueName.trim() || "Serata live";

  if (frame === "energia") {
    return (
      <SocialCardShell aspect={aspect} venueName={where} kicker="Live">
        <SocialPlate className="text-center">
          <p
            className="font-display text-[64px] font-bold uppercase leading-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Quiz · Match · Finale
          </p>
          <p className="mt-8 text-[32px] text-white/80">
            Sul palco, con il telefono in mano
          </p>
          {payload.prizeHeadline.trim() ? (
            <p className="mt-10 text-[28px] font-bold uppercase tracking-[0.18em] text-pink-300">
              In palio · {payload.prizeHeadline}
            </p>
          ) : null}
        </SocialPlate>
      </SocialCardShell>
    );
  }

  if (frame === "highlight") {
    return (
      <SocialCardShell aspect={aspect} venueName={where} kicker="Highlight">
        <SocialPlate className="text-center">
          <p className="text-[26px] font-bold uppercase tracking-[0.28em] text-pink-300">
            Cosa è successo
          </p>
          <p
            className="mt-6 font-display text-[56px] font-bold uppercase leading-tight"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            {payload.topCoupleLabel ?? "Una night da ricordare"}
          </p>
          <Heart
            className="mx-auto mt-8 size-12 fill-pink-500/40 text-pink-400"
            aria-hidden
          />
          <p className="mt-8 text-[30px] text-white/75">
            Salva · Condividi · Torna la prossima
          </p>
        </SocialPlate>
      </SocialCardShell>
    );
  }

  return (
    <SocialCardShell aspect={aspect} venueName={where} kicker="Stasera">
      <SocialPlate className="text-center">
        <p
          className="font-display text-[80px] font-bold uppercase leading-none tracking-[0.06em]"
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            textShadow:
              "0 3px 0 rgba(0,0,0,1), 0 0 48px rgba(233,30,140,0.5)",
          }}
        >
          {payload.staseraHeadline.trim() || "STASERA"}
        </p>
        <p className="mt-8 text-[36px] leading-snug text-white/85">
          {payload.staseraSub.trim() || "Gioca con noi"}
        </p>
        <p className="mt-12 text-[28px] font-bold uppercase tracking-[0.22em] text-pink-300">
          {where}
        </p>
      </SocialPlate>
    </SocialCardShell>
  );
}
