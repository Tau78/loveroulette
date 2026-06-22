"use client";

import type { ReactNode } from "react";
import { PROJECTOR_FINALS_HEADER_HEIGHT_PX } from "@/lib/display/projector-canvas";
import { DisplayFinalsSafeStage } from "@/components/display/DisplayFinalsSafeStage";
import { cn } from "@/lib/utils";

interface DisplayFinalsZoneLayoutProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  /** Altezza fascia titolo in px (default 196). */
  headerHeightPx?: number;
}

/** Layout finali a due zone: header fisso + corpo che riempie senza overflow. */
export function DisplayFinalsZoneLayout({
  header,
  children,
  className,
  headerHeightPx = PROJECTOR_FINALS_HEADER_HEIGHT_PX,
}: DisplayFinalsZoneLayoutProps) {
  return (
    <DisplayFinalsSafeStage className={cn("h-full px-8 py-3", className)}>
      <div
        className="grid h-full min-h-0 w-full gap-3"
        style={{
          gridTemplateRows: `${headerHeightPx}px minmax(0, 1fr)`,
        }}
      >
        <header className="min-h-0 overflow-hidden flex items-stretch justify-center">
          {header}
        </header>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </DisplayFinalsSafeStage>
  );
}

interface DisplayFinalsHeaderBandProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

/** Piastra titolo compatta — resta dentro la fascia header (196px). */
export function DisplayFinalsHeaderBand({
  kicker,
  title,
  subtitle,
  className,
}: DisplayFinalsHeaderBandProps) {
  return (
    <div
      className={cn(
        "finals-header-band relative flex h-full w-full max-w-6xl flex-col items-center justify-center",
        "rounded-2xl border border-white/12 bg-black/82 text-center overflow-hidden",
        className,
      )}
    >
      {kicker ? (
        <p
          className="finals-header-kicker shrink-0 font-semibold uppercase tracking-[0.32em] text-white/85"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,1)" }}
        >
          {kicker}
        </p>
      ) : null}
      <h1
        className="finals-header-title font-display mt-0.5 font-bold uppercase text-white line-clamp-2"
        style={{
          fontFamily: "var(--font-display), serif",
          textShadow:
            "0 3px 0 rgba(0,0,0,1), 0 0 32px rgba(233,30,140,0.75)",
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className="finals-header-sub mt-0.5 shrink-0 uppercase tracking-[0.1em] text-white/80 line-clamp-2"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
