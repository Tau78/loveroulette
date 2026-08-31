"use client";

import {
  SIGLA_WARN_LINE_1,
  SIGLA_WARN_LINE_2,
  SIGLA_WARN_TEXT_CLASS,
} from "@/lib/display/sigla-warn";
import { cn } from "@/lib/utils";

/** Hold pre-sigla: due righe in piastra, testo solido (niente gradient clip). */
export function DisplaySiglaWarn({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full max-w-5xl text-center", className)}>
      <div
        className="pointer-events-none absolute -inset-x-6 -inset-y-4 md:-inset-x-10 md:-inset-y-6 rounded-[2rem] bg-gradient-to-b from-black/80 via-black/70 to-black/80 backdrop-blur-md border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        aria-hidden
      />
      <p
        className={cn(
          "relative z-10 px-8 py-6 md:px-12 md:py-8",
          SIGLA_WARN_TEXT_CLASS,
        )}
        style={{
          textShadow:
            "0 0 24px rgba(233,30,140,0.55), 0 2px 12px rgba(0,0,0,0.95)",
        }}
      >
        {SIGLA_WARN_LINE_1}
        <br />
        {SIGLA_WARN_LINE_2}
      </p>
    </div>
  );
}
