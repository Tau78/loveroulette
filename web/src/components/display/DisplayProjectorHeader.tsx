"use client";

import type { ReactNode } from "react";
import { useDisplayProjectorFullscreen } from "@/components/display/DisplayProjectorRoot";
import { DisplayFullscreenButton } from "@/components/display/DisplayFullscreenButton";
import { cn } from "@/lib/utils";

export function DisplayProjectorHeader({
  embedMode,
  children,
  className,
}: {
  embedMode: boolean;
  children: ReactNode;
  className?: string;
}) {
  const { isFullscreen, controlsVisible } = useDisplayProjectorFullscreen();
  const hidden = isFullscreen && !controlsVisible;

  return (
    <header
      className={cn(
        "relative z-10 flex items-center justify-end gap-2 px-6 py-4 md:px-10 md:py-5 shrink-0",
        hidden && "pointer-events-none opacity-0",
        className,
      )}
    >
      {!embedMode ? <DisplayFullscreenButton /> : null}
      {children}
    </header>
  );
}
