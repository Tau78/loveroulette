"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Monitor } from "lucide-react";
import { clientJoinUrl, postDisplayCommand, isInvalidAnimatorPinError } from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminQrPanelProps {
  eventCode: string;
  joinUrl?: string;
  animatorPin: string | null;
  disabled?: boolean;
  onInvalidPin?: () => void;
  variant?: "card" | "deck";
}

export function AdminQrPanel({
  eventCode,
  joinUrl,
  animatorPin,
  disabled = false,
  onInvalidPin,
  variant = "card",
}: AdminQrPanelProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resolvedJoinUrl = useMemo(
    () => joinUrl ?? clientJoinUrl(eventCode),
    [eventCode, joinUrl],
  );

  async function copyJoinUrl() {
    try {
      await navigator.clipboard.writeText(resolvedJoinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Non riesco a copiare il link. Selezionalo e copialo a mano.");
    }
  }

  async function showQrOnDisplay() {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postDisplayCommand(
        eventCode,
        { type: "show_qr" },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Comando proiettore non riuscito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      setSuccess("QR inviato al proiettore.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Invito giocatori"
      cardTitle="Invito giocatori"
      subtitle="Link o QR sul proiettore in sala"
      cardDescription="Condividi il link o mostra il QR grande sul proiettore in sala."
    >
      <div className="flex gap-1.5">
        <Input
          readOnly
          value={resolvedJoinUrl}
          className="font-mono text-[10px] h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={disabled}
          onClick={() => void copyJoinUrl()}
        >
          <Copy className="size-3.5" />
          {copied ? "OK" : "Copia"}
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-md border border-border/40 bg-background/30 p-3">
        <QRCodeSVG
          value={resolvedJoinUrl}
          size={variant === "deck" ? 96 : 180}
          bgColor="transparent"
          fgColor="currentColor"
          className="text-primary shrink-0"
        />
        <p className="text-[10px] text-muted-foreground leading-snug flex-1">
          Anteprima del codice che i giocatori scansionano dal telefono.
        </p>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-primary">{success}</p> : null}

      <Button
        size="sm"
        className="w-full"
        disabled={disabled || busy}
        onClick={() => void showQrOnDisplay()}
      >
        <Monitor className="size-3.5" />
        Mostra QR sul proiettore
      </Button>
    </AdminPanelShell>
  );
}
