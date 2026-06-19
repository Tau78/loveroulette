"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  PROJECTOR_REFERENCE,
  projectorPreviewScale,
} from "@/lib/display/embed";
import { PROJECTOR_CANVAS } from "@/lib/display/projector-canvas";
import { cn } from "@/lib/utils";

interface DisplayFixedCanvasProps {
  children: ReactNode;
  className?: string;
}

/**
 * Canvas 1920×1080 scalato uniformemente al viewport.
 * Stesso pipeline per proiettore standalone e iframe anteprima admin.
 */
export function DisplayFixedCanvas({
  children,
  className,
}: DisplayFixedCanvasProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      setScale(
        projectorPreviewScale(window.innerWidth, window.innerHeight),
      );
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0D0D12]",
        className,
      )}
      data-projector-viewport="1"
    >
      <div
        className="relative shrink-0 overflow-hidden"
        data-projector-canvas="1"
        data-projector-scale={scale.toFixed(4)}
        style={{
          width: PROJECTOR_CANVAS.width,
          height: PROJECTOR_CANVAS.height,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export { PROJECTOR_REFERENCE };
