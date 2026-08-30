"use client";

import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { SOCIAL_ASPECT_PX, type SocialAspect } from "@/lib/social/types";
import { cn } from "@/lib/utils";

const SHADOW =
  "0 2px 0 rgba(0,0,0,0.95), 0 0 28px rgba(0,0,0,0.75), 0 0 24px rgba(233,30,140,0.35)";

export function SocialCardShell({
  aspect,
  venueName,
  kicker,
  children,
  className,
}: {
  aspect: SocialAspect;
  venueName: string;
  kicker: string;
  children: ReactNode;
  className?: string;
}) {
  const { w, h } = SOCIAL_ASPECT_PX[aspect];
  return (
    <div
      className={cn(
        "relative overflow-hidden text-white",
        "bg-[#0D0D12]",
        className,
      )}
      style={{ width: w, height: h }}
      data-theme="dark_fuchsia"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(233,30,140,0.38), transparent 60%), radial-gradient(ellipse 70% 50% at 80% 100%, rgba(255,71,87,0.22), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex h-full flex-col px-[72px] py-[80px]">
        <header className="flex items-center justify-between gap-4">
          <p
            className="text-[28px] font-bold uppercase tracking-[0.28em] text-pink-300"
            style={{ textShadow: SHADOW }}
          >
            {kicker}
          </p>
          <div className="flex items-center gap-2 font-display text-[32px] font-bold uppercase tracking-[0.18em]">
            <span style={{ textShadow: SHADOW }}>Love</span>
            <Heart
              className="size-7 fill-pink-500/50 text-pink-400"
              strokeWidth={1.5}
              aria-hidden
            />
            <span style={{ textShadow: SHADOW }}>Roulette</span>
          </div>
        </header>

        <div className="mt-10 flex min-h-0 flex-1 flex-col justify-center">
          {children}
        </div>

        <footer className="mt-8 flex items-end justify-between gap-4 border-t border-white/15 pt-6">
          <p
            className="text-[26px] font-semibold text-white/85"
            style={{ textShadow: SHADOW }}
          >
            {venueName.trim() || "Serata live"}
          </p>
          <p className="text-[22px] uppercase tracking-[0.2em] text-white/45">
            nick in sala · no email
          </p>
        </footer>
      </div>
    </div>
  );
}

export function SocialPlate({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute -inset-x-4 -inset-y-5 rounded-[2rem] border border-white/12 bg-gradient-to-b from-black/80 via-black/70 to-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-md"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
