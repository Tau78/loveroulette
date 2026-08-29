"use client";

import { ADMIN_SOUNDTRACK_AUTO_UNLOCK } from "@/components/admin/AdminAudioPanel";
import { AdminPreflightPanel } from "@/components/admin/AdminPreflightPanel";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { CasaWidgetSessionGate } from "@/components/admin/casa/widgets/casa-widget-live";

/**
 * Preflight live — semafori domande / audio / online / iscritti.
 * Contesto: eventCode, stats, soundtrackUnlocked (PIN non obbligatorio per sola lettura).
 */
export function WidgetPreflight() {
  return (
    <CasaWidgetSessionGate requirePin={false}>
      <WidgetPreflightBody />
    </CasaWidgetSessionGate>
  );
}

function WidgetPreflightBody() {
  const {
    eventCode,
    stats,
    soundtrackUnlocked,
    controlsDisabled,
    pinReady,
    openPinModal,
  } = useCasaLiveSession();

  return (
    <div className="casa-w-live-stack">
      {!pinReady ? (
        <button
          type="button"
          className="casa-w-live-pin-link"
          onClick={openPinModal}
        >
          PIN non inserito — tocca per sbloccare i controlli
        </button>
      ) : null}
      <AdminPreflightPanel
        variant="deck"
        eventCode={eventCode}
        onlineCount={stats.onlineCount}
        participantCount={stats.participantCount}
        soundtrackUnlocked={soundtrackUnlocked}
        soundtrackAutoUnlock={ADMIN_SOUNDTRACK_AUTO_UNLOCK}
        disabled={controlsDisabled}
      />
    </div>
  );
}
