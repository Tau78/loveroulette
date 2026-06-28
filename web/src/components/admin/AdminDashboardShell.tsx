"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ExternalLink,
  KeyRound,
  Maximize,
  Megaphone,
  Minimize,
  Settings,
  SlidersHorizontal,
  Users,
  Wifi,
} from "lucide-react";
import type { EventState } from "@/lib/types";
import type { SessionSyncStatus } from "@/lib/musicpro/session-sync";
import { SessionSyncIndicator } from "@/components/session/SessionSyncIndicator";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFullscreen } from "@/hooks/useFullscreen";

const PHASES: { id: EventState; short: string }[] = [
  { id: "lobby", short: "Lobby" },
  { id: "quiz", short: "Quiz" },
  { id: "matching", short: "Match" },
  { id: "extraction", short: "Estr." },
  { id: "elimination", short: "Sfol." },
  { id: "finals", short: "Fin." },
  { id: "winner", short: "Win" },
];

export type AdminConsoleTab = "controlli" | "regia" | "impostazioni";

const SIDEBAR_TABS: {
  id: AdminConsoleTab;
  label: string;
  icon: typeof SlidersHorizontal;
}[] = [
  { id: "controlli", label: "Deck", icon: SlidersHorizontal },
  { id: "regia", label: "Regia", icon: Megaphone },
  { id: "impostazioni", label: "Setup", icon: Settings },
];

interface AdminDashboardShellProps {
  eventCode: string;
  eventTitle: string;
  runtimeState: EventState;
  onlineCount: number;
  participantCount: number;
  syncStatus?: SessionSyncStatus;
  activeTab: AdminConsoleTab;
  onTabChange: (tab: AdminConsoleTab) => void;
  pinReady?: boolean;
  pinRequired?: boolean;
  onChangePin?: () => void;
  program: ReactNode;
  deck: ReactNode;
  transport: ReactNode;
}

export function AdminDashboardShell({
  eventCode,
  eventTitle,
  runtimeState,
  onlineCount,
  participantCount,
  syncStatus,
  activeTab,
  onTabChange,
  pinReady = true,
  pinRequired = false,
  onChangePin,
  program,
  deck,
  transport,
}: AdminDashboardShellProps) {
  const currentPhaseIndex = PHASES.findIndex((phase) => phase.id === runtimeState);
  const displayPath = `/s/${eventCode}/display`;
  const { containerRef, isFullscreen, supported, toggle } = useFullscreen();

  return (
    <div
      ref={containerRef}
      data-admin-fullscreen={isFullscreen || undefined}
      className="theme-dark-fuchsia w-screen h-screen overflow-hidden bg-background flex flex-col"
    >
      <header className="shrink-0 h-11 border-b border-border/40 bg-card/80 backdrop-blur-sm px-2 flex items-center gap-2">
        <Link
          href={`/s/${eventCode}`}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          title={eventCode}
        >
          {eventCode}
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-xs font-bold">{eventTitle}</h1>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1 rounded-md border border-border/40 bg-black/25 px-2 h-7"
            title="Online"
          >
            <Wifi className="size-3 text-emerald-400" />
            <span className="text-xs font-bold tabular-nums">{onlineCount}</span>
          </div>

          <Link
            href={`/admin/${eventCode}/players`}
            className="flex items-center gap-1 rounded-md border border-border/40 bg-black/25 px-2 h-7 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
            title="Giocatori"
          >
            <Users className="size-3" />
            <span className="text-xs font-bold tabular-nums">{participantCount}</span>
          </Link>

          {syncStatus ? <SessionSyncIndicator status={syncStatus} /> : null}

          {pinRequired && pinReady && onChangePin ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7"
              onClick={onChangePin}
              title="Cambia PIN"
            >
              <KeyRound className="size-3.5" />
            </Button>
          ) : null}

          {supported ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7"
              onClick={() => void toggle()}
              title={isFullscreen ? "Esci fullscreen" : "Fullscreen"}
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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 px-2 text-[10px] gap-1")}
          >
            PGM
            <ExternalLink className="size-3 opacity-70" />
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-[2.75rem_minmax(0,1fr)_min(22rem,28vw)] overflow-hidden">
        <nav
          aria-label="Sezioni"
          className="border-r border-border/40 bg-card/40 flex flex-col items-center py-2 gap-1"
        >
          {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-10 h-10 rounded-md transition-colors",
                activeTab === id
                  ? "bg-primary/20 text-primary ring-1 ring-primary/35"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
              title={label}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon className="size-4" />
              <span className="text-[8px] font-semibold uppercase tracking-wide leading-none">
                {label}
              </span>
            </button>
          ))}

          <div className="mt-auto flex flex-col items-center gap-0.5 px-0.5 w-full">
            {PHASES.map((phase, index) => {
              const isActive = phase.id === runtimeState;
              const isPast = index < currentPhaseIndex;
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "w-full text-center rounded px-0.5 py-0.5 text-[7px] font-medium leading-tight truncate",
                    isActive && "bg-primary/25 text-primary",
                    !isActive && isPast && "text-muted-foreground/40 line-through",
                    !isActive && !isPast && "text-muted-foreground/60",
                  )}
                  title={phase.short}
                >
                  {phase.short}
                </div>
              );
            })}
          </div>
        </nav>

        <section
          aria-label="Program monitor"
          className="min-w-0 min-h-0 p-2 overflow-hidden flex flex-col"
        >
          {program}
        </section>

        <aside
          aria-label="Control deck"
          className="min-w-0 min-h-0 border-l border-border/40 bg-card/30 overflow-y-auto overflow-x-hidden p-2 space-y-2"
        >
          {deck}
        </aside>
      </div>

      {transport}
    </div>
  );
}
