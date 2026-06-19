"use client";

import { displayUrl as buildDisplayUrl } from "@/lib/display/embed";
import { cn } from "@/lib/utils";

interface ScaledProjectorPreviewProps {
  eventCode: string;
  className?: string;
}

/**
 * Iframe proiettore — il canvas 1920×1080 scala internamente (DisplayFixedCanvas).
 * L'anteprima riempie il contenitore: stesso rendering del proiettore standalone.
 */
export function ScaledProjectorPreview({
  eventCode,
  className,
}: ScaledProjectorPreviewProps) {
  const src =
    typeof window !== "undefined"
      ? buildDisplayUrl(eventCode, { embed: true, origin: window.location.origin })
      : buildDisplayUrl(eventCode, { embed: true });

  return (
    <div className={cn("relative size-full overflow-hidden bg-black", className)}>
      <iframe
        title="Anteprima proiettore"
        src={src}
        className="size-full border-0 bg-black"
        loading="lazy"
        scrolling="no"
      />
    </div>
  );
}
