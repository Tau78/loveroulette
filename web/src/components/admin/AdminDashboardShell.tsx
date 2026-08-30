"use client";

import { useCallback, useState, type ReactNode } from "react";
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
import { AdminButton, adminButtonVariants } from "@/components/admin/AdminButton";
import { AdminDeckAccordionProvider } from "@/components/admin/AdminDeckAccordion";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";
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
}: AdminDashboardShellProps) {
  const currentPhaseIndex = PHASES.findIndex((phase) => phase.id === runtimeState);
  const displayPath = `/s/${eventCode}/display`;
  const { containerRef, isFullscreen, supported, toggle } = useFullscreen();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleTabClick = useCallback(
    (tab: AdminConsoleTab) => {
      if (activeTab === tab && sidebarOpen) {
        setSidebarOpen(false);
        return;
      }
      onTabChange(tab);
      setSidebarOpen(true);
    },
    [activeTab, onTabChange, sidebarOpen],
  );

  return (
    <div
      ref={containerRef}
      data-admin-fullscreen={isFullscreen || undefined}
      className={cn(
        ADMIN_UI.font,
        "admin-console theme-dark-fuchsia w-screen h-screen overflow-hidden bg-background flex flex-col",
      )}
    >
      <header className="shrink-0 h-11 border-b border-white/15 bg-card/80 backdrop-blur-sm px-2 flex items-center gap-2">
        <Link
          href={`/s/${eventCode}`}
          className={cn(ADMIN_UI.mono, ADMIN_UI.link, "shrink-0 rounded px-2 py-1 hover:bg-white/10")}
          title={eventCode}
        >
          {eventCode}
        </Link>

        <h1 className={cn("min-w-0 flex-1 truncate", ADMIN_UI.body, "font-bold")}>
          {eventTitle}
        </h1>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 rounded-lg border-2 border-white/25 bg-white/10 px-2.5 h-9"
            title={`${onlineCount} giocatori online`}
          >
            <Wifi className="size-4 text-emerald-300" />
            <span className={ADMIN_UI.stat}>{onlineCount}</span>
          </div>

          {syncStatus ? <SessionSyncIndicator status={syncStatus} /> : null}

          {pinRequired && pinReady && onChangePin ? (
            <AdminButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onChangePin}
              title="Cambia PIN"
            >
              <KeyRound className="size-4" />
            </AdminButton>
          ) : null}

          {supported ? (
            <AdminButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void toggle()}
              title={isFullscreen ? "Esci fullscreen" : "Fullscreen"}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="size-4" />
              ) : (
                <Maximize className="size-4" />
              )}
            </AdminButton>
          ) : null}

          <Link
            href={`/admin/${eventCode}/serata`}
            className={cn(adminButtonVariants({ variant: "outline", size: "default" }), "h-7 px-2 text-[10px]")}
          >
            Evento
          </Link>
          <Link
            href={displayPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(adminButtonVariants({ variant: "outline", size: "default" }), "gap-1.5")}
          >
            PGM
            <ExternalLink className="size-4 opacity-90" />
          </Link>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <nav
          aria-label="Sezioni"
          className={cn(
            "shrink-0 border-r border-white/15 bg-card/40 flex flex-col items-center py-2 gap-1 transition-[width] duration-200",
            sidebarOpen ? "w-12" : "w-16",
          )}
        >
          {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = sidebarOpen && activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTabClick(id)}
                className={cn(
                  ADMIN_UI.font,
                  "relative flex flex-col items-center justify-center rounded-lg transition-colors",
                  sidebarOpen ? "w-10 h-10 gap-0" : "w-12 h-12 gap-0.5",
                  isActive ? ADMIN_UI.navActive : ADMIN_UI.navIdle,
                )}
                title={label}
                aria-current={isActive ? "page" : undefined}
                aria-expanded={isActive}
              >
                <Icon className="size-4" />
                {!sidebarOpen ? (
                  <span className={cn(ADMIN_UI.caption, "text-[10px] leading-none font-semibold")}>
                    {label}
                  </span>
                ) : (
                  <span className="sr-only">{label}</span>
                )}
              </button>
            );
          })}

          <Link
            href={`/admin/${eventCode}/players`}
            className={cn(
              ADMIN_UI.font,
              "relative flex flex-col items-center justify-center rounded-lg transition-colors",
              sidebarOpen ? "w-10 h-10" : "w-12 h-12 gap-0.5",
              ADMIN_UI.navIdle,
              "hover:border-primary/50",
            )}
            title={`Giocatori — ${participantCount} iscritti`}
          >
            <Users className="size-4" />
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full",
                "bg-primary text-[9px] font-bold leading-[14px] text-center text-white",
              )}
              aria-hidden
            >
              {participantCount > 99 ? "99+" : participantCount}
            </span>
            {!sidebarOpen ? (
              <span className={cn(ADMIN_UI.caption, "text-[10px] leading-none font-semibold")}>
                Gioc.
              </span>
            ) : (
              <span className="sr-only">Giocatori</span>
            )}
          </Link>

          <div className="mt-auto flex flex-col items-center gap-0.5 px-0.5 w-full pb-1">
            {PHASES.map((phase, index) => {
              const isActive = phase.id === runtimeState;
              const isPast = index < currentPhaseIndex;
              return (
                <div
                  key={phase.id}
                  className={cn(
                    "w-full text-center rounded px-0.5 py-0.5 text-xs font-semibold leading-tight truncate",
                    isActive && "bg-primary/30 text-white",
                    !isActive && isPast && "text-white/45 line-through",
                    !isActive && !isPast && "text-white/80",
                  )}
                  title={phase.short}
                >
                  {phase.short}
                </div>
              );
            })}
          </div>
        </nav>

        <aside
          aria-label="Control deck"
          aria-hidden={!sidebarOpen}
          className={cn(
            "shrink-0 min-h-0 overflow-hidden border-r border-white/15 bg-card/30",
            "transition-[width,opacity] duration-200 ease-out",
            sidebarOpen
              ? "w-[min(19rem,30vw)] opacity-100"
              : "w-0 opacity-0 border-r-0 pointer-events-none",
          )}
        >
          <div className="h-full w-[min(19rem,30vw)] overflow-hidden flex flex-col p-1.5 gap-1">
            <div className="shrink-0 flex items-center justify-between gap-2 px-1 py-0.5">
              <p className={ADMIN_UI.section}>
                {SIDEBAR_TABS.find((tab) => tab.id === activeTab)?.label}
              </p>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className={cn(ADMIN_UI.caption, "font-semibold hover:text-primary transition-colors")}
              >
                Chiudi
              </button>
            </div>
            <AdminDeckAccordionProvider>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-1">
                {deck}
              </div>
            </AdminDeckAccordionProvider>
          </div>
        </aside>

        <section
          aria-label="Program monitor"
          className="min-w-0 min-h-0 flex-1 p-2 overflow-hidden flex flex-col"
        >
          {program}
        </section>
      </div>
    </div>
  );
}
