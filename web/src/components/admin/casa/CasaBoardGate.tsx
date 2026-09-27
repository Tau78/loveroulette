"use client";

import { CasaPadBoard } from "@/components/admin/casa/CasaPadBoard";
import { CasaPinGate } from "@/components/admin/casa/CasaPinGate";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";

/** PIN first. Board mounts only after unlock — parallel to CasaPlanciaGate. */
export function CasaBoardGate({ eventCode }: { eventCode: string }) {
  const { loading, pinReady, pin, event } = useCasaLiveSession();
  const unlocked =
    !loading &&
    (event?.animatorPinRequired ? Boolean(pin) && pinReady : pinReady);

  return (
    <>
      <CasaPinGate />
      {unlocked ? (
        <CasaPadBoard eventCode={eventCode} />
      ) : (
        <div className="casa-pin-wait" aria-busy="true">
          {loading
            ? "Carico l'evento…"
            : "Inserisci il PIN per aprire la plancia."}
        </div>
      )}
    </>
  );
}
