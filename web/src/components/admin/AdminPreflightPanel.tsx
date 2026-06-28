"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { Button } from "@/components/ui/button";
import { displayPath, displayUrl } from "@/lib/display/embed";
import { cn } from "@/lib/utils";

const MIN_QUESTIONS_READY = 24;
const DEFAULT_QUIZ_TOTAL = 27;

type TrafficStatus = "green" | "amber" | "red";

interface AdminPreflightPanelProps {
  eventCode: string;
  onlineCount: number;
  participantCount: number;
  questionsRefreshKey?: number;
  /** Se noto (es. da hook colonna sonora), aggiorna il semaforo audio. */
  soundtrackUnlocked?: boolean | null;
  /** Colonna sonora con autoUnlock (dashboard animatore). */
  soundtrackAutoUnlock?: boolean;
  expectedQuestionCount?: number;
  disabled?: boolean;
  variant?: "card" | "deck";
}

function StatusDot({ status }: { status: TrafficStatus }) {
  return (
    <span
      className={cn(
        "mt-1 size-2 shrink-0 rounded-full",
        status === "green" &&
          "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.55)]",
        status === "amber" && "bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]",
        status === "red" && "bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.45)]",
      )}
      aria-hidden
    />
  );
}

function questionsStatus(
  count: number | null,
  loading: boolean,
  expectedTotal: number,
): TrafficStatus {
  if (loading && count === null) return "amber";
  if (count === null || count === 0) return "red";
  if (count >= MIN_QUESTIONS_READY || count === expectedTotal) return "green";
  return "amber";
}

function audioStatus(soundtrackUnlocked: boolean | null | undefined): TrafficStatus {
  if (soundtrackUnlocked === true) return "green";
  if (soundtrackUnlocked === false) return "red";
  return "amber";
}

function presenceStatus(count: number): TrafficStatus {
  if (count >= 1) return "green";
  return "amber";
}

export function AdminPreflightPanel({
  eventCode,
  onlineCount,
  participantCount,
  questionsRefreshKey = 0,
  soundtrackUnlocked = null,
  soundtrackAutoUnlock = false,
  expectedQuestionCount = DEFAULT_QUIZ_TOTAL,
  disabled = false,
  variant = "deck",
}: AdminPreflightPanelProps) {
  const { count: questionCount, loading: questionCountLoading } =
    useEventQuestionCount(eventCode, true, questionsRefreshKey);

  const [copied, setCopied] = useState(false);

  const projectorPath = displayPath(eventCode);
  const projectorFullUrl = useMemo(() => {
    if (typeof window === "undefined") return projectorPath;
    return displayUrl(eventCode, { origin: window.location.origin });
  }, [eventCode, projectorPath]);

  const domandeStatus = questionsStatus(
    questionCount,
    questionCountLoading,
    expectedQuestionCount,
  );

  const audioTraffic = audioStatus(soundtrackUnlocked);
  const onlineTraffic = presenceStatus(onlineCount);
  const iscrittiTraffic = presenceStatus(participantCount);

  const allGreen =
    domandeStatus === "green" &&
    audioTraffic === "green" &&
    onlineTraffic === "green";

  const subtitle = allGreen ? "Pronto" : "Check";

  async function copyProjectorUrl() {
    try {
      await navigator.clipboard.writeText(projectorFullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — URL resta selezionabile nel testo */
    }
  }

  const domandeLabel =
    questionCountLoading && questionCount === null
      ? "…"
      : `${questionCount ?? 0}${domandeStatus === "green" ? ` / ${expectedQuestionCount}` : ""}`;

  return (
    <AdminPanelShell
      variant={variant}
      title="Preflight"
      subtitle={subtitle}
      cardTitle="Checklist pre-serata"
      collapsible={false}
    >
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={domandeStatus} />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Domande</p>
            <p className="text-[11px] font-semibold tabular-nums">{domandeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={audioTraffic} />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Audio</p>
            <p className="text-[11px] font-semibold truncate">
              {soundtrackUnlocked === true
                ? "OK"
                : soundtrackUnlocked === false
                  ? "Bloccato"
                  : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={onlineTraffic} />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Online</p>
            <p className="text-[11px] font-semibold tabular-nums">{onlineCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={iscrittiTraffic} />
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Iscritti</p>
            <p className="text-[11px] font-semibold tabular-nums">{participantCount}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1">
        <code className="min-w-0 flex-1 truncate rounded border border-border/40 bg-background/30 px-2 py-1 font-mono text-[9px]">
          {projectorPath}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2"
          disabled={disabled}
          onClick={() => void copyProjectorUrl()}
          title="Copia URL proiettore"
        >
          <Copy className="size-3" />
          {copied ? "OK" : "Copia"}
        </Button>
      </div>
    </AdminPanelShell>
  );
}
