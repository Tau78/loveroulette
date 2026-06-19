"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { animatorAuthHeaders } from "@/lib/admin/animator-api";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import type { GeneratoreMancheDocument } from "@/lib/generatore/types";
import { GENERATORE_FORMAT_ID } from "@/lib/generatore/types";

interface AdminGeneratorePanelProps {
  eventCode: string;
  animatorPin: string | null;
  disabled?: boolean;
  onImported?: () => void;
  variant?: "card" | "deck";
}

export function AdminGeneratorePanel({
  eventCode,
  animatorPin,
  disabled = false,
  onImported,
  variant = "deck",
}: AdminGeneratorePanelProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportManche = useCallback(async () => {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(
        `/api/events/${encodeURIComponent(eventCode)}/generatore`,
        { headers: animatorAuthHeaders(animatorPin) },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        document?: GeneratoreMancheDocument;
        error?: string;
      };

      if (!res.ok || !data.document) {
        throw new Error(data.error ?? "Export non riuscito.");
      }

      const blob = new Blob([JSON.stringify(data.document, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${eventCode.toUpperCase()}_manche.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage("Manche esportate.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore export.");
    } finally {
      setBusy(false);
    }
  }, [animatorPin, busy, disabled, eventCode]);

  const importManche = useCallback(
    async (file: File) => {
      if (disabled || busy) return;
      setBusy(true);
      setError(null);
      setMessage(null);

      try {
        const text = await file.text();
        const document = JSON.parse(text) as GeneratoreMancheDocument;

        if (document.format !== GENERATORE_FORMAT_ID) {
          throw new Error(
            `Formato non riconosciuto. Atteso: ${GENERATORE_FORMAT_ID}`,
          );
        }

        const res = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}/generatore`,
          {
            method: "POST",
            headers: animatorAuthHeaders(animatorPin),
            body: JSON.stringify({ action: "import_manche", document }),
          },
        );

        const data = (await res.json()) as {
          ok?: boolean;
          imported?: { mancheCount: number; questionCount: number };
          error?: string;
        };

        if (!res.ok || !data.ok) {
          throw new Error(data.error ?? "Import non riuscito.");
        }

        setMessage(
          `Import OK — ${data.imported?.mancheCount ?? 0} manche, ${data.imported?.questionCount ?? 0} domande.`,
        );
        onImported?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore import.");
      } finally {
        setBusy(false);
      }
    },
    [animatorPin, busy, disabled, eventCode, onImported],
  );

  return (
    <AdminPanelShell
      variant={variant}
      title="Generatore manche"
      subtitle="Import / export JSON · API POST /generatore"
      cardTitle="Generatore manche"
      cardDescription="Scambia le manche con l'editor esterno. Il Generatore comanda via API."
    >
      <p className="text-[10px] text-muted-foreground font-mono break-all">
        GET/POST /api/events/{eventCode}/generatore
      </p>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => void exportManche()}
        >
          <Download className="size-3.5" />
          Esporta manche
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-3.5" />
          Importa manche
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importManche(file);
            event.target.value = "";
          }}
        />
      </div>

      <p className="text-[10px] text-muted-foreground leading-snug">
        Comandi API: import_manche, export_manche, start_quiz, tick, advance,
        skip_phase, get_quiz_state. Header opzionale: X-Generatore-Key.
      </p>

      {message ? <p className="text-xs text-primary">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </AdminPanelShell>
  );
}
