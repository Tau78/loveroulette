"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, Maximize, Minimize } from "lucide-react";
import type { EventState } from "@/lib/types";
import { runtimeStateLabel } from "@/lib/events";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/useFullscreen";

const PHASES: { id: EventState; label: string }[] = [
  { id: "lobby", label: "Lobby" },
  { id: "quiz", label: "Quiz" },
  { id: "matching", label: "Matching" },
  { id: "extraction", label: "Estrazione" },
  { id: "elimination", label: "Sfoltimento" },
  { id: "finals", label: "Finali" },
  { id: "winner", label: "Vincitore" },
];

interface AdminDashboardShellProps {
  eventCode: string;
  eventTitle: string;
  runtimeState: EventState;
  onlineCount: number;
  participantCount: number;
  children: ReactNode;
}

export function AdminDashboardShell({
  eventCode,
  eventTitle,
  runtimeState,
  onlineCount,
  participantCount,
  children,
}: AdminDashboardShellProps) {
  const currentPhaseIndex = PHASES.findIndex((phase) => phase.id === runtimeState);
  const displayPath = `/s/${eventCode}/display`;
  const phaseLabel = runtimeStateLabel(runtimeState);
  const { containerRef, isFullscreen, supported, toggle } = useFullscreen();

  return (
    <div
      ref={containerRef}
      data-admin-fullscreen={isFullscreen || undefined}
      className={cn(
        "min-h-screen flex flex-col theme-dark-fuchsia bg-background",
        isFullscreen && "h-screen overflow-hidden",
      )}
    >
      <header
        className={cn(
          "shrink-0 border-b border-border/40 bg-card/70 backdrop-blur-sm",
          isFullscreen && "py-1",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2",
            isFullscreen && "py-1.5 gap-x-3",
          )}
        >
          <Link
            href={`/s/${eventCode}`}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            ← {eventCode}
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold leading-tight truncate">{eventTitle}</h1>
            {!isFullscreen ? (
              <p className="text-[11px] text-muted-foreground">
                Pannello animatore
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-xs tabular-nums shrink-0">
            <span className="text-muted-foreground">
              <span className="text-base font-bold text-foreground">{onlineCount}</span>{" "}
              online
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <Link
              href={`/admin/${eventCode}/players`}
              className="text-muted-foreground hover:text-primary transition-colors rounded-md px-1 -mx-1 hover:bg-primary/5"
              title="Gestione giocatori"
            >
              <span className="font-semibold text-foreground">{participantCount}</span>{" "}
              iscritti
            </Link>
            <Badge
              variant="outline"
              className="border-primary/35 text-[11px] px-2 py-0 h-6 font-medium"
            >
              {phaseLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {supported ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-8 shrink-0"
                onClick={() => void toggle()}
                title={
                  isFullscreen
                    ? "Esci da schermo intero (Esc)"
                    : "Schermo intero (F)"
                }
                aria-label={
                  isFullscreen ? "Esci da schermo intero" : "Schermo intero"
                }
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="size-3.5" />
                ) : (
                  <Maximize className="size-3.5" />
                )}
              </Button>
            ) : null}
            <Link
              href={displayPath}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 text-xs shrink-0",
              )}
            >
              Proiettore
              <ExternalLink className="size-3 opacity-70" />
            </Link>
          </div>
        </div>

        <nav
          aria-label="Fasi serata"
          className={cn(
            "flex items-center gap-0.5 overflow-x-auto px-3 pb-2 scrollbar-thin",
            isFullscreen && "hidden sm:flex pb-1.5",
          )}
        >
          {PHASES.map((phase, index) => {
            const isActive = phase.id === runtimeState;
            const isPast = index < currentPhaseIndex;

            return (
              <div key={phase.id} className="flex items-center shrink-0">
                <div
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                    isActive &&
                      "bg-primary/20 text-primary ring-1 ring-primary/30",
                    !isActive &&
                      isPast &&
                      "text-muted-foreground/60 line-through decoration-muted-foreground/40",
                    !isActive &&
                      !isPast &&
                      "text-muted-foreground/90",
                  )}
                >
                  {phase.label}
                </div>
                {index < PHASES.length - 1 ? (
                  <ChevronRight className="size-3 mx-0.5 text-muted-foreground/30 shrink-0" />
                ) : null}
              </div>
            );
          })}
        </nav>
      </header>

      <main
        className={cn(
          "flex-1 min-h-0 p-3",
          isFullscreen && "p-2 overflow-hidden",
        )}
      >
        {children}
      </main>
    </div>
  );
}
