"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { DisplayFinalsShowStage } from "@/components/display/DisplayFinalsShowStage";
import { DisplayFinalsStage } from "@/components/display/DisplayFinalsStage";
import { DisplayOverlay } from "@/components/display/DisplayOverlay";
import { DisplayMatchingStage } from "@/components/display/DisplayMatchingStage";
import { DisplayQuizStage } from "@/components/display/DisplayQuizStage";
import { DisplayStageBackground } from "@/components/display/DisplayStageBackground";
import { JoinQrCode } from "@/components/display/JoinQrCode";
import { DisplayEliminationStage } from "@/components/display/DisplayEliminationStage";
import { DisplayExtractionStage } from "@/components/display/DisplayExtractionStage";
import { DisplayQuizLaunchInterstitial } from "@/components/display/DisplayQuizLaunchSpectacle";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { CLOSED_COPY } from "@/lib/game/late-game-copy";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useFinalsShowSync } from "@/hooks/useFinalsShowSync";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import { runtimeStateLabel } from "@/lib/events";
import type { ChallengeId } from "@/lib/types";
import { isEventUuid, normalizeEventSlug } from "@/lib/musicpro/slug";
import { Badge } from "@/components/ui/badge";
import { SessionSyncIndicator } from "@/components/session/SessionSyncIndicator";
import { cn } from "@/lib/utils";
import { isDisplayEmbedMode } from "@/lib/display/embed";
import { PROJECTOR_CANVAS, PROJECTOR_HEADER_CLASS, PROJECTOR_MAIN_BOTTOM_SAFE_CLASS, PROJECTOR_FINALISTS_FOOTER_MIN_CLASS } from "@/lib/display/projector-canvas";
import { DisplayProjectorRoot } from "@/components/display/DisplayProjectorRoot";
import { DisplayProjectorHeader } from "@/components/display/DisplayProjectorHeader";
import { DisplayFixedCanvas } from "@/components/display/DisplayFixedCanvas";
import { DisplayChallengeBackdrop } from "@/components/display/DisplayChallengeBackdrop";
import { DisplayLocalMediaLayer } from "@/components/display/DisplayLocalMediaLayer";
import { useRegiaLocalMediaReceiver } from "@/hooks/useRegiaLocalMediaReceiver";

function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    if (typeof window !== "undefined") {
      try {
        const parsed = new URL(pathOrUrl);
        const onLan =
          window.location.hostname !== "localhost" &&
          window.location.hostname !== "127.0.0.1";
        const urlIsLocal =
          parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
        if (onLan && urlIsLocal) {
          parsed.hostname = window.location.hostname;
          parsed.port = window.location.port;
          return parsed.toString();
        }
      } catch {
        // keep original
      }
    }
    return pathOrUrl;
  }
  if (typeof window === "undefined") return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${window.location.origin}${path}`;
}

export default function DisplayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const embedMode = isDisplayEmbedMode(searchParams);
  const presentMode = searchParams.get("present") === "1";
  const rawSlug = String(params.eventCode ?? "");
  const eventSlug = useMemo(
    () => (isEventUuid(rawSlug) ? rawSlug : normalizeEventSlug(rawSlug)),
    [rawSlug],
  );
  const displayCode = eventSlug.toUpperCase();

  const {
    runtimeState,
    displayOverlay,
    joinUrl,
    quizState,
    lastReveal,
    lastElimination,
    finalists,
    voting,
    finalsShow,
    applyQuizUpdate,
    applyFinalsUpdate,
    syncStatus,
  } = useLoveRouletteSession({
    eventSlug,
  });

  const { remaining: finalsRemaining } = useFinalsShowSync({
    eventSlug,
    show: finalsShow,
    enabled: Boolean(finalsShow),
    driveTicks: true,
    onTick: applyFinalsUpdate,
  });
  const { currentQuestion, progressLabel } = useCurrentQuizQuestion(
    eventSlug,
    quizState,
    runtimeState,
  );

  const effectiveJoinUrl = useMemo(() => {
    const raw = joinUrl ?? `/s/${eventSlug}/play`;
    return absoluteUrl(raw);
  }, [joinUrl, eventSlug]);

  const phaseLabel = runtimeStateLabel(runtimeState);
  const isLobby = runtimeState === "lobby";
  const showFinalistsFooter =
    (runtimeState === "finals" || runtimeState === "winner") &&
    finalsShow?.phase !== "voting" &&
    finalsShow?.phase !== "voting_prep" &&
    finalsShow?.phase !== "results";

  const footerFinalists =
    finalsShow?.finalists?.length
      ? finalsShow.finalists
      : voting.current?.finalists?.length
        ? voting.current.finalists
        : finalists;

  const isQuiz = runtimeState === "quiz" && Boolean(quizState);
  const finalsFullBleed =
    (runtimeState === "finals" || runtimeState === "winner") &&
    (finalsShow?.phase === "challenge_intro" ||
      finalsShow?.phase === "voting" ||
      finalsShow?.phase === "voting_prep" ||
      finalsShow?.phase === "results");
  const hideBackgroundRoulette =
    runtimeState === "extraction" ||
    runtimeState === "matching" ||
    finalsShow?.phase === "couple_reveal" ||
    finalsShow?.phase === "challenge_intro" ||
    finalsShow?.phase === "voting" ||
    finalsShow?.phase === "voting_prep" ||
    finalsShow?.phase === "results";

  const { state: localMediaState, active: localMediaActive } =
    useRegiaLocalMediaReceiver(eventSlug);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevBodyMargin = body.style.margin;

    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.margin = "0";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      html.style.height = prevHtmlHeight;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      body.style.margin = prevBodyMargin;
    };
  }, []);

  return (
    <DisplayProjectorRoot
      embedMode={embedMode}
      presentMode={presentMode}
      className="fixed inset-0 bg-black outline-none"
    >
      <DisplayFixedCanvas>
        <div
          className="relative flex flex-col overflow-hidden text-foreground"
          style={{
            width: PROJECTOR_CANVAS.width,
            height: PROJECTOR_CANVAS.height,
          }}
        >
      <DisplayStageBackground
        logoScale={isLobby ? "full" : "compact"}
        quizPhase={isQuiz ? quizState!.displayPhase : null}
        hideBackgroundRoulette={hideBackgroundRoulette}
      />

      {finalsShow ? (
        <DisplayChallengeBackdrop
          challengeId={(finalsShow.challengeId as ChallengeId | null) ?? null}
          phase={finalsShow.phase}
        />
      ) : null}

      <DisplayLocalMediaLayer
        state={localMediaState}
        active={localMediaActive}
      />

      <DisplayProjectorHeader embedMode={embedMode} className={PROJECTOR_HEADER_CLASS}>
        <SessionSyncIndicator
          status={syncStatus}
          className="bg-black/35 backdrop-blur-sm text-white/90"
        />
        <Badge
          variant="outline"
          className="text-sm uppercase tracking-wider px-3 py-1.5 border-white/15 bg-black/35 backdrop-blur-sm"
        >
          {displayCode} · {phaseLabel}
        </Badge>
      </DisplayProjectorHeader>

      <main
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-8",
          runtimeState === "quiz" && quizState
            ? "items-stretch w-full"
            : runtimeState === "extraction" || runtimeState === "elimination"
              ? "items-stretch w-full h-full"
              : finalsFullBleed
                ? "items-stretch w-full px-6"
                : "items-center px-12",
          !isQuiz && !showFinalistsFooter && PROJECTOR_MAIN_BOTTOM_SAFE_CLASS,
        )}
      >
        {runtimeState === "matching" ? (
          <DisplayMatchingStage />
        ) : runtimeState === "extraction" ? (
          <DisplayExtractionStage lastReveal={lastReveal} />
        ) : runtimeState === "elimination" ? (
          <DisplayEliminationStage
            lastElimination={lastElimination}
            finalists={finalists}
          />
        ) : runtimeState === "quiz" && quizState ? (
          <DisplayQuizStage
            eventSlug={eventSlug}
            quizState={quizState}
            currentQuestion={currentQuestion}
            progressLabel={progressLabel}
            onQuizUpdate={applyQuizUpdate}
          />
        ) : runtimeState === "quiz" ? (
          <DisplayQuizLaunchInterstitial className="flex-1" />
        ) : runtimeState === "finals" || runtimeState === "winner" ? (
          finalsShow ? (
            <DisplayFinalsShowStage
              show={finalsShow}
              session={voting.current}
              remaining={finalsRemaining}
              runtimeState={runtimeState === "winner" ? "winner" : "finals"}
            />
          ) : (
            <DisplayFinalsStage
              session={voting.current}
              runtimeState={runtimeState === "winner" ? "winner" : "finals"}
              finalists={finalists}
            />
          )
        ) : runtimeState === "closed" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8">
            <DisplayPhaseHero
              kicker={CLOSED_COPY.displayKicker}
              headline={CLOSED_COPY.displayHeadline}
              subline={CLOSED_COPY.displaySubline}
              uppercase
            />
          </div>
        ) : isLobby ? (
          <div className="relative z-10 flex flex-1 w-full items-end pb-14 px-16 animate-fade-in">
            <div className="flex flex-col items-start gap-4 max-w-[320px]">
              <p className="text-left text-lg text-white/90 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                Scansiona il QR e preparati al gioco
              </p>
              <JoinQrCode url={effectiveJoinUrl} showUrl={false} size={240} />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-end text-center pb-20 animate-fade-in">
            <p className="text-4xl font-display text-white/90 drop-shadow-lg">
              {phaseLabel}
            </p>
          </div>
        )}
      </main>

      {showFinalistsFooter ? (
        <footer
          className={cn(
            "relative z-10 grid grid-cols-3 gap-5 px-8 py-6 border-t border-white/15 bg-black/55 backdrop-blur-md",
            PROJECTOR_FINALISTS_FOOTER_MIN_CLASS,
          )}
        >
          {(footerFinalists.length > 0
            ? footerFinalists
            : [
                {
                  pairId: "1",
                  maleNick: "Finalista 1",
                  femaleNick: "",
                  rank: 1,
                },
                {
                  pairId: "2",
                  maleNick: "Finalista 2",
                  femaleNick: "",
                  rank: 2,
                },
                {
                  pairId: "3",
                  maleNick: "Finalista 3",
                  femaleNick: "",
                  rank: 3,
                },
              ]
          )
            .slice(0, 3)
            .map((finalist, index) => {
              const label = finalist.femaleNick
                ? `${finalist.maleNick} & ${finalist.femaleNick}`
                : finalist.maleNick;
              const cumulative = finalsShow?.cumulativeScores[finalist.pairId];
              const roundVotes = voting.current?.counts[finalist.pairId];
              const scoreLabel =
                typeof cumulative === "number" && cumulative > 0
                  ? `${cumulative} pt`
                  : typeof roundVotes === "number"
                    ? `${roundVotes} voti`
                    : `#${index + 1}`;
              const activeCoupleIndex =
                finalsShow?.phase === "couple_reveal"
                  ? finalsShow.coupleIndex - 1
                  : -1;
              const isActive = index === activeCoupleIndex;

              return (
                <div
                  key={finalist.pairId}
                  className={cn(
                    "relative rounded-2xl border py-5 px-4 text-center transition-all duration-300",
                    isActive
                      ? "z-10 scale-[1.03] border-primary/70 bg-gradient-to-b from-primary/40 via-primary/20 to-black/75 shadow-[0_0_56px_rgba(233,30,140,0.55),0_16px_48px_rgba(0,0,0,0.55)] ring-4 ring-primary/70"
                      : activeCoupleIndex >= 0
                        ? "border-white/8 bg-black/30 opacity-30 shadow-none"
                        : "border-white/15 bg-black/50 opacity-100 shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
                  )}
                >
                  {isActive ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-primary/60 bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-[0_0_20px_rgba(233,30,140,0.65)]">
                      In pista
                    </span>
                  ) : null}
                  <p
                    className={cn(
                      "font-display font-bold text-white leading-tight",
                      isActive
                        ? "text-[clamp(1.75rem,3.2vw,3.25rem)]"
                        : "text-3xl md:text-5xl",
                    )}
                    style={{
                      fontFamily: "var(--font-display), serif",
                      textShadow: isActive
                        ? "0 4px 0 rgba(0,0,0,1), 0 0 40px rgba(233,30,140,0.85)"
                        : "0 3px 0 rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.95)",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    className={cn(
                      "mt-3 font-display font-bold tabular-nums",
                      isActive ? "text-3xl md:text-5xl text-white" : "text-4xl md:text-6xl text-primary",
                    )}
                    style={{
                      fontFamily: "var(--font-display), serif",
                      textShadow: isActive
                        ? "0 3px 0 rgba(0,0,0,1), 0 0 32px rgba(255,255,255,0.35)"
                        : "0 0 36px rgba(233,30,140,0.75)",
                    }}
                  >
                    {isActive ? `#${index + 1}` : scoreLabel}
                  </p>
                </div>
              );
            })}
        </footer>
      ) : null}

      <DisplayOverlay overlay={displayOverlay} joinUrl={effectiveJoinUrl} />
        </div>
      </DisplayFixedCanvas>
    </DisplayProjectorRoot>
  );
}
