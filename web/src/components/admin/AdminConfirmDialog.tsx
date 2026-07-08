"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AdminConfirmVariant = "default" | "destructive" | "warning";

export interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: AdminConfirmVariant;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

function ConfirmIcon({ variant }: { variant: AdminConfirmVariant }) {
  if (variant === "destructive") {
    return (
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-destructive/15 ring-2 ring-destructive/35">
        <Trash2 className="size-5 text-destructive" aria-hidden />
      </div>
    );
  }

  if (variant === "warning") {
    return (
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-amber-500/15 ring-2 ring-amber-500/35">
        <AlertTriangle className="size-5 text-amber-200" aria-hidden />
      </div>
    );
  }

  return null;
}

export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  variant = "default",
  busy = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "w-full max-w-sm border-primary/20 bg-card/95 shadow-2xl shadow-primary/10",
          variant === "warning" && "border-amber-500/35",
          variant === "destructive" && "border-destructive/35",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader className="text-center">
          <ConfirmIcon variant={variant} />
          <CardTitle id={titleId}>{title}</CardTitle>
          <CardDescription id={descriptionId} className="text-pretty">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            className={cn(
              "w-full sm:w-auto",
              variant === "warning" &&
                "bg-amber-600 text-white hover:bg-amber-500",
            )}
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Attendere…" : confirmLabel}
          </Button>
        </CardContent>
      </Card>
    </div>,
    document.body,
  );
}
