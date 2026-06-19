"use client";

import { Maximize, Minimize } from "lucide-react";
import { useDisplayProjectorFullscreen } from "@/components/display/DisplayProjectorRoot";
import { cn } from "@/lib/utils";

export function DisplayFullscreenButton({ className }: { className?: string }) {
  const { isFullscreen, supported, toggle, controlsVisible } =
    useDisplayProjectorFullscreen();

  if (!supported) return null;

  return (
    <button
      type="button"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-white/85 backdrop-blur-sm transition-opacity hover:bg-black/50 hover:text-white",
        isFullscreen && !controlsVisible && "pointer-events-none opacity-0",
        className,
      )}
      onClick={() => void toggle()}
      title={
        isFullscreen
          ? "Esci da schermo intero (Esc o F)"
          : "Schermo intero (F o doppio clic)"
      }
      aria-label={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
      aria-pressed={isFullscreen}
    >
      {isFullscreen ? (
        <Minimize className="size-4" />
      ) : (
        <Maximize className="size-4" />
      )}
    </button>
  );
}
