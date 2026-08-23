"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { useEventQuestionCount } from "@/hooks/useEventQuestionCount";
import { useQuizPrep } from "@/hooks/useQuizPrep";
import { AdminPanelShell } from "@/components/admin/AdminDeckPanel";
import { AdminButton } from "@/components/admin/AdminButton";
import {
  MAX_QUESTION_SECONDS,
  MIN_QUESTION_SECONDS,
} from "@/components/admin/AdminQuizSetupFields";
import { displayPath, displayUrl } from "@/lib/display/embed";
import type { QuizSessionState, QuizSetupPrefs } from "@/lib/musicpro/quiz-state";
import { cn } from "@/lib/utils";
import { ADMIN_UI } from "@/lib/admin/admin-ui-tokens";

const MIN_QUESTIONS_READY = 24;
const DEFAULT_QUIZ_TOTAL = 27;

type TrafficStatus = "green" | "amber" | "red";

interface AdminPreflightPanelProps {
  eventCode: string;
  onlineCount: number;
  participantCount: number;
  questionsRefreshKey?: number;
  soundtrackUnlocked?: boolean | null;
  soundtrackAutoUnlock?: boolean;
  expectedQuestionCount?: number;
  disabled?: boolean;
  variant?: "card" | "deck";
  /** Lobby — setup quiz inline + callback transport bar. */
  quizSetup?: QuizSetupPrefs;
  animatorPin?: string | null;
  onInvalidPin?: () => void;
  onQuizChange?: (quiz: QuizSessionState | null) => void;
  onTransportReady?: (payload: { start: () => void; canStart: boolean }) => void;
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
  quizSetup,
  animatorPin = null,
  onInvalidPin,
  onQuizChange,
  onTransportReady,
}: AdminPreflightPanelProps) {
  const showQuizSetup = quizSetup != null;
  const { count: questionCount, loading: questionCountLoading } =
    useEventQuestionCount(eventCode, true, questionsRefreshKey);

  const quizPrep = useQuizPrep({
    eventCode,
    animatorPin,
    quizSetup: quizSetup ?? { questionCount: null, questionSeconds: 15 },
    disabled,
    questionsRefreshKey,
    onInvalidPin,
    onQuizChange,
    onTransportReady,
    enabled: showQuizSetup,
  });

  const [copied, setCopied] = useState(false);

  const projectorPath = displayPath(eventCode);
  const projectorFullUrl = useMemo(() => {
    if (typeof window === "undefined") return projectorPath;
    return displayUrl(eventCode, { origin: window.location.origin });
  }, [eventCode, projectorPath]);

  const availableCount = showQuizSetup
    ? (quizPrep.availableCount ?? questionCount ?? 0)
    : (questionCount ?? 0);

  const domandeStatus = questionsStatus(
    availableCount,
    showQuizSetup ? quizPrep.countLoading : questionCountLoading,
    expectedQuestionCount,
  );

  const audioTraffic = audioStatus(soundtrackUnlocked);
  const onlineTraffic = presenceStatus(onlineCount);
  const iscrittiTraffic = presenceStatus(participantCount);

  const allGreen =
    domandeStatus === "green" &&
    audioTraffic === "green" &&
    onlineTraffic === "green";

  const checkLabel = allGreen ? "Pronto" : "Check";

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

  const maxQuestions = Math.max(1, availableCount);
  const fieldsDisabled =
    disabled ||
    quizPrep.busy ||
    quizPrep.countLoading ||
    !quizPrep.canStart;

  return (
    <AdminPanelShell
      variant={variant}
      title="Preflight"
      cardTitle="Checklist pre-serata"
      cardDescription={
        allGreen
          ? "Tutti i check verdi — pronto per iniziare"
          : "Verifica domande caricate, audio sbloccato e presenze online"
      }
      defaultOpen={false}
      actions={
        <span
          className={cn(
            ADMIN_UI.caption,
            "font-medium tabular-nums",
            allGreen ? "text-emerald-400" : "text-amber-300/90",
          )}
          title={
            allGreen
              ? "Tutti i check verdi — pronto per iniziare"
              : "Verifica domande, audio e presenze online"
          }
        >
          {checkLabel}
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-1.5">
        {showQuizSetup ? (
          <>
            <div className="flex items-start gap-1.5 rounded border border-border/30 px-2 py-1.5 min-w-0">
              <StatusDot status={domandeStatus} />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className={ADMIN_UI.label}>Domande</p>
                <select
                  value={quizPrep.questionCount}
                  disabled={fieldsDisabled || availableCount <= 0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value)) quizPrep.setQuestionCount(value);
                  }}
                  className={cn(ADMIN_UI.select, "w-full h-8 min-h-8 text-xs px-1.5")}
                  aria-label="Numero domande"
                >
                  {Array.from({ length: maxQuestions }, (_, index) => {
                    const value = index + 1;
                    return (
                      <option key={value} value={value}>
                        {value}
                        {value === availableCount ? " (tutte)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-start gap-1.5 rounded border border-border/30 px-2 py-1.5 min-w-0">
              <span className="mt-1 size-2 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className={ADMIN_UI.label}>Secondi</p>
                <input
                  type="number"
                  min={MIN_QUESTION_SECONDS}
                  max={MAX_QUESTION_SECONDS}
                  value={quizPrep.questionSeconds}
                  disabled={fieldsDisabled}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (Number.isFinite(parsed)) quizPrep.setQuestionSeconds(parsed);
                  }}
                  className={cn(ADMIN_UI.input, "w-full h-8 min-h-8 text-xs px-1.5 tabular-nums")}
                  aria-label="Secondi per domanda"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
            <StatusDot status={domandeStatus} />
            <div className="min-w-0">
              <p className={ADMIN_UI.label}>Domande</p>
              <p className={ADMIN_UI.stat}>{domandeLabel}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={audioTraffic} />
          <div className="min-w-0">
            <p className={ADMIN_UI.label}>Audio</p>
            <p className={cn(ADMIN_UI.stat, "truncate")}>
              {soundtrackUnlocked === true
                ? "OK"
                : soundtrackUnlocked === false
                  ? "Bloccato"
                  : soundtrackAutoUnlock
                    ? "Auto"
                    : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={onlineTraffic} />
          <div className="min-w-0">
            <p className={ADMIN_UI.label}>Online</p>
            <p className={ADMIN_UI.stat}>{onlineCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded border border-border/30 px-2 py-1.5">
          <StatusDot status={iscrittiTraffic} />
          <div className="min-w-0">
            <p className={ADMIN_UI.label}>Iscritti</p>
            <p className={ADMIN_UI.stat}>{participantCount}</p>
          </div>
        </div>
      </div>

      {showQuizSetup && !quizPrep.canStart && !quizPrep.countLoading ? (
        <p className={ADMIN_UI.error}>0 domande caricate</p>
      ) : null}

      {showQuizSetup && quizPrep.error ? (
        <p className={ADMIN_UI.error}>{quizPrep.error}</p>
      ) : null}

      <div className="flex gap-1">
        <code className={cn(ADMIN_UI.mono, "min-w-0 flex-1 truncate rounded-lg border-2 border-white/25 bg-white/10 px-2 py-1.5 h-9 flex items-center")}>
          {projectorPath}
        </code>
        <AdminButton
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
        </AdminButton>
      </div>
    </AdminPanelShell>
  );
}
