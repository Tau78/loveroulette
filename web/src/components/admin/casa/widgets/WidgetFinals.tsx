"use client";

import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { AdminFinalsPanel } from "@/components/admin/AdminFinalsPanel";

export type WidgetFinalsProps = {
  className?: string;
};

/**
 * Live finals regia — wraps AdminFinalsPanel (includes AdminChallengeRegia).
 */
export function WidgetFinals({ className }: WidgetFinalsProps) {
  const {
    eventCode,
    pin,
    openPinModal,
    controlsDisabled,
    finalsShow,
    voting,
    applyFinalsUpdate,
  } = useCasaLiveSession();

  return (
    <div className={["casa-live-widget", className].filter(Boolean).join(" ")}>
      <AdminFinalsPanel
        variant="deck"
        eventCode={eventCode}
        animatorPin={pin}
        disabled={controlsDisabled}
        finalsShow={finalsShow}
        voting={voting}
        onInvalidPin={() => openPinModal()}
        onFinalsChange={(payload) => applyFinalsUpdate(payload)}
      />
    </div>
  );
}
