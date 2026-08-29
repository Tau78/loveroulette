"use client";

import { useEffect, useRef, useState } from "react";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";
import { AdminButton } from "@/components/admin/AdminButton";
import {
  CasaWidgetSessionGate,
} from "@/components/admin/casa/widgets/casa-widget-live";
import type { EventStats } from "@/lib/musicpro/session";
import type { CasaRipescaggio } from "@/lib/admin/casa-prep";
import { postDisplayCommand } from "@/lib/admin/animator-api";

export type WidgetExtractionProps = {
  /** Ship / top-N from prep. Default 3. */
  shipTopN?: number;
  /** Ripescaggio mode from prep. */
  ripescaggio?: CasaRipescaggio;
  /** Seconds for Salva sala window. Default 30. */
  salvaSec?: number;
  className?: string;
};

/**
 * Live extraction / elimination + optional «Salva sala» countdown (salvaSec).
 */
export function WidgetExtraction(props: WidgetExtractionProps) {
  return (
    <CasaWidgetSessionGate>
      <WidgetExtractionBody {...props} />
    </CasaWidgetSessionGate>
  );
}

function WidgetExtractionBody({
  shipTopN = 3,
  ripescaggio = "salva",
  salvaSec = 30,
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

  const [salvaLeft, setSalvaLeft] = useState<number | null>(null);
  const [salvaNote, setSalvaNote] = useState<string | null>(null);
  const running = salvaLeft != null && salvaLeft > 0;
  const endRef = useRef<number | null>(null);

  useEffect(() => {
    if (salvaLeft == null) return;
    if (salvaLeft <= 0) {
      setSalvaLeft(null);
      endRef.current = null;
      setSalvaNote("Finestra Salva sala chiusa.");
      void postDisplayCommand(eventCode, { type: "clear" }, pin).catch(() => {});
      return;
    }
    const id = window.setTimeout(() => {
      setSalvaLeft((n) => (n == null ? n : n - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [salvaLeft, eventCode, pin]);

  // Refresh projector plate while Salva is open (overlay auto-expires ~8s).
  useEffect(() => {
    if (!running || salvaLeft == null) return;
    const left = salvaLeft;
    const push = () => {
      void postDisplayCommand(
        eventCode,
        {
          type: "custom",
          title: "SALVA SALA",
          body: `${left} secondi — alza la mano`,
        },
        pin,
      ).catch(() => {});
    };
    push();
    const id = window.setInterval(push, 7000);
    return () => window.clearInterval(id);
  }, [running, salvaLeft, eventCode, pin]);

  async function startSalvaSala() {
    if (controlsDisabled || running) return;
    setSalvaNote(null);
    setSalvaLeft(salvaSec);
    endRef.current = Date.now() + salvaSec * 1000;
  }

  async function stopSalvaSala() {
    setSalvaLeft(null);
    endRef.current = null;
    setSalvaNote("Salva sala interrotta.");
    await postDisplayCommand(eventCode, { type: "clear" }, pin).catch(() => {});
  }

  const showSalva =
    ripescaggio === "salva" &&
    (runtimeState === "elimination" || runtimeState === "matching");

  return (
    <div className={["casa-live-widget", className].filter(Boolean).join(" ")}>
      <p className="casa-live-meta">Ship top {shipTopN}</p>

      {showSalva ? (
        <div className="casa-salva-box">
          <p className="casa-salva-label">Salva sala · {salvaSec}s</p>
          {running ? (
            <>
              <p className="casa-salva-count" aria-live="polite">
                {salvaLeft}s
              </p>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={controlsDisabled}
                onClick={() => void stopSalvaSala()}
              >
                Chiudi finestra
              </AdminButton>
            </>
          ) : (
            <AdminButton
              type="button"
              size="sm"
              className="w-full"
              disabled={controlsDisabled}
              onClick={() => void startSalvaSala()}
            >
              Apri Salva sala
            </AdminButton>
          )}
          {salvaNote ? <p className="casa-sub">{salvaNote}</p> : null}
        </div>
      ) : null}

      <AdminControlPanel
        variant="deck"
        eventCode={eventCode}
        runtimeState={runtimeState}
        animatorPin={pin}
        initialExtractionMode={extractionMode}
        disabled={controlsDisabled || running}
        onInvalidPin={() => openPinModal()}
        finalistCount={shipTopN}
        pairProgress={stats.pairProgress}
        onRefreshProgress={async (): Promise<{ stats: EventStats } | null> => {
          const next = await refreshSessionStats();
          return next ? { stats: next } : null;
        }}
      />
    </div>
  );
}
