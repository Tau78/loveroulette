"use client";

import type { ReactNode } from "react";
import { AdminButton } from "@/components/admin/AdminButton";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";

/** Shared chrome for live CasaPad widgets inside `.casa-w-body`. */
export function CasaWidgetLiveShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["casa-w-live", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

/** PIN gate + loading / error states shared by live widgets. */
export function CasaWidgetSessionGate({
  children,
  requirePin = true,
}: {
  children: ReactNode;
  requirePin?: boolean;
}) {
  const {
    loading,
    loadError,
    pinReady,
    openPinModal,
    event,
  } = useCasaLiveSession();

  if (loading) {
    return (
      <CasaWidgetLiveShell>
        <p className="casa-w-live-hint">Caricamento sessione…</p>
      </CasaWidgetLiveShell>
    );
  }

  if (loadError || !event) {
    return (
      <CasaWidgetLiveShell>
        <p className="casa-w-live-error">
          {loadError ?? "Sessione non disponibile."}
        </p>
      </CasaWidgetLiveShell>
    );
  }

  if (requirePin && !pinReady) {
    return (
      <CasaWidgetLiveShell>
        <p className="casa-w-live-hint">Serve il PIN animatore.</p>
        <AdminButton
          type="button"
          size="sm"
          className="w-full"
          onClick={openPinModal}
        >
          Inserisci PIN
        </AdminButton>
      </CasaWidgetLiveShell>
    );
  }

  return <CasaWidgetLiveShell>{children}</CasaWidgetLiveShell>;
}

export function useCasaInvalidPinHandler() {
  const { rejectPin, openPinModal } = useCasaLiveSession();
  return () => {
    rejectPin("PIN non valido.");
    openPinModal();
  };
}
