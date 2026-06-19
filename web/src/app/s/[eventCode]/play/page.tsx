"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { AmbientBackground } from "@/components/player/AmbientBackground";
import { QuizPlayer } from "@/components/player/QuizPlayer";
import { VotingPlayer } from "@/components/player/VotingPlayer";
import { CoupleTakeover } from "@/components/player/CoupleTakeover";
import type { WaveMode } from "@/components/player/ColorWave";
import {
  COUPLE_REVEALED_EVENT,
  dispatchCoupleRevealed,
  type CoupleRevealedDetail,
} from "@/lib/player-events";
import {
  clearStoredParticipant,
  persistParticipantProfile,
  readStoredParticipantId,
  readStoredParticipantProfile,
  type StoredParticipantProfile,
} from "@/lib/player/participant-storage";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import { isEventUuid, normalizeEventSlug } from "@/lib/musicpro/slug";
import type { EventState } from "@/lib/types";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STATE_LABELS: Record<EventState, string> = {
  lobby: "Lobby",
  quiz: "Quiz",
  matching: "Roulette",
  extraction: "Estrazione",
  elimination: "Eliminazione",
  finals: "Finali",
  winner: "Vincitore",
  closed: "Chiuso",
};

type JoinField = "nickname" | "badge";

type RestoreState = "pending" | "ready";

interface JoinResponse {
  error?: string;
  code?: "NICKNAME_TAKEN" | "BADGE_TAKEN";
  participant?: {
    id: string;
    nickname?: string;
    gender?: "male" | "female";
    badge_code?: string | null;
  };
}

async function postJoin(
  eventSlug: string,
  payload: {
    nickname: string;
    gender: "male" | "female";
    badgeCode: string | null;
    participantId?: string | null;
  },
): Promise<{ ok: true; participant: NonNullable<JoinResponse["participant"]> } | { ok: false; status: number; data: JoinResponse }> {
  const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nickname: payload.nickname,
      gender: payload.gender,
      badgeCode: payload.badgeCode,
      ...(payload.participantId ? { participantId: payload.participantId } : {}),
    }),
  });

  const data = (await res.json()) as JoinResponse;
  if (!res.ok || !data.participant?.id) {
    return { ok: false, status: res.status, data };
  }

  return { ok: true, participant: data.participant };
}

function postPresence(
  eventSlug: string,
  participantId: string,
  online: boolean,
): void {
  const body = JSON.stringify({ participantId, online });
  const url = `/api/events/${encodeURIComponent(eventSlug)}/presence`;

  if (!online && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: !online,
  }).catch(() => {});
}

function readAnimatorTestProfile(): StoredParticipantProfile | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("animatorTest") !== "1") return null;

  const id = params.get("pid");
  const nickname = params.get("nick");
  if (!id || !nickname) return null;

  return {
    id,
    nickname: decodeURIComponent(nickname),
    gender: params.get("gender") === "female" ? "female" : "male",
    badgeCode: params.get("badge") ?? "",
  };
}

export default function PlayerPlayPage() {
  const params = useParams();
  const rawSlug = String(params.eventCode ?? "");
  const eventSlug = useMemo(
    () => (isEventUuid(rawSlug) ? rawSlug : normalizeEventSlug(rawSlug)),
    [rawSlug],
  );

  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [badgeCode, setBadgeCode] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [restoreState, setRestoreState] = useState<RestoreState>("pending");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<JoinField | null>(null);
  const [joining, setJoining] = useState(false);
  const [waveMode, setWaveMode] = useState<WaveMode>("idle");
  const [partnerNick, setPartnerNick] = useState<string | null>(null);
  const joinedRef = useRef(false);
  const lastRevealAtRef = useRef<string | null>(null);

  const { runtimeState, transport, isResolving, quizState, lastReveal, voting } =
    useLoveRouletteSession({
      eventSlug,
      enabled: joined,
    });

  const applyParticipant = useCallback(
    (
      participant: NonNullable<JoinResponse["participant"]>,
      nick: string,
      g: "male" | "female",
      badge: string,
    ) => {
      persistParticipantProfile(eventSlug, {
        id: participant.id,
        nickname: nick,
        gender: g,
        badgeCode: badge,
      });
      setParticipantId(participant.id);
      setNickname(nick);
      setGender(g);
      setBadgeCode(badge);
      setJoined(true);
      joinedRef.current = true;
    },
    [eventSlug],
  );

  const handleJoinFailure = useCallback(
    (status: number, data: JoinResponse) => {
      if (data.code === "NICKNAME_TAKEN") {
        setFieldError("nickname");
        setJoinError(data.error ?? "Questo nickname è già in sala.");
      } else if (data.code === "BADGE_TAKEN") {
        setFieldError("badge");
        setJoinError(data.error ?? "Badge non valido.");
      } else if (status === 400) {
        clearStoredParticipant(eventSlug);
        setJoinError("Sessione scaduta — riprova a entrare.");
      } else {
        setJoinError(data.error ?? "Impossibile entrare in sala");
      }
    },
    [eventSlug],
  );

  const performJoin = useCallback(
    async (input: {
      nickname: string;
      gender: "male" | "female";
      badgeCode: string;
      participantId?: string | null;
    }) => {
      const nick = input.nickname.trim();
      const badge = input.badgeCode.trim();
      const storedId =
        input.participantId ?? readStoredParticipantId(eventSlug) ?? undefined;

      const result = await postJoin(eventSlug, {
        nickname: nick,
        gender: input.gender,
        badgeCode: badge || null,
        participantId: storedId,
      });

      if (!result.ok) {
        return result;
      }

      applyParticipant(result.participant, nick, input.gender, badge);
      return result;
    },
    [applyParticipant, eventSlug],
  );

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const testProfile = readAnimatorTestProfile();
      if (testProfile) {
        persistParticipantProfile(eventSlug, testProfile);
      }

      const profile = testProfile ?? readStoredParticipantProfile(eventSlug);
      if (!profile) {
        if (!cancelled) setRestoreState("ready");
        return;
      }

      setNickname(profile.nickname);
      setGender(profile.gender);
      setBadgeCode(profile.badgeCode);
      setJoining(true);

      const result = await performJoin({
        nickname: profile.nickname,
        gender: profile.gender,
        badgeCode: profile.badgeCode,
        participantId: profile.id,
      });

      if (cancelled) return;

      setJoining(false);
      if (!result.ok) {
        clearStoredParticipant(eventSlug);
        setJoined(false);
        joinedRef.current = false;
        setParticipantId(null);
      }

      setRestoreState("ready");
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [eventSlug, performJoin]);

  useEffect(() => {
    if (!joined || !participantId) return;

    postPresence(eventSlug, participantId, true);

    const heartbeat = window.setInterval(() => {
      postPresence(eventSlug, participantId, true);
    }, 30_000);

    const onVisibility = () => {
      postPresence(
        eventSlug,
        participantId,
        document.visibilityState === "visible",
      );
    };

    const onPageHide = () => {
      postPresence(eventSlug, participantId, false);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      if (joinedRef.current) {
        postPresence(eventSlug, participantId, false);
      }
    };
  }, [eventSlug, joined, participantId]);

  useEffect(() => {
    if (!joined || partnerNick) return;
    if (runtimeState === "matching") setWaveMode("spin");
    else if (runtimeState === "extraction") setWaveMode("reveal");
    else if (runtimeState === "lobby") setWaveMode("idle");
  }, [joined, runtimeState, partnerNick]);

  useEffect(() => {
    if (!joined || !participantId || !lastReveal) return;
    if (lastReveal.updatedAt === lastRevealAtRef.current) return;
    lastRevealAtRef.current = lastReveal.updatedAt;

    let partner: string | null = null;
    if (lastReveal.maleId === participantId) {
      partner = lastReveal.femaleNick;
    } else if (lastReveal.femaleId === participantId) {
      partner = lastReveal.maleNick;
    }

    if (partner) {
      dispatchCoupleRevealed({ partnerNick: partner, yourNick: nickname });
    }
  }, [joined, participantId, lastReveal, nickname]);

  const handleCoupleRevealed = useCallback((detail: CoupleRevealedDetail) => {
    setWaveMode("celebration");
    setPartnerNick(detail.partnerNick);
  }, []);

  useEffect(() => {
    if (!joined) return;
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<CoupleRevealedDetail>).detail;
      if (detail?.partnerNick) handleCoupleRevealed(detail);
    };
    window.addEventListener(COUPLE_REVEALED_EVENT, onEvent);
    return () => window.removeEventListener(COUPLE_REVEALED_EVENT, onEvent);
  }, [joined, handleCoupleRevealed]);

  const dismissTakeover = useCallback(() => {
    setPartnerNick(null);
    setWaveMode("idle");
  }, []);

  const simulateSpin = () => {
    setPartnerNick(null);
    setWaveMode("spin");
  };

  const simulateExtraction = () => {
    const demoPartner = gender === "male" ? "Sofia" : "Marco";
    dispatchCoupleRevealed({ partnerNick: demoPartner, yourNick: nickname });
  };

  const handleJoin = async () => {
    const nick = nickname.trim();
    if (!nick) {
      setFieldError("nickname");
      setJoinError("Scrivi un nickname per entrare in sala.");
      return;
    }

    setJoinError(null);
    setFieldError(null);
    setJoining(true);

    try {
      const result = await performJoin({ nickname: nick, gender, badgeCode });
      if (!result.ok) {
        handleJoinFailure(result.status, result.data);
      }
    } catch {
      setJoinError("Errore di rete. Riprova.");
    } finally {
      setJoining(false);
    }
  };

  if (restoreState === "pending" || (joining && !joined)) {
    return (
      <PageShell className="p-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-muted-foreground">Riconnessione in corso…</p>
        </div>
      </PageShell>
    );
  }

  if (joined) {
    return (
      <AmbientBackground waveMode={waveMode}>
        <div className="min-h-full flex flex-col items-center justify-center p-6 pb-28">
          <div className="w-full max-w-md space-y-6 text-center">
            <Badge variant="outline" className="border-primary/40 text-primary">
              {eventSlug}
            </Badge>
            <div className="inline-flex size-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <Heart className="size-7 text-primary fill-primary/30" />
            </div>
            <h1 className="text-2xl font-bold">Ciao, {nickname}!</h1>
            <p className="text-muted-foreground">
              Sei in sala. In attesa dell&apos;animatore...
            </p>
            <Card className="bg-card/80 backdrop-blur-md border-border/60">
              <CardHeader className="pb-2">
                <CardDescription>Stato evento</CardDescription>
                <CardTitle className="text-xl">
                  {isResolving
                    ? "Caricamento..."
                    : STATE_LABELS[runtimeState]}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {runtimeState === "lobby"
                    ? "Il quiz partirà quando l'animatore premerà Start."
                    : runtimeState === "quiz"
                      ? "Rispondi alla domanda qui sotto."
                      : runtimeState === "matching"
                        ? "La roulette sta girando..."
                        : runtimeState === "extraction"
                          ? "Estrazione coppia in corso."
                      : runtimeState === "finals"
                        ? voting.current?.status === "open"
                          ? "Scegli la coppia preferita qui sotto."
                          : "In attesa della prossima votazione."
                        : "Segui le istruzioni dell'animatore."}
                </p>
                {transport && (
                  <p className="text-xs text-muted-foreground/70">
                    Sync: {transport === "realtime" ? "live" : "polling 5s"}
                  </p>
                )}
              </CardContent>
            </Card>

            {participantId && voting.current?.status === "open" &&
            runtimeState === "finals" ? (
              <VotingPlayer
                eventSlug={eventSlug}
                participantId={participantId}
                session={voting.current}
              />
            ) : participantId ? (
              <QuizPlayer
                eventSlug={eventSlug}
                participantId={participantId}
                quizState={quizState}
                runtimeState={runtimeState}
              />
            ) : null}
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 p-4 border-t border-border/60 bg-card/90 backdrop-blur-md">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Demo spettacolo
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-primary/40"
              onClick={simulateSpin}
            >
              Roulette
            </Button>
            <Button type="button" className="flex-1" onClick={simulateExtraction}>
              Estrazione
            </Button>
          </div>
        </div>

        {partnerNick && (
          <CoupleTakeover partnerNick={partnerNick} onDismiss={dismissTakeover} />
        )}
      </AmbientBackground>
    );
  }

  return (
    <PageShell className="p-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Link
          href={`/s/${eventSlug}`}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← {eventSlug}
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Entra in sala</h1>
        </div>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <form
              className="space-y-5"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void handleJoin();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (fieldError === "nickname") {
                      setFieldError(null);
                      setJoinError(null);
                    }
                  }}
                  placeholder="Il tuo nick"
                  maxLength={24}
                  autoComplete="nickname"
                  enterKeyHint="next"
                  aria-invalid={fieldError === "nickname"}
                  className={cn(
                    "h-11 bg-background/50",
                    fieldError === "nickname" &&
                      "border-destructive ring-destructive/30",
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Genere</Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={cn(
                        "rounded-lg py-3 font-medium border transition-colors",
                        gender === g
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background/50 hover:bg-muted/50",
                      )}
                    >
                      {g === "male" ? "Uomo" : "Donna"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge">Codice badge (opzionale)</Label>
                <Input
                  id="badge"
                  value={badgeCode}
                  onChange={(e) => {
                    setBadgeCode(e.target.value);
                    if (fieldError === "badge") {
                      setFieldError(null);
                      setJoinError(null);
                    }
                  }}
                  placeholder="Es. 12"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={fieldError === "badge"}
                  className={cn(
                    "h-11 bg-background/50",
                    fieldError === "badge" &&
                      "border-destructive ring-destructive/30",
                  )}
                />
              </div>

              {joinError && (
                <p className="text-sm text-destructive" role="alert">
                  {joinError}
                </p>
              )}

              <Button
                type="button"
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={joining}
                onClick={() => void handleJoin()}
              >
                {joining ? "Accesso..." : "Entra"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
