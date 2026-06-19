"use client";

import { useState } from "react";
import { Megaphone, XCircle } from "lucide-react";
import { postDisplayCommand, isInvalidAnimatorPinError } from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminRegiaPanelProps {
  eventCode: string;
  animatorPin: string | null;
  disabled?: boolean;
  onInvalidPin?: () => void;
  variant?: "card" | "deck";
}

export function AdminRegiaPanel({
  eventCode,
  animatorPin,
  disabled = false,
  onInvalidPin,
  variant = "card",
}: AdminRegiaPanelProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function sendCustomMessage() {
    if (disabled || busy) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Scrivi un titolo per il messaggio.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postDisplayCommand(
        eventCode,
        {
          type: "custom",
          title: trimmedTitle,
          body: body.trim(),
        },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Invio al proiettore non riuscito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      setSuccess("Messaggio inviato al proiettore.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  async function clearOverlay() {
    if (disabled || busy) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await postDisplayCommand(
        eventCode,
        { type: "clear" },
        animatorPin,
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Cancellazione non riuscita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          onInvalidPin?.();
        }
        throw new Error(message);
      }

      setSuccess("Schermata del proiettore ripristinata.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanelShell
      variant={variant}
      title="Regia proiettore"
      cardTitle="Regia proiettore"
      subtitle="Messaggio overlay o ripristino vista gioco"
      cardDescription="Invia un messaggio personalizzato in sovrapposizione sullo schermo grande, oppure torna alla vista di gioco."
    >
      <div className="space-y-2">
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
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? <p className="text-xs text-primary">{success}</p> : null}

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
    </AdminPanelShell>
  );
}
