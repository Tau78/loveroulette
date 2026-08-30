"use client";

import { CasaPad } from "@/components/admin/casa/CasaPad";
import { CasaPinGate } from "@/components/admin/casa/CasaPinGate";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";

/** PIN (or session load) first. CasaPad — and its audio — mounts only after unlock. */
export function CasaPlanciaGate({ eventCode }: { eventCode: string }) {
  const { loading, pinReady, pin, event } = useCasaLiveSession();
  const unlocked =
    !loading &&
    (event?.animatorPinRequired ? Boolean(pin) && pinReady : pinReady);

  return (
    <>
      <CasaPinGate />
      {unlocked ? (
        <CasaPad eventCode={eventCode} />
      ) : (
        <div className="casa-pin-wait" aria-busy="true">
          {loading
            ? "Carico la serata…"
            : "Inserisci il PIN per aprire la plancia."}
        </div>
      )}
    </>
  );
}
