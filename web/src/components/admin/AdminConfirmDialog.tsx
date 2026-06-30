"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface AdminConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Viewport-fixed confirm dialog (portal su document.body).
 * Usare al posto di window.confirm — resta visibile anche con liste lunghe su mobile.
 */
export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={busy ? undefined : onCancel}
    >
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="w-full max-w-sm border-primary/20 bg-card/95 shadow-2xl shadow-primary/10"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader>
          <CardTitle id={titleId}>{title}</CardTitle>
          {description ? (
            <CardDescription id={descId}>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardFooter className="flex gap-2 border-t-0 bg-transparent pt-0">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="flex-1"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? "Attendere…" : confirmLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body,
  );
}
