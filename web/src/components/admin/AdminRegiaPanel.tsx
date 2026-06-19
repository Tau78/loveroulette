"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Megaphone, Monitor, XCircle } from "lucide-react";
import {
  clientJoinUrl,
  postDisplayCommand,
  isInvalidAnimatorPinError,
} from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { AdminRegiaLocalMediaSection } from "@/components/admin/AdminRegiaLocalMediaSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminRegiaPanelProps {
  eventCode: string;
  joinUrl?: string;
  animatorPin: string | null;
  disabled?: boolean;
  onInvalidPin?: () => void;
  variant?: "card" | "deck";
}

export function AdminRegiaPanel({
  eventCode,
  joinUrl,
  animatorPin,
  disabled = false,
  onInvalidPin,
  variant = "card",
}: AdminRegiaPanelProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
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

  async function runDisplayCommand(
    command: Parameters<typeof postDisplayCommand>[1],
    successMessage: string,
  ) {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postDisplayCommand(eventCode, command, animatorPin);

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

      setSuccess(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function showQrOnDisplay() {
    await runDisplayCommand({ type: "show_qr" }, "QR inviato al proiettore.");
  }

  async function sendCustomMessage() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Scrivi un titolo per il messaggio.");
      return;
    }

    await runDisplayCommand(
      {
        type: "custom",
        title: trimmedTitle,
        body: body.trim(),
      },
      "Messaggio inviato al proiettore.",
    );
  }

  async function clearOverlay() {
    await runDisplayCommand(
      { type: "clear" },
      "Schermata del proiettore ripristinata.",
    );
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Regia"
      cardTitle="Regia"
      subtitle="Invito · QR · media locale · messaggi sul proiettore"
      cardDescription="Condividi il link, mostra video o immagini da cartella locale, oppure invia un messaggio overlay."
    >
      <div className="space-y-4">
        <section className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
            Invito giocatori
          </p>

          <div className="flex gap-1.5">
            <Input
              readOnly
              value={resolvedJoinUrl}
              className="h-8 font-mono text-[10px]"
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
              className="shrink-0 text-primary"
            />
            <p className="flex-1 text-[10px] leading-snug text-muted-foreground">
              Anteprima del codice che i giocatori scansionano dal telefono.
            </p>
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={disabled || busy}
            onClick={() => void showQrOnDisplay()}
          >
            <Monitor className="size-3.5" />
            Mostra QR sul proiettore
          </Button>
        </section>

        <div className="border-t border-border/30" aria-hidden />

        <AdminRegiaLocalMediaSection
          eventCode={eventCode}
          disabled={disabled || busy}
        />

        <div className="border-t border-border/30" aria-hidden />

        <section className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">
            Messaggio overlay
          </p>

          <div className="space-y-1">
            <Label htmlFor="regia-title" className="text-xs">
              Titolo
            </Label>
            <Input
              id="regia-title"
              placeholder="Es. Pausa di 5 minuti"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              disabled={disabled || busy}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="regia-body" className="text-xs">
              Testo (facoltativo)
            </Label>
            <Input
              id="regia-body"
              placeholder="Es. Torniamo tra poco!"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={280}
              disabled={disabled || busy}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              disabled={disabled || busy}
              onClick={() => void sendCustomMessage()}
            >
              <Megaphone className="size-3.5" />
              Invia al proiettore
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || busy}
              onClick={() => void clearOverlay()}
            >
              <XCircle className="size-3.5" />
              Cancella overlay
            </Button>
          </div>
        </section>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-primary">{success}</p> : null}
    </AdminPanelShell>
  );
}
