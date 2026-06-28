"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  isInvalidAnimatorPinError,
  postResetEvent,
} from "@/lib/admin/animator-api";
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
  const [confirming, setConfirming] = useState(false);

  async function handleReset() {
    if (disabled || busy) return;

    if (!confirming) {
      setConfirming(true);
      setError(null);
      setSuccess(null);
      return;
    }

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

      setConfirming(false);
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

  function handleCancel() {
    setConfirming(false);
    setError(null);
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

      {confirming ? (
        <p className="text-[10px] text-amber-200/90 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1">
          Confermi reset?
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant={confirming ? "default" : "outline"}
          size="sm"
          disabled={disabled || busy}
          onClick={() => void handleReset()}
        >
          <RotateCcw className="size-3.5" />
          {busy
            ? "Reset…"
            : confirming
              ? "Conferma"
              : "Nuova partita"}
        </Button>
        {confirming ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={handleCancel}
          >
            Annulla
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-primary">{success}</p> : null}
    </AdminPanelShell>
  );
}
