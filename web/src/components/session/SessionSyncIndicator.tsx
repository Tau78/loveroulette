"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";
import type { SessionSyncStatus } from "@/lib/musicpro/session-sync";
import { cn } from "@/lib/utils";

interface SessionSyncIndicatorProps {
  status: SessionSyncStatus;
  className?: string;
  /** Mostra badge anche in stato live (default: solo degraded/stale/resyncing). */
  alwaysVisible?: boolean;
}

const LABELS: Record<SessionSyncStatus, string> = {
  live: "Sincronizzato",
  degraded: "Sync lenta",
  stale: "Riconnessione…",
  resyncing: "Allineamento…",
};

export function SessionSyncIndicator({
  status,
  className,
  alwaysVisible = false,
}: SessionSyncIndicatorProps) {
  if (status === "live" && !alwaysVisible) return null;

  const isBusy = status === "resyncing" || status === "stale";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
        status === "live" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        status === "degraded" && "bg-amber-500/15 text-amber-800 dark:text-amber-400",
        (status === "stale" || status === "resyncing") &&
          "bg-rose-500/15 text-rose-800 dark:text-rose-400",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {isBusy ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : status === "degraded" ? (
        <Wifi className="size-3" aria-hidden />
      ) : (
        <WifiOff className="size-3" aria-hidden />
      )}
      {LABELS[status]}
    </div>
  );
}
