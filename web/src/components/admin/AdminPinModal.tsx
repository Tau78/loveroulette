"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "@/components/admin/AdminButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useVisualViewportRect,
  visualViewportOverlayStyle,
} from "@/hooks/useVisualViewportRect";

interface AdminPinModalProps {
  open: boolean;
  error: string | null;
  verifying?: boolean;
  onSubmit: (pin: string) => void | Promise<void>;
}

export function AdminPinModal({
  open,
  error,
  verifying = false,
  onSubmit,
}: AdminPinModalProps) {
  const [value, setValue] = useState("");
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const viewport = useVisualViewportRect(open);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let timeoutId = 0;
    const raf = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        const field =
          inputRef.current ??
          document.getElementById("animator-pin");
        if (field instanceof HTMLInputElement) {
          field.focus({ preventScroll: true });
        }
      }, 80);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="z-[120] box-border flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm"
      style={visualViewportOverlayStyle(viewport)}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm max-h-full overflow-y-auto border-primary/20 bg-card text-white shadow-2xl shadow-primary/10"
      >
        <CardHeader>
          <CardTitle id={titleId}>Accesso animatore</CardTitle>
          <CardDescription className="text-white/80">
            Inserisci il PIN dell'evento per gestire fasi e proiettore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(value);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="animator-pin">PIN animatore</Label>
              <Input
                ref={inputRef}
                id="animator-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••••"
                value={value}
                disabled={verifying}
                className="bg-white/10 text-white"
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <AdminButton type="submit" className="w-full" disabled={verifying}>
              {verifying ? "Verifica…" : "Entra in regia"}
            </AdminButton>
          </form>
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
