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

export interface AdminAlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  dismissLabel?: string;
  variant?: "default" | "destructive";
  onDismiss: () => void;
}

/**
 * Viewport-fixed alert dialog (portal su document.body).
 * Usare al posto di window.alert per errori e avvisi coerenti con la UI admin.
 */
export function AdminAlertDialog({
  open,
  title,
  message,
  dismissLabel = "OK",
  variant = "default",
  onDismiss,
}: AdminAlertDialogProps) {
  const titleId = useId();
  const messageId = useId();

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
      if (event.key === "Escape" || event.key === "Enter") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onDismiss}
    >
      <Card
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-sm border-primary/20 bg-card/95 shadow-2xl shadow-primary/10"
        onClick={(event) => event.stopPropagation()}
      >
        <CardHeader>
          <CardTitle id={titleId}>{title}</CardTitle>
          <CardDescription
            id={messageId}
            className={
              variant === "destructive"
                ? "text-destructive"
                : "text-muted-foreground"
            }
          >
            {message}
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t-0 bg-transparent pt-0">
          <Button type="button" className="w-full" onClick={onDismiss}>
            {dismissLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>,
    document.body,
  );
}
