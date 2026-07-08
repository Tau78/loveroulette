"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  isInvalidAnimatorPinError,
  postResetEvent,
} from "@/lib/admin/animator-api";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AdminNewGamePanelProps {
  eventCode: string;
  animatorPin: string | null;
  disabled?: boolean;
  onReset?: () => void;
  onInvalidPin?: () => void;
  variant?: "card" | "deck";
}

export function AdminNewGamePanel({
  eventCode,
  animatorPin,
  disabled = false,
  onReset,
  onInvalidPin,
  variant = "card",
}: AdminNewGamePanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clearParticipants, setClearParticipants] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleReset() {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postResetEvent(
        eventCode,
        { clearParticipants },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Reset non riuscito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      setConfirmOpen(false);
      setSuccess(
        clearParticipants
          ? "Lobby — iscrizioni azzerate."
          : "Lobby — giocatori conservati (offline).",
      );
      onReset?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Reset"
      cardTitle="Nuova partita"
      collapsible={false}
    >
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="size-3.5 rounded border-input accent-primary"
          checked={clearParticipants}
          disabled={disabled || busy}
          onChange={(event) => setClearParticipants(event.target.checked)}
        />
        <Label className="cursor-pointer text-[10px] font-medium">
          Cancella iscritti
        </Label>
      </label>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || busy}
        onClick={() => {
          setError(null);
          setSuccess(null);
          setConfirmOpen(true);
        }}
      >
        <RotateCcw className="size-3.5" />
        Nuova partita
      </Button>

      <AdminConfirmDialog
        open={confirmOpen}
        title="Confermi reset?"
        description={
          clearParticipants
            ? "La serata torna in lobby e tutti gli iscritti verranno rimossi."
            : "La serata torna in lobby. I giocatori restano in lista ma segnati offline."
        }
        confirmLabel="Reset"
        variant="warning"
        busy={busy}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={() => void handleReset()}
      />

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-primary">{success}</p> : null}
    </AdminPanelShell>
  );
}
