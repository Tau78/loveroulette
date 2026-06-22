"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DisplayFinalsSafeStageProps {
  children: ReactNode;
  className?: string;
}

/** Contenitore finali — rispetta min-h-0 e non invade la safe zone bassa del canvas. */
export function DisplayFinalsSafeStage({
  children,
  className,
}: DisplayFinalsSafeStageProps) {
  return (
    <div
      className={cn(
        "flex flex-1 min-h-0 w-full flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
