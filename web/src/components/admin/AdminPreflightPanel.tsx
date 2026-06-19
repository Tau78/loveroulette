"use client";

import { useMemo, useState, type ReactNode } from "react";
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

function PreflightRow({
  status,
  label,
  children,
  hint,
}: {
  status: TrafficStatus;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <StatusDot status={status} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[11px] font-medium text-foreground/90">{label}</p>
        {children}
        {hint ? (
          <p className="text-[10px] leading-snug text-muted-foreground/75">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
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

  const subtitle = allGreen
    ? "Tutto pronto per aprire la sala"
    : "Verifica i punti in giallo o rosso prima di iniziare";

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
      title="Checklist pre-serata"
      subtitle={subtitle}
      cardTitle="Checklist pre-serata"
      cardDescription="Verifica rapida prima di aprire la sala."
    >
      <div className="space-y-2.5">
        <PreflightRow
          status={domandeStatus}
          label="Domande caricate"
          hint={
            domandeStatus === "green"
              ? undefined
              : `Servono almeno ${MIN_QUESTIONS_READY} domande (bundle completo: ${expectedQuestionCount}).`
          }
        >
          <p className="text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{domandeLabel}</span>
            {domandeStatus === "green" && questionCount === expectedQuestionCount ? (
              <span className="ml-1 text-primary/80">· bundle OK</span>
            ) : null}
          </p>
        </PreflightRow>

        <PreflightRow
          status={audioTraffic}
          label="Audio colonna sonora"
          hint={
            soundtrackUnlocked === true
              ? "Colonna sonora sbloccata su questo dispositivo."
              : soundtrackUnlocked === false
                ? "Premi «Avvia colonna sonora» nel pannello sotto."
                : "Sblocca in «Audio & proiettore» sotto."
          }
        >
          <p className="text-[11px] text-muted-foreground">
            {soundtrackUnlocked === true
              ? "Attiva"
              : soundtrackUnlocked === false
                ? "Non sbloccata"
                : "Da verificare localmente"}
          </p>
        </PreflightRow>

        <PreflightRow status="green" label="URL proiettore">
          <div className="flex gap-1.5">
            <code className="min-w-0 flex-1 truncate rounded border border-border/40 bg-background/30 px-2 py-1 font-mono text-[10px] text-foreground/85">
              {projectorPath}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 px-2 text-[10px]"
              disabled={disabled}
              onClick={() => void copyProjectorUrl()}
            >
              <Copy className="size-3" />
              {copied ? "OK" : "Copia"}
            </Button>
          </div>
        </PreflightRow>

        <PreflightRow
          status={onlineTraffic}
          label="Giocatori online"
          hint={
            onlineCount === 0
              ? "Normale prima dell'apertura sala — controlla di nuovo dopo il QR."
              : undefined
          }
        >
          <p className="text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{onlineCount}</span>{" "}
            online
          </p>
        </PreflightRow>

        <PreflightRow
          status={iscrittiTraffic}
          label="Iscritti"
          hint={
            participantCount === 0
              ? "Nessun iscritto ancora — condividi il link invito in Regia."
              : undefined
          }
        >
          <p className="text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">
              {participantCount}
            </span>{" "}
            iscritti
          </p>
        </PreflightRow>
      </div>
    </AdminPanelShell>
  );
}
