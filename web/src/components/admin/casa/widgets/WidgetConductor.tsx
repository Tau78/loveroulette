"use client";

import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { WidgetTransport } from "@/components/admin/casa/widgets/WidgetTransport";
import { shouldUseLiveGo, type CasaBeat } from "@/lib/admin/casa-avanti";

type Props = {
  beat: CasaBeat;
  localLabel: string;
  onLocalGo: () => void;
};

/**
 * One pulsantone: Casa opening beats stay local; from quiz onward the same
 * button drives the live session (Avvia quiz → matching → close).
 */
export function WidgetConductor({ beat, localLabel, onLocalGo }: Props) {
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
      <button type="button" className="casa-go" onClick={onLocalGo}>
        {localLabel}
      </button>
    </div>
  );
}
