"use client";

import { useMemo, useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Megaphone, Monitor, XCircle } from "lucide-react";
import {
  clientJoinUrl,
  postDisplayCommand,
  isInvalidAnimatorPinError,
} from "@/lib/admin/animator-api";
import { AdminRegiaLocalMediaSection } from "@/components/admin/AdminRegiaLocalMediaSection";
import { AdminButton } from "@/components/admin/AdminButton";
import { Input } from "@/components/ui/input";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";
import { cn } from "@/lib/utils";

interface AdminRegiaPanelProps {
  eventCode: string;
  joinUrl?: string;
  animatorPin: string | null;
  disabled?: boolean;
  onInvalidPin?: () => void;
  variant?: "card" | "deck";
  /** Blocco manche / domande (ex tab Domande). */
  mancheSlot?: ReactNode;
}

export function AdminRegiaPanel({
  eventCode,
  joinUrl,
  animatorPin,
  disabled = false,
  onInvalidPin,
  variant = "card",
  mancheSlot,
}: AdminRegiaPanelProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOnDisplay, setQrOnDisplay] = useState(false);
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

  async function toggleQrOnDisplay() {
    if (qrOnDisplay) {
      await runDisplayCommand({ type: "clear" }, "QR nascosto dal proiettore.");
      setQrOnDisplay(false);
      return;
    }
    await runDisplayCommand({ type: "show_qr" }, "QR inviato al proiettore.");
    setQrOnDisplay(true);
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
    setQrOnDisplay(false);
  }

  return (
    <div
      className={cn(
        "casa-board-regia-stack space-y-3",
        variant === "deck" && "pb-1",
      )}
    >
      {mancheSlot ? <div className="casa-board-regia-manche">{mancheSlot}</div> : null}

      <section className="casa-regia-block space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Sala · join
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="shrink-0 rounded border border-border/40 bg-background/40 p-1"
            title="QR join"
          >
            <QRCodeSVG
              value={resolvedJoinUrl}
              size={48}
              bgColor="transparent"
              fgColor="currentColor"
              className="text-primary"
            />
          </div>
          <Input
            readOnly
            value={resolvedJoinUrl}
            title={resolvedJoinUrl}
            className={cn(
              ADMIN_UI.input,
              "h-8 w-[min(100%,16rem)] shrink font-mono text-[10px]",
            )}
          />
          <AdminButton
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2"
            disabled={disabled}
            onClick={() => void copyJoinUrl()}
          >
            <Copy className="size-3.5" />
            {copied ? "OK" : "Copia"}
          </AdminButton>
          <AdminButton
            size="sm"
            variant={qrOnDisplay ? "secondary" : "outline"}
            className="h-8 shrink-0 px-2 text-[11px]"
            disabled={disabled || busy}
            aria-pressed={qrOnDisplay}
            onClick={() => void toggleQrOnDisplay()}
          >
            <Monitor className="size-3" />
            {qrOnDisplay ? "Nascondi QR" : "QR maxi"}
          </AdminButton>
        </div>
      </section>

      <AdminRegiaLocalMediaSection
        eventCode={eventCode}
        disabled={disabled || busy}
      />

      <section className="casa-regia-block space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Overlay
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Input
            id="regia-title"
            placeholder="Titolo"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            disabled={disabled || busy}
            className={cn(ADMIN_UI.input, "h-8 w-36 shrink-0")}
          />
          <Input
            id="regia-body"
            placeholder="Testo (opz.)"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={280}
            disabled={disabled || busy}
            className={cn(ADMIN_UI.input, "h-8 w-44 shrink-0")}
          />
          <AdminButton
            size="sm"
            className="h-8 shrink-0 px-2"
            disabled={disabled || busy}
            onClick={() => void sendCustomMessage()}
          >
            <Megaphone className="size-3.5" />
            Invia
          </AdminButton>
          <AdminButton
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2"
            disabled={disabled || busy}
            onClick={() => void clearOverlay()}
          >
            <XCircle className="size-3.5" />
            Clear
          </AdminButton>
        </div>
      </section>

      {error ? <p className={ADMIN_UI.error}>{error}</p> : null}
      {success ? <p className={ADMIN_UI.success}>{success}</p> : null}
    </div>
  );
}
