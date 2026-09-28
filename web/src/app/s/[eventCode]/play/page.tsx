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
import { SpecialTrialTeaser } from "@/components/player/SpecialTrialTeaser";
import { VotingPlayer } from "@/components/player/VotingPlayer";
import { FinalistCheerPlayer } from "@/components/player/FinalistCheerPlayer";
import { PlayerIdentityFields } from "@/components/player/PlayerIdentityFields";
import { PlayerJoinWelcome } from "@/components/player/PlayerJoinWelcome";
import { FINALS_COPY } from "@/lib/game/late-game-copy";
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
import { SessionSyncIndicator } from "@/components/session/SessionSyncIndicator";
import { PlayerResyncOverlay } from "@/components/player/PlayerResyncOverlay";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import { usePlayerActionQueueFlush } from "@/hooks/usePlayerActionQueueFlush";
import { usePlayerPresence } from "@/hooks/usePlayerPresence";
import { usePlayerResumeOverlay } from "@/hooks/usePlayerResumeOverlay";
import { usePlayerWakeLock } from "@/hooks/usePlayerWakeLock";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
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
import { playerPresenceSubtitle } from "@/lib/player/presence-copy";
import { DEFAULT_PARTICIPANT_DATA_VISIBILITY } from "@/lib/player/data-visibility";
import type { ParticipantDataVisibility } from "@/lib/musicpro/types";
import { isParticipantInFinalists } from "@/lib/player/finalist-cheer";
import {
  explicitSeeking,
  parseLoveRouletteAgeBand,
  parseLoveRouletteGender,
  parsePublicNameMode,
  PUBLIC_NAME_MODES,
  publicDisplayName,
  publicNameModeLabel,
  type LoveRouletteAgeBand,
  type LoveRouletteGender,
  type LoveRouletteSeeking,
  type PublicNameMode,
} from "@/lib/player/identity";
import { compressProfilePhoto } from "@/lib/player/profile-photo";
import { storedProfileCanReconnect } from "@/lib/player/participant-storage";

type JoinField = "profile" | "photo" | "badge" | "identity";

type RestoreState = "pending" | "ready";

interface JoinResponse {
  error?: string;
  code?: "NICKNAME_TAKEN" | "BADGE_TAKEN" | "BADGE_REQUIRED";
  participant?: {
    id: string;
    nickname?: string;
    gender?: LoveRouletteGender;
    seeking?: LoveRouletteSeeking;
    age_band?: LoveRouletteAgeBand | null;
    badge_code?: string | null;
    data_visibility?: ParticipantDataVisibility;
  };
}

const JOIN_CARD_CLASS =
  "border-primary/25 bg-card/85 shadow-[0_0_32px_rgba(236,72,153,0.12)] backdrop-blur-md";

async function postJoin(
  eventSlug: string,
  payload: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    photoUrl: string;
    nick: string | null;
    publicNameMode: PublicNameMode;
    gender: LoveRouletteGender;
    seeking: LoveRouletteSeeking;
    ageBand: LoveRouletteAgeBand;
    badgeCode: string | null;
    dataVisibility: ParticipantDataVisibility;
    participantId?: string | null;
  },
): Promise<{ ok: true; participant: NonNullable<JoinResponse["participant"]> } | { ok: false; status: number; data: JoinResponse }> {
  const res = await fetch(`/api/events/${encodeURIComponent(eventSlug)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      email: payload.email,
      photoUrl: payload.photoUrl,
      nick: payload.nick,
      publicNameMode: payload.publicNameMode,
      gender: payload.gender,
      seeking: payload.seeking,
      ageBand: payload.ageBand,
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

function readAnimatorTestProfile(): StoredParticipantProfile | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("animatorTest") !== "1") return null;

  const id = params.get("pid");
  const nickname = params.get("nick");
  if (!id || !nickname) return null;

  const gender = parseLoveRouletteGender(params.get("gender"));
  return {
    id,
    nickname: decodeURIComponent(nickname),
    nick: decodeURIComponent(nickname),
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    photoUrl: "",
    publicNameMode: parsePublicNameMode(params.get("nameMode")),
    gender,
    seeking: explicitSeeking(params.get("seeking")),
    ageBand: parseLoveRouletteAgeBand(params.get("age")),
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
  const badgeRequired = eventInfo?.badgeRequired === true;

  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [publicNameMode, setPublicNameMode] = useState<PublicNameMode>("nick");
  const [gender, setGender] = useState<LoveRouletteGender | null>(null);
  const [seeking, setSeeking] = useState<LoveRouletteSeeking | null>(null);
  const [ageBand, setAgeBand] = useState<LoveRouletteAgeBand | null>(null);
  const shownName = publicDisplayName({
    firstName,
    lastName,
    nick: nickname,
    mode: publicNameMode,
  });
  const [badgeCode, setBadgeCode] = useState("");
  const [dataVisibility, setDataVisibility] = useState<ParticipantDataVisibility>(
    DEFAULT_PARTICIPANT_DATA_VISIBILITY,
  );
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [entryStep, setEntryStep] = useState<"welcome" | "form">("welcome");
  const [restoreState, setRestoreState] = useState<RestoreState>("pending");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<JoinField | null>(null);
  const [joining, setJoining] = useState(false);
  const [waveMode, setWaveMode] = useState<WaveMode>("idle");
  const [partnerNick, setPartnerNick] = useState<string | null>(null);
  const joinedRef = useRef(false);
  const lastRevealAtRef = useRef<string | null>(null);

  const {
    runtimeState,
    quizState,
    specialTrial,
    lastReveal,
    voting,
    finalsShow,
    syncStatus,
  } = useLoveRouletteSession({
    eventSlug,
    enabled: joined,
  });

  const { remaining: quizPhaseRemaining, displayPhase: quizDisplayPhase } =
    useQuizPhaseSync({
    eventSlug,
    quizState,
    enabled: joined && runtimeState === "quiz" && Boolean(quizState),
    driveTicks: false,
  });

  usePlayerWakeLock(joined);
  usePlayerPresence({
    eventSlug,
    participantId,
    enabled: joined,
  });
  usePlayerActionQueueFlush(eventSlug, joined);
  const showResumeOverlay = usePlayerResumeOverlay(syncStatus, joined);

  const isFinalist = useMemo(() => {
    const pool = finalsShow?.finalists?.length
      ? finalsShow.finalists
      : (voting.current?.finalists ?? []);
    return isParticipantInFinalists(shownName, pool);
  }, [finalsShow?.finalists, shownName, voting.current?.finalists]);

  const finalsVotingOpen =
    finalsShow?.phase === "voting" && voting.current?.status === "open";

  const showVotePrepCard =
    Boolean(participantId) &&
    runtimeState === "finals" &&
    finalsShow?.phase === "voting_prep" &&
    !isFinalist;

  const showVotingCard =
    Boolean(participantId) &&
    runtimeState === "finals" &&
    finalsVotingOpen &&
    !isFinalist;

  const showFinalistCheer =
    Boolean(participantId) &&
    runtimeState === "finals" &&
    finalsVotingOpen &&
    isFinalist;
  const showQuizCard = Boolean(participantId) && runtimeState === "quiz";

  const presenceSubtitle = playerPresenceSubtitle(runtimeState, {
    quizPhase: quizDisplayPhase ?? null,
    votingOpen: finalsVotingOpen,
    answersRemaining:
      quizDisplayPhase === "answers" ? quizPhaseRemaining : undefined,
    suppressForCard: showQuizCard || showVotingCard || showVotePrepCard || showFinalistCheer,
  });

  const playerStageKey = useMemo(() => {
    if (runtimeState === "quiz" && quizState) {
      const questionId = quizState.questionIds[quizState.currentIndex] ?? "none";
      return `quiz-${quizState.currentIndex}-${questionId}`;
    }
    if (runtimeState === "finals" && finalsShow) {
      return `finals-${finalsShow.phase}-${finalsShow.updatedAt}`;
    }
    if (runtimeState === "finals" && voting.current) {
      return `finals-${voting.current.status}-${voting.current.updatedAt}`;
    }
    return runtimeState;
  }, [finalsShow, quizState, runtimeState, voting.current]);

  const applyParticipant = useCallback(
    (
      participant: NonNullable<JoinResponse["participant"]>,
      input: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        photoUrl: string;
        nick: string;
        publicNameMode: PublicNameMode;
        gender: LoveRouletteGender;
        seeking: LoveRouletteSeeking;
        ageBand: LoveRouletteAgeBand;
        badge: string;
        visibility: ParticipantDataVisibility;
      },
    ) => {
      const displayName =
        participant.nickname?.trim() ||
        publicDisplayName({
          firstName: input.firstName,
          lastName: input.lastName,
          nick: input.nick,
          mode: input.publicNameMode,
        });
      persistParticipantProfile(eventSlug, {
        id: participant.id,
        nickname: displayName,
        nick: input.nick,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        photoUrl: input.photoUrl,
        publicNameMode: input.publicNameMode,
        gender: input.gender,
        seeking: input.seeking,
        ageBand: input.ageBand,
        badgeCode: input.badge,
        dataVisibility: input.visibility,
      });
      setParticipantId(participant.id);
      setNickname(input.nick);
      setFirstName(input.firstName);
      setLastName(input.lastName);
      setPhone(input.phone);
      setEmail(input.email);
      setPhotoUrl(input.photoUrl);
      setPublicNameMode(input.publicNameMode);
      setGender(input.gender);
      setSeeking(input.seeking);
      setAgeBand(input.ageBand);
      setBadgeCode(input.badge);
      setDataVisibility(input.visibility);
      setJoined(true);
      joinedRef.current = true;
    },
    [eventSlug],
  );

  const handleJoinFailure = useCallback(
    (status: number, data: JoinResponse) => {
      if (data.code === "NICKNAME_TAKEN") {
        setFieldError("profile");
        setJoinError(data.error ?? "Questo nick è già in sala.");
      } else if (data.code === "BADGE_TAKEN") {
        setFieldError("badge");
        setJoinError(
          data.error ??
            "Questo badge è già usato da un altro giocatore. Lascia il campo vuoto se non hai una pettorina numerata.",
        );
      } else if (data.code === "BADGE_REQUIRED") {
        setFieldError("badge");
        setJoinError(data.error ?? "Inserisci il codice badge.");
      } else if (status === 400) {
        const payloadRejected =
          data.error === "Invalid payload" || data.error === "Invalid JSON body";
        if (readStoredParticipantId(eventSlug) && !payloadRejected) {
          clearStoredParticipant(eventSlug);
          setJoinError("Sessione scaduta — riprova a entrare.");
        } else {
          setJoinError(data.error ?? "Controlla i dati e riprova.");
        }
      } else {
        setJoinError(data.error ?? "Impossibile entrare in sala");
      }
    },
    [eventSlug],
  );

  const performJoin = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      photoUrl: string;
      nick: string;
      publicNameMode: PublicNameMode;
      gender: LoveRouletteGender;
      seeking: LoveRouletteSeeking;
      ageBand: LoveRouletteAgeBand;
      badgeCode: string;
      dataVisibility: ParticipantDataVisibility;
      participantId?: string | null;
    }) => {
      const badge = badgeRequired ? input.badgeCode.trim() : "";
      const storedId =
        input.participantId ?? readStoredParticipantId(eventSlug) ?? undefined;

      const result = await postJoin(eventSlug, {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        photoUrl: input.photoUrl,
        nick: input.nick.trim() || null,
        publicNameMode: input.publicNameMode,
        gender: input.gender,
        seeking: input.seeking,
        ageBand: input.ageBand,
        badgeCode: badge || null,
        dataVisibility: input.dataVisibility,
        participantId: storedId,
      });

      if (!result.ok) {
        return result;
      }

      applyParticipant(result.participant, {
        ...input,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        nick: input.nick.trim(),
        badge,
        visibility: input.dataVisibility,
      });
      return result;
    },
    [applyParticipant, badgeRequired, eventSlug],
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

      setNickname(profile.nick || profile.nickname);
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPhone(profile.phone);
      setEmail(profile.email);
      setPhotoUrl(profile.photoUrl);
      setPublicNameMode(profile.publicNameMode);
      setGender(profile.gender);
      setSeeking(profile.seeking);
      setAgeBand(profile.ageBand);
      setBadgeCode(profile.badgeCode);
      setDataVisibility(profile.dataVisibility);

      if (
        !storedProfileCanReconnect(profile) ||
        !profile.seeking ||
        !profile.ageBand
      ) {
        if (!cancelled) setRestoreState("ready");
        return;
      }

      setJoining(true);

      const result = await performJoin({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        email: profile.email,
        photoUrl: profile.photoUrl,
        nick: profile.nick,
        publicNameMode: profile.publicNameMode,
        gender: profile.gender,
        seeking: profile.seeking,
        ageBand: profile.ageBand,
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
        handleJoinFailure(result.status, result.data);
      }

      setRestoreState("ready");
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [eventSlug, performJoin, handleJoinFailure]);

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
      dispatchCoupleRevealed({ partnerNick: partner, yourNick: shownName });
    }
  }, [joined, participantId, lastReveal, shownName]);

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
    const first = firstName.trim();
    const last = lastName.trim();
    const tel = phone.trim();
    const mail = email.trim();

    if (!first || !last || tel.length < 6 || !mail.includes("@")) {
      setFieldError("profile");
      setJoinError("Nome, cognome, telefono ed email sono obbligatori.");
      return;
    }
    if (!photoUrl) {
      setFieldError("photo");
      setJoinError("Aggiungi una foto.");
      return;
    }
    if (!gender || !seeking || !ageBand) {
      setFieldError("identity");
      setJoinError("Scegli chi sei, chi cerchi e la fascia d’età.");
      return;
    }
    if (badgeRequired && !badgeCode.trim()) {
      setFieldError("badge");
      setJoinError("Inserisci il codice badge sulla pettorina.");
      return;
    }

    setJoinError(null);
    setFieldError(null);
    setJoining(true);

    try {
      const result = await performJoin({
        firstName: first,
        lastName: last,
        phone: tel,
        email: mail,
        photoUrl,
        nick: nickname,
        publicNameMode,
        gender,
        seeking,
        ageBand,
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
      <PlayerMobileShell eventSlug={eventSlug} fullscreenPrompt={false}>
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
          nickname={runtimeState !== "lobby" ? shownName : null}
        />
        <div className="flex justify-center px-4 -mt-2 mb-1">
          <SessionSyncIndicator status={syncStatus} />
        </div>
        <AmbientBackground waveMode={waveMode} className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="w-full max-w-md space-y-6">
              <PlayerStageTransition stageKey={playerStageKey}>
                <PlayerPresenceHero
                  nickname={shownName || " "}
                  gender={gender ?? "male"}
                  photoUrl={photoUrl}
                  seeking={seeking}
                  runtimeState={runtimeState}
                  quizPhase={quizDisplayPhase ?? null}
                  votingOpen={finalsVotingOpen}
                  answersRemaining={
                    quizDisplayPhase === "answers"
                      ? quizPhaseRemaining
                      : undefined
                  }
                  subtitle={presenceSubtitle}
                />

                {runtimeState === "lobby" ? <PlayerLobbyGlow /> : null}

                {runtimeState !== "lobby" && runtimeState !== "quiz" ? (
                  <PlayerRuntimeGlow runtimeState={runtimeState} />
                ) : null}

                {showFinalistCheer && gender ? (
                  <FinalistCheerPlayer
                    participantId={participantId!}
                    gender={gender}
                  />
                ) : showVotePrepCard ? (
                  <div className="flex min-h-[min(50vh,420px)] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-primary/40 bg-black/70 p-8 text-center backdrop-blur-md">
                    <p className="font-display text-3xl font-bold uppercase text-white leading-tight">
                      {FINALS_COPY.displayVotePrepHeadline}
                    </p>
                    <p className="font-display text-2xl font-bold uppercase text-primary leading-snug">
                      {FINALS_COPY.displayVotePrepSubline}
                    </p>
                  </div>
                ) : showVotingCard && voting.current ? (
                  <VotingPlayer
                    eventSlug={eventSlug}
                    participantId={participantId!}
                    session={voting.current}
                  />
                ) : participantId ? (
                  <>
                    {specialTrial ? (
                      <SpecialTrialTeaser trial={specialTrial} />
                    ) : null}
                    <QuizPlayer
                      eventSlug={eventSlug}
                      participantId={participantId}
                      quizState={quizState}
                      runtimeState={runtimeState}
                    />
                  </>
                ) : null}
              </PlayerStageTransition>
            </div>
          </div>
        </AmbientBackground>

        {partnerNick ? (
          <CoupleTakeover partnerNick={partnerNick} onDismiss={dismissTakeover} />
        ) : null}

        <PlayerResyncOverlay visible={showResumeOverlay} />
      </PlayerMobileShell>
    );
  }

  if (entryStep === "welcome") {
    return (
      <PlayerMobileShell eventSlug={eventSlug} fullscreenPrompt={false}>
        <PlayerMobileHeader event={eventInfo} loading={eventInfoLoading} />
        <div className="flex flex-1 flex-col px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <PlayerJoinWelcome onContinue={() => setEntryStep("form")} />
        </div>
      </PlayerMobileShell>
    );
  }

  return (
    <PlayerMobileShell eventSlug={eventSlug} fullscreenPrompt={false}>
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
              Nome, cognome, telefono, email e foto sono obbligatori. Il nick
              è facoltativo.
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (fieldError === "profile") {
                          setFieldError(null);
                          setJoinError(null);
                        }
                      }}
                      autoComplete="given-name"
                      maxLength={40}
                      className={cn(
                        "h-11 bg-background/50",
                        fieldError === "profile" &&
                          "border-destructive ring-destructive/30",
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Cognome</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (fieldError === "profile") {
                          setFieldError(null);
                          setJoinError(null);
                        }
                      }}
                      autoComplete="family-name"
                      maxLength={40}
                      className={cn(
                        "h-11 bg-background/50",
                        fieldError === "profile" &&
                          "border-destructive ring-destructive/30",
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={24}
                      className="h-11 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      inputMode="email"
                      autoComplete="email"
                      maxLength={80}
                      className="h-11 bg-background/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="size-14 rounded-full object-cover border border-white/15"
                    />
                  ) : (
                    <div className="size-14 rounded-full border border-dashed border-white/25 bg-black/30" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label htmlFor="photo">Foto</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      disabled={joining}
                      className={cn(
                        "h-11 bg-background/50",
                        fieldError === "photo" &&
                          "border-destructive ring-destructive/30",
                      )}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        void compressProfilePhoto(file)
                          .then((url) => {
                            setPhotoUrl(url);
                            if (fieldError === "photo") {
                              setFieldError(null);
                              setJoinError(null);
                            }
                          })
                          .catch(() => {
                            setFieldError("photo");
                            setJoinError("Foto non valida.");
                          });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nick</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Facoltativo"
                    maxLength={24}
                    autoComplete="nickname"
                    className="h-11 bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label>Come ti vedono in sala</Label>
                    <p className="text-xs text-muted-foreground">
                      Il nome sul proiettore e sui telefoni degli altri.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {PUBLIC_NAME_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        disabled={joining}
                        onClick={() => setPublicNameMode(mode)}
                        className={cn(
                          "min-h-12 rounded-lg border px-2 py-2 text-sm font-medium",
                          publicNameMode === mode
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-background/50",
                        )}
                      >
                        {publicNameModeLabel(mode)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {shownName
                      ? `In sala ti vedono come ${shownName}.`
                      : publicNameMode === "full"
                        ? "Si vedono nome e cognome."
                        : publicNameMode === "first"
                          ? "Si vede solo il nome."
                          : "Senza nick si vede il tuo nome."}
                  </p>
                </div>

                <PlayerIdentityFields
                  gender={gender}
                  seeking={seeking}
                  ageBand={ageBand}
                  disabled={joining}
                  invalid={fieldError === "identity"}
                  onGender={(value) => {
                    setGender(value);
                    if (fieldError === "identity") {
                      setFieldError(null);
                      setJoinError(null);
                    }
                  }}
                  onSeeking={(value) => {
                    setSeeking(value);
                    if (fieldError === "identity") {
                      setFieldError(null);
                      setJoinError(null);
                    }
                  }}
                  onAgeBand={(value) => {
                    setAgeBand(value);
                    if (fieldError === "identity") {
                      setFieldError(null);
                      setJoinError(null);
                    }
                  }}
                />

                {badgeRequired ? (
                  <div className="space-y-2">
                    <Label htmlFor="badge">Codice badge</Label>
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
                      required
                      aria-invalid={fieldError === "badge"}
                      className={cn(
                        "h-11 bg-background/50",
                        fieldError === "badge" &&
                          "border-destructive ring-destructive/30",
                      )}
                    />
                  </div>
                ) : null}

                {joinError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {joinError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full text-base font-semibold shadow-[0_0_24px_rgba(236,72,153,0.35)]"
                  disabled={joining}
                >
                  {joining ? "Salvataggio…" : "Salva ed entra"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlayerMobileShell>
  );
}
