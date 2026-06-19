"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminPanelShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
  variant?: "card" | "deck";
  cardTitle?: string;
  cardDescription?: string;
}

/** Wrapper compatto stile broadcast control deck. */
export function AdminDeckPanel({
  title,
  subtitle,
  actions,
  children,
  className,
  accent = false,
}: Omit<AdminPanelShellProps, "variant" | "cardTitle" | "cardDescription">) {
  return (
    <section
      className={cn(
        "rounded-lg border overflow-hidden",
        accent
          ? "border-primary/25 bg-primary/[0.04]"
          : "border-border/40 bg-card/50",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-border/30 bg-black/25 px-3 py-2">
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/75 line-clamp-2">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0 flex gap-1">{actions}</div> : null}
      </header>
      <div className="p-3 space-y-2.5">{children}</div>
    </section>
  );
}

export function AdminPanelShell({
  variant = "card",
  title,
  subtitle,
  cardTitle,
  cardDescription,
  actions,
  children,
  className,
  accent,
}: AdminPanelShellProps) {
  if (variant === "deck") {
    return (
      <AdminDeckPanel
        title={title}
        subtitle={subtitle ?? cardDescription}
        actions={actions}
        className={className}
        accent={accent}
      >
        {children}
      </AdminDeckPanel>
    );
  }

  return (
    <Card className={cn("border-border/50 bg-card/80", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{cardTitle ?? title}</CardTitle>
            {(cardDescription ?? subtitle) ? (
              <CardDescription>{cardDescription ?? subtitle}</CardDescription>
            ) : null}
          </div>
          {actions}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
