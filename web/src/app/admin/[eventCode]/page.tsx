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
import { AdminQuizPrepPanel } from "@/components/admin/AdminQuizPrepPanel";
import { AdminFinalsPanel } from "@/components/admin/AdminFinalsPanel";
import { AdminQuizPanel } from "@/components/admin/AdminQuizPanel";
import { AdminRegiaPanel } from "@/components/admin/AdminRegiaPanel";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { AdminTransportBar } from "@/components/admin/AdminTransportBar";
import { DisplayPreview } from "@/components/admin/DisplayPreview";
import { Button } from "@/components/ui/button";
import { useAnimatorPin } from "@/hooks/useAnimatorPin";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import type { EventStats } from "@/lib/musicpro/session";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { normalizeEventSlug } from "@/lib/musicpro/slug";
import { postQuizAction } from "@/lib/admin/animator-api";
import type { ExtractionMode } from "@/lib/types";

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
  const [quizTransport, setQuizTransport] = useState<{
    start: () => void;
    canStart: boolean;
  } | null>(null);

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
    (quiz: QuizSessionState | null) => {
      applyQuizUpdate(quiz);
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
    applyQuizUpdate(null);
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
      <AdminPreflightPanel
        variant="deck"
        eventCode={eventCode}
        onlineCount={stats.onlineCount}
        participantCount={stats.participantCount}
        questionsRefreshKey={questionsRefreshKey}
        soundtrackUnlocked={soundtrackUnlocked}
        soundtrackAutoUnlock={ADMIN_SOUNDTRACK_AUTO_UNLOCK}
      />
      <AdminControlPanel
        variant="deck"
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
      {runtimeState === "lobby" ? (
        <AdminQuizPrepPanel
          variant="deck"
          eventCode={eventCode}
          animatorPin={pin}
          quizSetup={event.quizSetup}
          disabled={controlsDisabled}
          questionsRefreshKey={questionsRefreshKey}
          onInvalidPin={handleInvalidPin}
          onQuizChange={handleQuizChange}
          onTransportReady={setQuizTransport}
        />
      ) : null}
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
          <Button
            size="sm"
            disabled={controlsDisabled}
            onClick={() =>
              void postQuizAction(eventCode, { action: "start" }, pin).then(
                async (res) => {
                  if (!res.ok) return;
                  const data = (await res.json()) as {
                    quiz: QuizSessionState | null;
                  };
                  handleQuizChange(data.quiz ?? null);
                },
              )
            }
          >
            Carica
          </Button>
        </AdminDeckPanel>
      ) : null}
      <AdminNewGamePanel
        variant="deck"
        eventCode={eventCode}
        animatorPin={pin}
        disabled={controlsDisabled}
        onInvalidPin={handleInvalidPin}
        onReset={() => void handleResetComplete()}
      />
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
        transport={
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
            onStartQuiz={
              runtimeState === "lobby" && quizTransport
                ? quizTransport.start
                : undefined
            }
            startQuizDisabled={!quizTransport?.canStart}
          />
        }
      />
    </>
  );
}
