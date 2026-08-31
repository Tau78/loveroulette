"use client";

import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { WidgetTransport } from "@/components/admin/casa/widgets/WidgetTransport";
import { shouldUseLiveGo, type CasaBeat } from "@/lib/admin/casa-avanti";

/**
 * One pulsantone: Casa opening beats stay local while lobby; after the live
 * session leaves lobby the same button drives quiz → matching → close.
 */
export function WidgetConductor({
  beat,
  localLabel,
  onLocalGo,
  localBusy = false,
  localError = null,
}: {
  beat: CasaBeat;
  localLabel: string;
  onLocalGo: () => void;
  localBusy?: boolean;
  localError?: string | null;
}) {
  const { loading, pinReady, event, loadError, runtimeState } =
    useCasaLiveSession();

  const live = !loading && !loadError && pinReady && Boolean(event);
  const useLive = shouldUseLiveGo({
    live,
    beat,
    runtimeState,
  });

  if (useLive) {
    return <WidgetTransport variant="go" />;
  }

  return (
    <div className="casa-conductor-local">
      <button
        type="button"
        className="casa-go"
        disabled={localBusy}
        onClick={onLocalGo}
      >
        {localBusy ? "…" : localLabel}
      </button>
      {localError ? (
        <p className="casa-sub casa-conductor-note" title={localError}>
          {localError}
        </p>
      ) : null}
    </div>
  );
}
