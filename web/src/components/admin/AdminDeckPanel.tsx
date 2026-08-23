"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";
import { useAdminDeckAccordion } from "@/components/admin/AdminDeckAccordion";

function slugPanelId(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function panelTooltip(title: string, subtitle?: string): string {
  return subtitle ? `${title} — ${subtitle}` : title;
}

interface AdminPanelShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
  variant?: "card" | "deck" | "plain";
  cardTitle?: string;
  cardDescription?: string;
  /** Solo variant deck — sezione collassabile (default true). */
  collapsible?: boolean;
  /** Solo variant deck — aperta di default (default true). */
  defaultOpen?: boolean;
  /** Chiave persistenza sessionStorage (default: slug del title). */
  panelId?: string;
}

interface AdminDeckPanelProps
  extends Omit<
    AdminPanelShellProps,
    "variant" | "cardTitle" | "cardDescription"
  > {
  collapsible?: boolean;
  defaultOpen?: boolean;
  panelId?: string;
}

function readStoredOpen(storageKey: string, defaultOpen: boolean): boolean {
  if (typeof window === "undefined") return defaultOpen;
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored === "0") return false;
    if (stored === "1") return true;
  } catch {
    // ignore
  }
  return defaultOpen;
}

/** Wrapper compatto stile broadcast control deck. */
export function AdminDeckPanel({
  title,
  subtitle,
  actions,
  children,
  className,
  accent = false,
  collapsible = true,
  defaultOpen = true,
  panelId,
}: AdminDeckPanelProps) {
  const resolvedPanelId = panelId ?? slugPanelId(title);
  const storageKey = `admin-deck-panel:${resolvedPanelId}`;
  const accordion = useAdminDeckAccordion();
  const [localOpen, setLocalOpen] = useState(() =>
    readStoredOpen(storageKey, defaultOpen),
  );

  const usesAccordion = collapsible && accordion != null;
  const open = usesAccordion
    ? accordion.isOpen(resolvedPanelId)
    : collapsible
      ? localOpen
      : true;

  const tooltip = panelTooltip(title, subtitle);

  const toggle = () => {
    if (!collapsible) return;
    if (usesAccordion) {
      accordion.togglePanel(resolvedPanelId);
      return;
    }
    setLocalOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <section
      className={cn(
        "shrink-0 rounded-lg border flex flex-col min-h-0",
        open && usesAccordion && "flex-1 min-h-0",
        accent
          ? "border-primary/25 bg-primary/[0.04]"
          : "border-border/40 bg-card/50",
        className,
      )}
    >
      <header className="shrink-0 flex items-center justify-between gap-2 border-b border-border/30 bg-black/25 px-3 py-2">
        {collapsible ? (
          <button
            type="button"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 text-left",
              "rounded-sm transition-colors hover:bg-white/[0.03]",
              "-m-1 p-1",
            )}
            onClick={toggle}
            aria-expanded={open}
            aria-controls={`admin-deck-panel-body-${resolvedPanelId}`}
            title={tooltip}
          >
            <h3 className={cn(ADMIN_UI.section, "min-w-0 flex-1 truncate")}>{title}</h3>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-white/80 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : (
          <div className="min-w-0 flex-1" title={tooltip}>
            <h3 className={cn(ADMIN_UI.section, "truncate")}>{title}</h3>
          </div>
        )}

        {actions ? (
          <div className="shrink-0 flex gap-1" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        ) : null}
      </header>

      {(!collapsible || open) ? (
        <div
          id={`admin-deck-panel-body-${resolvedPanelId}`}
          className={cn(
            "p-2 space-y-2 overflow-y-auto overscroll-contain min-h-0",
            usesAccordion && open && "flex-1",
          )}
        >
          {children}
        </div>
      ) : null}
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
  collapsible,
  defaultOpen,
  panelId,
}: AdminPanelShellProps) {
  if (variant === "plain") {
    return <div className={cn("space-y-2", className)}>{children}</div>;
  }

  if (variant === "deck") {
    return (
      <AdminDeckPanel
        title={title}
        subtitle={subtitle ?? cardDescription}
        actions={actions}
        className={className}
        accent={accent}
        collapsible={collapsible}
        defaultOpen={defaultOpen}
        panelId={panelId}
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
