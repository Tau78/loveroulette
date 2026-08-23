"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AdminAudioPanel,
  ADMIN_SOUNDTRACK_AUTO_UNLOCK,
} from "@/components/admin/AdminAudioPanel";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";
import { AdminPreflightPanel } from "@/components/admin/AdminPreflightPanel";
import {
  AdminDashboardShell,
  type AdminConsoleTab,
} from "@/components/admin/AdminDashboardShell";
import { AdminDeckPanel } from "@/components/admin/AdminDeckPanel";
import { AdminGeneratorePanel } from "@/components/admin/AdminGeneratorePanel";
import { AdminPinModal } from "@/components/admin/AdminPinModal";
import { AdminNewGamePanel } from "@/components/admin/AdminNewGamePanel";
import { AdminFinalsPanel } from "@/components/admin/AdminFinalsPanel";
import { AdminQuizPanel } from "@/components/admin/AdminQuizPanel";
import { AdminRegiaPanel } from "@/components/admin/AdminRegiaPanel";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { AdminTransportBar } from "@/components/admin/AdminTransportBar";
import { DisplayPreview } from "@/components/admin/DisplayPreview";
import { AdminButton } from "@/components/admin/AdminButton";
import { useAnimatorPin } from "@/hooks/useAnimatorPin";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import type { EventStats } from "@/lib/musicpro/session";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { normalizeEventSlug } from "@/lib/musicpro/slug";
import { postQuizAction, postResetEvent } from "@/lib/admin/animator-api";
import { useQuizPrep } from "@/hooks/useQuizPrep";
import type { ExtractionMode, EventState } from "@/lib/types";

interface SessionPayload {
  runtimeState: LoveRouletteEvent["runtimeState"];
  sessionId: string | null;
  stats: EventStats;
}

export default function AdminDashboardPage() {
  const params = useParams();
  const eventCode = normalizeEventSlug(String(params.eventCode ?? ""));

  const [event, setEvent] = useState<LoveRouletteEvent | null>(null);
  const [stats, setStats] = useState<EventStats>({
    onlineCount: 0,
    participantCount: 0,
    pairProgress: null,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminConsoleTab>("controlli");
  const [questionsRefreshKey, setQuestionsRefreshKey] = useState(0);
  const [soundtrackUnlocked, setSoundtrackUnlocked] = useState<boolean | null>(
    null,
  );
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>("random");
  const [mancheEditing, setMancheEditing] = useState(true);
  const [stopBusy, setStopBusy] = useState(false);

  const {
    pin,
    pinReady,
    showPinModal,
    pinError,
    pinVerifying,
    submitPin,
    rejectPin,
    openPinModal,
  } = useAnimatorPin({
    eventCode,
    pinRequired: event?.animatorPinRequired ?? false,
  });

  const {
    runtimeState,
    quizState,
    voting,
    finalsShow,
    lastReveal,
    syncStatus,
    applyQuizUpdate,
    applyFinalsUpdate,
  } = useLoveRouletteSession({
    eventSlug: eventCode,
    eventId: event?.id,
    initialEvent: event,
    initialRuntimeState: event?.runtimeState ?? "lobby",
    enabled: Boolean(event),
  });

  const loadSessionStats = useCallback(async () => {
    const response = await fetch(
      `/api/events/${encodeURIComponent(eventCode)}/session`,
    );
    if (!response.ok) return null;
    return (await response.json()) as SessionPayload;
  }, [eventCode]);

  const refreshSessionStats = useCallback(async () => {
    const sessionPayload = await loadSessionStats();
    if (sessionPayload) {
      setStats(sessionPayload.stats);
    }
    return sessionPayload;
  }, [loadSessionStats]);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(
          `/api/events/${encodeURIComponent(eventCode)}`,
        );

        if (!response.ok) {
          throw new Error("Serata non trovata.");
        }

        const payload = (await response.json()) as LoveRouletteEvent;
        if (cancelled) return;

        setEvent(payload);
        setExtractionMode(payload.config.extraction_mode);

        const sessionPayload = await loadSessionStats();
        if (!cancelled && sessionPayload) {
          setStats(sessionPayload.stats);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Errore di caricamento.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventCode, loadSessionStats]);

  useEffect(() => {
    if (!event) return;

    let cancelled = false;

    const refreshStats = async () => {
      const sessionPayload = await loadSessionStats();
      if (!cancelled && sessionPayload) {
        setStats(sessionPayload.stats);
      }
    };

    void refreshStats();
    const statsPollMs =
      runtimeState === "extraction" || runtimeState === "elimination" ? 3000 : 10000;
    const interval = window.setInterval(refreshStats, statsPollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [event, loadSessionStats, runtimeState]);

  const controlsDisabled = !pinReady || loading || pinVerifying;

  const handleQuizChange = useCallback(
    (quiz: QuizSessionState | null, nextRuntimeState?: EventState) => {
      applyQuizUpdate(quiz, nextRuntimeState);
    },
    [applyQuizUpdate],
  );

  const handleFinalsChange = useCallback(
    (payload: Parameters<typeof applyFinalsUpdate>[0]) => {
      applyFinalsUpdate(payload);
    },
    [applyFinalsUpdate],
  );

  const handleResetComplete = useCallback(async () => {
    applyQuizUpdate(null, "lobby");
    setQuestionsRefreshKey((key) => key + 1);
    const sessionPayload = await loadSessionStats();
    if (sessionPayload) {
      setStats(sessionPayload.stats);
    }
  }, [applyQuizUpdate, loadSessionStats]);

  const handleQuestionsImported = useCallback(() => {
    void handleResetComplete();
  }, [handleResetComplete]);

  const handleInvalidPin = useCallback(() => {
    rejectPin("PIN non valido.");
  }, [rejectPin]);

  const quizPrep = useQuizPrep({
    eventCode,
    animatorPin: pin,
    quizSetup: event?.quizSetup ?? { questionCount: null, questionSeconds: 15 },
    disabled: controlsDisabled,
    questionsRefreshKey,
    onInvalidPin: handleInvalidPin,
    onQuizChange: handleQuizChange,
    enabled: Boolean(event) && runtimeState === "lobby",
  });

  const handleStartQuiz = useCallback(() => {
    void quizPrep.startQuiz();
  }, [quizPrep]);

  useEffect(() => {
    if (runtimeState !== "lobby") {
      setMancheEditing(false);
    }
  }, [runtimeState]);

  const handleStopManche = useCallback(async () => {
    if (stopBusy || controlsDisabled) return;
    setStopBusy(true);
    try {
      const response = await postResetEvent(
        eventCode,
        { keepPlayersOnline: true },
        pin,
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Stop non riuscito.");
      }
      applyQuizUpdate(null, "lobby");
      applyFinalsUpdate({ show: null, runtimeState: "lobby" });
      setMancheEditing(true);
      await handleResetComplete();
    } catch {
      /* TransportBar already surfaces busy/disabled; reset errors stay in Altro. */
    } finally {
      setStopBusy(false);
    }
  }, [
    applyFinalsUpdate,
    applyQuizUpdate,
    controlsDisabled,
    eventCode,
    handleResetComplete,
    pin,
    stopBusy,
  ]);

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden flex items-center justify-center theme-dark-fuchsia">
        <p className="text-muted-foreground text-xs uppercase tracking-widest">
          Caricamento…
        </p>
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="w-screen h-screen overflow-hidden flex items-center justify-center theme-dark-fuchsia p-6">
        <p className="text-destructive text-center max-w-md text-sm">
          {loadError ?? "Dashboard non disponibile."}
        </p>
      </div>
    );
  }

  const deckControlli = (
    <>
      <AdminTransportBar
        eventCode={eventCode}
        runtimeState={runtimeState}
        animatorPin={pin}
        disabled={controlsDisabled}
        quizState={quizState}
        finalsShow={finalsShow}
        voting={voting}
        pairProgress={stats.pairProgress}
        extractionMode={extractionMode}
        onExtractionModeChange={setExtractionMode}
        onInvalidPin={handleInvalidPin}
        onQuizChange={handleQuizChange}
        onFinalsChange={handleFinalsChange}
        onRefreshProgress={refreshSessionStats}
        onStartQuiz={runtimeState === "lobby" ? handleStartQuiz : undefined}
        startQuizDisabled={!quizPrep.canStart || quizPrep.busy || quizPrep.countLoading}
        onStopManche={() => void handleStopManche()}
        stopDisabled={stopBusy}
        manche={
          runtimeState === "lobby"
            ? {
                availableQuestionCount: quizPrep.availableCount ?? 0,
                questionCount: quizPrep.questionCount,
                questionSeconds: quizPrep.questionSeconds,
                onQuestionCountChange: quizPrep.setQuestionCount,
                onQuestionSecondsChange: quizPrep.setQuestionSeconds,
                editing: mancheEditing,
                onToggleEdit: () => setMancheEditing((open) => !open),
              }
            : null
        }
        variant="panel"
      />
      {(runtimeState === "finals" || runtimeState === "winner") && (
        <AdminFinalsPanel
          variant="deck"
          eventCode={eventCode}
          animatorPin={pin}
          disabled={controlsDisabled}
          finalsShow={finalsShow}
          voting={voting}
          onInvalidPin={handleInvalidPin}
          onFinalsChange={handleFinalsChange}
        />
      )}
      {runtimeState === "quiz" && quizState ? (
        <AdminQuizPanel
          variant="deck"
          eventCode={eventCode}
          quizState={quizState}
          animatorPin={pin}
          onlineCount={stats.onlineCount}
          participantCount={stats.participantCount}
          disabled={controlsDisabled}
          onInvalidPin={handleInvalidPin}
          onQuizChange={handleQuizChange}
          hideAdvance
        />
      ) : null}
      {runtimeState === "quiz" && !quizState ? (
        <AdminDeckPanel title="Quiz vuoto" collapsible={false}>
          <AdminButton
            size="sm"
            disabled={controlsDisabled}
            onClick={() =>
              void postQuizAction(eventCode, { action: "start" }, pin).then(
                async (res) => {
                  if (!res.ok) return;
                  const data = (await res.json()) as {
                    quiz: QuizSessionState | null;
                    runtimeState?: EventState;
                  };
                  handleQuizChange(data.quiz ?? null, data.runtimeState);
                },
              )
            }
          >
            Carica
          </AdminButton>
        </AdminDeckPanel>
      ) : null}
      <AdminDeckPanel title="Altro" defaultOpen={false} panelId="altro">
        <AdminPreflightPanel
          variant="plain"
          eventCode={eventCode}
          onlineCount={stats.onlineCount}
          participantCount={stats.participantCount}
          questionsRefreshKey={questionsRefreshKey}
          soundtrackUnlocked={soundtrackUnlocked}
          soundtrackAutoUnlock={ADMIN_SOUNDTRACK_AUTO_UNLOCK}
          disabled={controlsDisabled}
        />
        {runtimeState !== "lobby" ? (
          <AdminControlPanel
            variant="plain"
            eventCode={eventCode}
            runtimeState={runtimeState}
            animatorPin={pin}
            initialExtractionMode={event.config.extraction_mode}
            disabled={controlsDisabled}
            onInvalidPin={handleInvalidPin}
            questionsRefreshKey={questionsRefreshKey}
            pairProgress={stats.pairProgress}
            onRefreshProgress={refreshSessionStats}
            hideTransportActions
          />
        ) : null}
        {quizPrep.error ? (
          <p className="text-[0.8125rem] font-medium text-destructive">{quizPrep.error}</p>
        ) : null}
        <AdminNewGamePanel
          variant="plain"
          eventCode={eventCode}
          animatorPin={pin}
          disabled={controlsDisabled}
          onInvalidPin={handleInvalidPin}
          onReset={() => void handleResetComplete()}
        />
      </AdminDeckPanel>
    </>
  );

  const deckRegia = (
    <>
      <AdminAudioPanel
        variant="deck"
        eventCode={eventCode}
        runtimeState={runtimeState}
        quizState={quizState}
        lastReveal={lastReveal}
        finalsShow={finalsShow}
        disabled={controlsDisabled}
        onUnlockedChange={setSoundtrackUnlocked}
      />
      <AdminRegiaPanel
        variant="deck"
        eventCode={eventCode}
        joinUrl={event.joinUrl}
        animatorPin={pin}
        disabled={controlsDisabled}
        onInvalidPin={handleInvalidPin}
      />
    </>
  );

  const deckSetup = (
    <>
      <AdminSettingsPanel
        variant="deck"
        eventCode={eventCode}
        animatorPin={pin}
        badgeRequired={event.config.badge_required}
        disabled={controlsDisabled}
        onInvalidPin={handleInvalidPin}
        onConfigChange={({ badgeRequired }) =>
          setEvent((prev) =>
            prev
              ? {
                  ...prev,
                  config: { ...prev.config, badge_required: badgeRequired },
                }
              : prev,
          )
        }
      />
      <AdminGeneratorePanel
        variant="deck"
        eventCode={eventCode}
        animatorPin={pin}
        disabled={controlsDisabled}
        onImported={handleQuestionsImported}
      />
    </>
  );

  const deck =
    activeTab === "controlli"
      ? deckControlli
      : activeTab === "regia"
        ? deckRegia
        : deckSetup;

  return (
    <>
      <AdminPinModal
        open={showPinModal}
        error={pinError}
        verifying={pinVerifying}
        onSubmit={submitPin}
      />

      <AdminDashboardShell
        eventCode={eventCode}
        eventTitle={event.title}
        runtimeState={runtimeState}
        onlineCount={stats.onlineCount}
        participantCount={stats.participantCount}
        syncStatus={syncStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pinReady={pinReady}
        pinRequired={event.animatorPinRequired}
        onChangePin={openPinModal}
        program={
          <DisplayPreview
            eventCode={eventCode}
            embedded
            fill
            className="flex-1 min-h-0 h-full"
          />
        }
        deck={deck}
      />
    </>
  );
}
