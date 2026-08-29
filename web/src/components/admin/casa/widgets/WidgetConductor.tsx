"use client";

import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { WidgetTransport } from "@/components/admin/casa/widgets/WidgetTransport";

type Props = {
  /** Label for the local Casa beat GO (pre-quiz show flow). */
  localLabel: string;
  onLocalGo: () => void;
};

/**
 * Single conductor: live Transport GO when session+PIN are ready,
 * otherwise the classic Casa beat Avanti button.
 */
export function WidgetConductor({ localLabel, onLocalGo }: Props) {
  const { loading, pinReady, event, openPinModal, loadError } =
    useCasaLiveSession();

  const useLive = !loading && !loadError && pinReady && Boolean(event);

  if (useLive) {
    return <WidgetTransport />;
  }

  return (
    <div className="casa-conductor-local">
      <button type="button" className="casa-go" onClick={onLocalGo}>
        {localLabel}
      </button>
      {!loading && event && !pinReady ? (
        <button
          type="button"
          className="casa-hit casa-conductor-pin"
          onClick={() => openPinModal()}
        >
          PIN → GO live
        </button>
      ) : null}
      {loadError ? (
        <p className="casa-sub casa-conductor-note">
          Sessione non disponibile — GO locale (beat Casa)
        </p>
      ) : null}
    </div>
  );
}
