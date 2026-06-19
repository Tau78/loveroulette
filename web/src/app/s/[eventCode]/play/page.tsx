"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/player/AmbientBackground";
import { PlayerLobbyGlow } from "@/components/player/PlayerLobbyGlow";
import { PlayerMobileHeader } from "@/components/player/PlayerMobileHeader";
import { PlayerMobileShell } from "@/components/player/PlayerMobileShell";
import { PlayerPresenceHero } from "@/components/player/PlayerPresenceHero";
import { PlayerRuntimeGlow } from "@/components/player/PlayerRuntimeGlow";
import { PlayerStageTransition } from "@/components/player/PlayerStageTransition";
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
import { usePlayerEventInfo } from "@/hooks/usePlayerEventInfo";
import { isEventUuid, normalizeEventSlug } from "@/lib/musicpro/slug";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PLAYER_PRIVACY_SHARING_NOTICE } from "@/lib/player/public-copy";
import { playerPresenceSubtitle } from "@/lib/player/presence-copy";
import { DataVisibilitySelector } from "@/components/player/DataVisibilitySelector";
import { DEFAULT_PARTICIPANT_DATA_VISIBILITY } from "@/lib/player/data-visibility";
import type { ParticipantDataVisibility } from "@/lib/musicpro/types";

type JoinField = "nickname" | "badge" | "dataVisibility";

type RestoreState = "pending" | "ready";

interface JoinResponse {
  error?: string;
  code?: "NICKNAME_TAKEN" | "BADGE_TAKEN";
  participant?: {
    id: string;
    nickname?: string;
    gender?: "male" | "female";
    badge_code?: string | null;
    data_visibility?: ParticipantDataVisibility;
  };
}

const JOIN_CARD_CLASS =
  "border-primary/25 bg-card/85 shadow-[0_0_32px_rgba(236,72,153,0.12)] backdrop-blur-md";

async function postJoin(
  eventSlug: string,
  payload: {
    nickname: string;
    gender: "male" | "female";
    badgeCode: string | null;
    dataVisibility: ParticipantDataVisibility;
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
      dataVisibility: payload.dataVisibility,
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
    dataVisibility: DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  };
}

export default function PlayerPlayPage() {
  const params = useParams();
  const rawSlug = String(params.eventCode ?? "");
  const eventSlug = useMemo(
    () => (isEventUuid(rawSlug) ? rawSlug : normalizeEventSlug(rawSlug)),
    [rawSlug],
  );

  const { info: eventInfo, loading: eventInfoLoading } =
    usePlayerEventInfo(eventSlug);

  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [badgeCode, setBadgeCode] = useState("");
  const [dataVisibility, setDataVisibility] = useState<ParticipantDataVisibility>(
    DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  );
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

  const { runtimeState, quizState, lastReveal, voting } =
    useLoveRouletteSession({
      eventSlug,
      enabled: joined,
    });

  const presenceSubtitle = playerPresenceSubtitle(runtimeState, {
    quizPhase: quizState?.displayPhase ?? null,
    votingOpen: voting.current?.status === "open",
  });

  const playerStageKey = useMemo(() => {
    if (runtimeState === "quiz" && quizState) {
      return `quiz-${quizState.displayPhase}-${quizState.currentIndex}-${quizState.phaseStartedAt}`;
    }
    if (runtimeState === "finals" && voting.current) {
      return `finals-${voting.current.status}-${voting.current.updatedAt}`;
    }
    return runtimeState;
  }, [quizState, runtimeState, voting.current]);

  const applyParticipant = useCallback(
    (
      participant: NonNullable<JoinResponse["participant"]>,
      nick: string,
      g: "male" | "female",
      badge: string,
      visibility: ParticipantDataVisibility,
    ) => {
      persistParticipantProfile(eventSlug, {
        id: participant.id,
        nickname: nick,
        gender: g,
        badgeCode: badge,
        dataVisibility: visibility,
      });
      setParticipantId(participant.id);
      setNickname(nick);
      setGender(g);
      setBadgeCode(badge);
      setDataVisibility(visibility);
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
      dataVisibility: ParticipantDataVisibility;
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
        dataVisibility: input.dataVisibility,
        participantId: storedId,
      });

      if (!result.ok) {
        return result;
      }

      applyParticipant(
        result.participant,
        nick,
        input.gender,
        badge,
        input.dataVisibility,
      );
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
      setDataVisibility(profile.dataVisibility);
      setJoining(true);

      const result = await performJoin({
        nickname: profile.nickname,
        gender: profile.gender,
        badgeCode: profile.badgeCode,
        dataVisibility: profile.dataVisibility,
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
    else if (runtimeState === "quiz") setWaveMode("pulse");
    else if (runtimeState === "elimination") setWaveMode("pulse");
    else if (runtimeState === "finals" || runtimeState === "winner") {
      setWaveMode("celebration");
    } else setWaveMode("idle");
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

  const handleJoin = async () => {
    const nick = nickname.trim();
    if (!nick) {
      setFieldError("nickname");
      setJoinError("Scrivi un nickname per entrare in sala.");
      return;
    }

    if (!dataVisibility) {
      setFieldError("dataVisibility");
      setJoinError("Scegli chi può vedere i tuoi dati personali.");
      return;
    }

    setJoinError(null);
    setFieldError(null);
    setJoining(true);

    try {
      const result = await performJoin({
        nickname: nick,
        gender,
        badgeCode,
        dataVisibility,
      });
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
      <PlayerMobileShell eventSlug={eventSlug}>
        <PlayerMobileHeader event={eventInfo} loading={eventInfoLoading} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <motion.div
            className="size-10 rounded-full border-2 border-primary/40 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-muted-foreground">Riconnessione in corso…</p>
        </div>
      </PlayerMobileShell>
    );
  }

  if (joined) {
    return (
      <PlayerMobileShell eventSlug={eventSlug}>
        <PlayerMobileHeader
          event={eventInfo}
          loading={eventInfoLoading}
          nickname={runtimeState !== "lobby" ? nickname : null}
        />
        <AmbientBackground waveMode={waveMode} className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="w-full max-w-md space-y-6">
              <PlayerStageTransition stageKey={playerStageKey}>
                <PlayerPresenceHero
                  nickname={nickname}
                  gender={gender}
                  runtimeState={runtimeState}
                  quizPhase={quizState?.displayPhase ?? null}
                  votingOpen={voting.current?.status === "open"}
                  subtitle={presenceSubtitle}
                />

                {runtimeState === "lobby" ? <PlayerLobbyGlow /> : null}

                {runtimeState !== "lobby" && runtimeState !== "quiz" ? (
                  <PlayerRuntimeGlow runtimeState={runtimeState} />
                ) : null}

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
              </PlayerStageTransition>
            </div>
          </div>
        </AmbientBackground>

        {partnerNick ? (
          <CoupleTakeover partnerNick={partnerNick} onDismiss={dismissTakeover} />
        ) : null}
      </PlayerMobileShell>
    );
  }

  return (
    <PlayerMobileShell eventSlug={eventSlug}>
      <PlayerMobileHeader event={eventInfo} loading={eventInfoLoading} />
      <div className="flex flex-1 flex-col px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <motion.div
          className="mx-auto w-full max-w-md space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="space-y-1 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Entra in sala
            </h1>
            <p className="text-sm text-muted-foreground">
              Scegli nickname e genere per giocare stasera.
            </p>
          </div>

          <Card className={JOIN_CARD_CLASS}>
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
                          "rounded-lg py-3 font-medium border transition-all",
                          gender === g
                            ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_rgba(236,72,153,0.25)]"
                            : "border-border bg-background/50 hover:bg-muted/50",
                        )}
                      >
                        {g === "male" ? "Uomo" : "Donna"}
                      </button>
                    ))}
                  </div>
                </div>

                <DataVisibilitySelector
                  value={dataVisibility}
                  onChange={(value) => {
                    setDataVisibility(value);
                    if (fieldError === "dataVisibility") {
                      setFieldError(null);
                      setJoinError(null);
                    }
                  }}
                  invalid={fieldError === "dataVisibility"}
                  disabled={joining}
                />

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

                {joinError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {joinError}
                  </p>
                ) : null}

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {PLAYER_PRIVACY_SHARING_NOTICE}
                </p>

                <Button
                  type="button"
                  size="lg"
                  className="h-12 w-full text-base font-semibold shadow-[0_0_24px_rgba(236,72,153,0.35)]"
                  disabled={joining}
                  onClick={() => void handleJoin()}
                >
                  {joining ? "Accesso..." : "Entra"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlayerMobileShell>
  );
}
