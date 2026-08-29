"use client";

import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";
import type { EventStats } from "@/lib/musicpro/session";

export type WidgetExtractionProps = {
  /** Ship / top-N from prep (backend eliminate still uses 3). Default 3. */
  shipTopN?: number;
  className?: string;
};

/**
 * Live extraction / elimination — wraps AdminControlPanel (Estrai / Elimina / Top 3).
 */
export function WidgetExtraction({
  shipTopN = 3,
  className,
}: WidgetExtractionProps) {
  const {
    eventCode,
    pin,
    openPinModal,
    controlsDisabled,
    runtimeState,
    extractionMode,
    stats,
    refreshSessionStats,
  } = useCasaLiveSession();

  return (
    <div className={["casa-live-widget", className].filter(Boolean).join(" ")}>
      {shipTopN !== 3 ? (
        <p className="casa-live-meta">Ship top {shipTopN}</p>
      ) : null}
      <AdminControlPanel
        variant="deck"
        eventCode={eventCode}
        runtimeState={runtimeState}
        animatorPin={pin}
        initialExtractionMode={extractionMode}
        disabled={controlsDisabled}
        onInvalidPin={() => openPinModal()}
        pairProgress={stats.pairProgress}
        onRefreshProgress={async (): Promise<{ stats: EventStats } | null> => {
          const next = await refreshSessionStats();
          return next ? { stats: next } : null;
        }}
      />
    </div>
  );
}
