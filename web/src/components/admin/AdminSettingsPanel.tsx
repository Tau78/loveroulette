"use client";

import { useState } from "react";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import {
  isInvalidAnimatorPinError,
  patchEventConfig,
} from "@/lib/admin/animator-api";
import { cn } from "@/lib/utils";

interface AdminSettingsPanelProps {
  eventCode: string;
  animatorPin: string | null;
  badgeRequired: boolean;
  disabled?: boolean;
  onInvalidPin?: () => void;
  onConfigChange?: (patch: { badgeRequired: boolean }) => void;
  variant?: "card" | "deck";
}

function SettingsSwitch({
  checked,
  disabled,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-primary bg-primary/80"
            : "border-border/60 bg-muted/40",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function AdminSettingsPanel({
  eventCode,
  animatorPin,
  badgeRequired,
  disabled = false,
  onInvalidPin,
  onConfigChange,
  variant = "deck",
}: AdminSettingsPanelProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setBadgeRequired(next: boolean) {
    if (disabled || busy || next === badgeRequired) return;

    setBusy(true);
    setError(null);

    try {
      const response = await patchEventConfig(
        eventCode,
        { badgeRequired: next },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Impossibile salvare le impostazioni.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      onConfigChange?.({ badgeRequired: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Impostazioni serata"
      subtitle="Preferenze visibili ai giocatori in tempo reale"
      cardTitle="Impostazioni"
      cardDescription="Configura obblighi e opzioni della serata."
      panelId="impostazioni-serata"
    >
      <SettingsSwitch
        checked={badgeRequired}
        disabled={disabled || busy}
        onChange={(next) => void setBadgeRequired(next)}
        label="Codice badge obbligatorio"
        description={
          badgeRequired
            ? "ON — il campo badge compare al join ed è richiesto."
            : "OFF — il badge non viene mostrato ai giocatori."
        }
      />

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
