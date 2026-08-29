"use client";

import { AdminPinModal } from "@/components/admin/AdminPinModal";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";

/** Renders `AdminPinModal` when the live session needs an animator PIN. */
export function CasaPinGate() {
  const { showPinModal, pinError, pinVerifying, submitPin } =
    useCasaLiveSession();

  return (
    <AdminPinModal
      open={showPinModal}
      error={pinError}
      verifying={pinVerifying}
      onSubmit={submitPin}
    />
  );
}
