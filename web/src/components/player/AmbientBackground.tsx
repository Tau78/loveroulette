"use client";

import { ColorWave, type WaveMode } from "./ColorWave";

interface AmbientBackgroundProps {
  waveMode: WaveMode;
  children: React.ReactNode;
  className?: string;
}

export function AmbientBackground({
  waveMode,
  children,
  className = "",
}: AmbientBackgroundProps) {
  return (
    <div className={`relative min-h-full overflow-hidden ${className}`}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--background)" }}
        aria-hidden
      />
      <ColorWave mode={waveMode} />
      <div className="relative z-10 min-h-full">{children}</div>
    </div>
  );
}
