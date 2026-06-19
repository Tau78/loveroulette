"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KeyRound, Megaphone, SlidersHorizontal } from "lucide-react";
import {
  AdminAudioPanel,
  ADMIN_SOUNDTRACK_AUTO_UNLOCK,
} from "@/components/admin/AdminAudioPanel";
import { AdminControlPanel } from "@/components/admin/AdminControlPanel";
import { AdminPreflightPanel } from "@/components/admin/AdminPreflightPanel";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { AdminDeckPanel } from "@/components/admin/AdminDeckPanel";
import { AdminGeneratorePanel } from "@/components/admin/AdminGeneratorePanel";
import { AdminPinModal } from "@/components/admin/AdminPinModal";
import { AdminNewGamePanel } from "@/components/admin/AdminNewGamePanel";
import { AdminQuizPanel } from "@/components/admin/AdminQuizPanel";
import { AdminRegiaPanel } from "@/components/admin/AdminRegiaPanel";
import { DisplayPreview } from "@/components/admin/DisplayPreview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAnimatorPin } from "@/hooks/useAnimatorPin";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import type { EventStats } from "@/lib/musicpro/session";
import type { LoveRouletteEvent } from "@/lib/musicpro/types";
import type { QuizSessionState } from "@/lib/musicpro/quiz-state";
import { normalizeEventSlug } from "@/lib/musicpro/slug";
import { postQuizAction } from "@/lib/admin/animator-api";

type AdminTab = "controlli" | "regia";

const TABS: { id: AdminTab; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: "controlli", label: "Controlli", icon: SlidersHorizontal },
  { id: "regia", label: "Regia", icon: Megaphone },
];

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
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("controlli");
  const [quizOverride, setQuizOverride] = useState<QuizSessionState | null>(
    null,
  );
  const [questionsRefreshKey, setQuestionsRefreshKey] = useState(0);
  const [soundtrackUnlocked, setSoundtrackUnlocked] = useState<
    boolean | null
  >(null);

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

  const { runtimeState, quizState } = useLoveRouletteSession({
    eventSlug: eventCode,
    eventId: event?.id,
    initialRuntimeState: event?.runtimeState ?? "lobby",
    enabled: Boolean(event),
  });

  const effectiveQuizState = quizOverride ?? quizState;

  useEffect(() => {
    if (!quizState) {
      setQuizOverride(null);
    }
  }, [quizState?.updatedAt, quizState]);

  const loadSessionStats = useCallback(async () => {
    const response = await fetch(
      `/api/events/${encodeURIComponent(eventCode)}/session`,
    );
    if (!response.ok) return null;
    return (await response.json()) as SessionPayload;
  }, [eventCode]);

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
          throw new Error("Serata non trovata o non disponibile.");
        }

        const payload = (await response.json()) as LoveRouletteEvent;
        if (cancelled) return;

        setEvent(payload);

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
    const interval = window.setInterval(refreshStats, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [event, loadSessionStats, runtimeState]);

  const controlsDisabled = !pinReady || loading || pinVerifying;

  const handleQuizChange = useCallback((quiz: QuizSessionState | null) => {
    setQuizOverride(quiz);
  }, []);

  const handleResetComplete = useCallback(async () => {
    setQuizOverride(null);
    setQuestionsRefreshKey((key) => key + 1);
    const sessionPayload = await loadSessionStats();
    if (sessionPayload) {
      setStats(sessionPayload.stats);
    }
  }, [loadSessionStats]);

  const handleQuestionsImported = useCallback(() => {
    void handleResetComplete();
  }, [handleResetComplete]);

  const handleInvalidPin = useCallback(() => {
    rejectPin("PIN non valido — inseriscilo di nuovo.");
  }, [rejectPin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-dark-fuchsia">
        <p className="text-muted-foreground text-sm">
          Caricamento pannello animatore…
        </p>
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-dark-fuchsia p-6">
        <p className="text-destructive text-center max-w-md text-sm">
          {loadError ?? "Impossibile aprire la dashboard."}
        </p>
      </div>
    );
  }

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
      >
        <div className="flex flex-col gap-2 h-full min-h-0">
          <div className="flex items-center gap-1 shrink-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs gap-1.5",
                  activeTab !== id && "text-muted-foreground",
                )}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            ))}
            {event.animatorPinRequired && pinReady ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs ml-auto gap-1.5"
                onClick={openPinModal}
              >
                <KeyRound className="size-3.5" />
                Cambia PIN
              </Button>
            ) : null}
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_min(400px,36vw)] gap-3 flex-1 min-h-0 items-stretch">
            <DisplayPreview eventCode={eventCode} embedded className="min-h-0 h-full" />

            <div className="space-y-2 overflow-y-auto min-h-0 h-full pr-0.5">
              {activeTab === "controlli" ? (
                <>
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
                    onQuizChange={handleQuizChange}
                    questionsRefreshKey={questionsRefreshKey}
                  />
                  {runtimeState === "quiz" && effectiveQuizState ? (
                    <AdminQuizPanel
                      variant="deck"
                      eventCode={eventCode}
                      quizState={effectiveQuizState}
                      animatorPin={pin}
                      onlineCount={stats.onlineCount}
                      participantCount={stats.participantCount}
                      disabled={controlsDisabled}
                      onInvalidPin={handleInvalidPin}
                      onQuizChange={handleQuizChange}
                    />
                  ) : null}
                  {runtimeState === "quiz" && !effectiveQuizState ? (
                    <AdminDeckPanel
                      title="Quiz senza domande"
                      subtitle="La fase quiz è attiva ma il set non è inizializzato."
                      accent
                    >
                      <Button
                        size="sm"
                        disabled={controlsDisabled}
                        onClick={() =>
                          void postQuizAction(
                            eventCode,
                            { action: "start" },
                            pin,
                          ).then(async (res) => {
                            if (!res.ok) return;
                            const data = (await res.json()) as {
                              quiz: QuizSessionState | null;
                            };
                            handleQuizChange(data.quiz ?? null);
                          })
                        }
                      >
                        Carica domande quiz
                      </Button>
                    </AdminDeckPanel>
                  ) : null}
                  <AdminAudioPanel
                    variant="deck"
                    eventCode={eventCode}
                    runtimeState={runtimeState}
                    quizState={effectiveQuizState}
                    disabled={controlsDisabled}
                    onUnlockedChange={setSoundtrackUnlocked}
                  />
                  <AdminNewGamePanel
                    variant="deck"
                    eventCode={eventCode}
                    animatorPin={pin}
                    disabled={controlsDisabled}
                    onInvalidPin={handleInvalidPin}
                    onReset={() => void handleResetComplete()}
                  />
                  <AdminGeneratorePanel
                    variant="deck"
                    eventCode={eventCode}
                    animatorPin={pin}
                    disabled={controlsDisabled}
                    onImported={handleQuestionsImported}
                  />
                </>
              ) : null}

              {activeTab === "regia" ? (
                <AdminRegiaPanel
                  variant="deck"
                  eventCode={eventCode}
                  joinUrl={event.joinUrl}
                  animatorPin={pin}
                  disabled={controlsDisabled}
                  onInvalidPin={handleInvalidPin}
                />
              ) : null}
            </div>
          </div>
        </div>
      </AdminDashboardShell>
    </>
  );
}
