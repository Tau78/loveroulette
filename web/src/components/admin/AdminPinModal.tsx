"use client";

import { useState } from "react";
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm border-primary/20 bg-card/95 shadow-2xl shadow-primary/10">
        <CardHeader>
          <CardTitle>Accesso animatore</CardTitle>
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
    </div>
  );
}
