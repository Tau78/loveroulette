"use client";

import { ColorWave, type WaveMode } from "./ColorWave";
import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  waveMode: WaveMode;
  children: React.ReactNode;
  className?: string;
}

export function AmbientBackground({
  waveMode,
  children,
  className,
}: AmbientBackgroundProps) {
  return (
    <div
      className={cn("relative min-h-full flex-1 overflow-hidden", className)}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--background)" }}
        aria-hidden
      />
      <ColorWave mode={waveMode} />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
