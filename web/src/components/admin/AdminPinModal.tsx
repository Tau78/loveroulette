"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center">
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm border-primary/20 bg-card/95 shadow-2xl shadow-primary/10"
      >
        <CardHeader>
          <CardTitle id={titleId}>Accesso animatore</CardTitle>
          <CardDescription>
            Inserisci il PIN della serata per gestire fasi e proiettore.
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
                id="animator-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                placeholder="••••••"
                value={value}
                disabled={verifying}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? "Verifica…" : "Entra in regia"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
