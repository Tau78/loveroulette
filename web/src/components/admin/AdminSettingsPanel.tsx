"use client";

import { useState } from "react";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import {
  isInvalidAnimatorPinError,
  patchEventConfig,
} from "@/lib/admin/animator-api";
import { useTypeScalePrefs } from "@/hooks/useTypeScalePrefs";
import { clampTypeScale } from "@/lib/display/type-scale";
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
    <div
      className="flex items-center justify-between gap-3"
      title={description}
    >
      <p className="text-sm font-medium text-white">{label}</p>
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

function ScaleStepper({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3" title={description}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled={disabled || value <= 0.8}
          onClick={() => onChange(clampTypeScale(value - 0.1))}
          className="size-7 rounded-md border border-border/60 bg-muted/40 text-sm font-bold disabled:opacity-40"
          aria-label={`${label} meno`}
        >
          −
        </button>
        <span className="w-12 text-center text-sm font-semibold tabular-nums">
          {Math.round(value * 100)}%
        </span>
        <button
          type="button"
          disabled={disabled || value >= 1.5}
          onClick={() => onChange(clampTypeScale(value + 0.1))}
          className="size-7 rounded-md border border-border/60 bg-muted/40 text-sm font-bold disabled:opacity-40"
          aria-label={`${label} più`}
        >
          +
        </button>
      </div>
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
  const { prefs, updatePrefs } = useTypeScalePrefs(eventCode);

  async function patchConfig(
    body: {
      badgeRequired?: boolean;
      displayTypeScale?: number;
      planciaTypeScale?: number;
    },
  ) {
    if (disabled || busy) return false;

    setBusy(true);
    setError(null);

    try {
      const response = await patchEventConfig(eventCode, body, animatorPin);

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
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function setBadgeRequired(next: boolean) {
    if (next === badgeRequired) return;
    const ok = await patchConfig({ badgeRequired: next });
    if (ok) onConfigChange?.({ badgeRequired: next });
  }

  async function setDisplayScale(next: number) {
    const display = clampTypeScale(next);
    updatePrefs({ display });
    await patchConfig({ displayTypeScale: display });
  }

  async function setPlanciaScale(next: number) {
    const plancia = clampTypeScale(next);
    updatePrefs({ plancia });
    await patchConfig({ planciaTypeScale: plancia });
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Impostazioni"
      cardDescription="Preferenze evento visibili ai giocatori in tempo reale."
      panelId="impostazioni-serata"
    >
      <div className="space-y-4">
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

        <ScaleStepper
          label="Dimensione caratteri Schermo"
          description="Scala tipografia sul proiettore (default 120%)."
          value={prefs.display}
          disabled={disabled || busy}
          onChange={(next) => void setDisplayScale(next)}
        />

        <ScaleStepper
          label="Dimensione Caratteri Plancia"
          description="Scala tipografia e controlli sulla plancia Casa."
          value={prefs.plancia}
          disabled={disabled || busy}
          onChange={(next) => void setPlanciaScale(next)}
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
