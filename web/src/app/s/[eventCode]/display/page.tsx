"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { DisplayFinalsStage } from "@/components/display/DisplayFinalsStage";
import { DisplayOverlay } from "@/components/display/DisplayOverlay";
import { DisplayMatchingStage } from "@/components/display/DisplayMatchingStage";
import { DisplayQuizStage } from "@/components/display/DisplayQuizStage";
import { DisplayStageBackground } from "@/components/display/DisplayStageBackground";
import { JoinQrCode } from "@/components/display/JoinQrCode";
import { DisplayEliminationStage } from "@/components/display/DisplayEliminationStage";
import { DisplayExtractionStage } from "@/components/display/DisplayExtractionStage";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useLoveRouletteSession } from "@/hooks/useLoveRouletteSession";
import { runtimeStateLabel } from "@/lib/events";
import { isEventUuid, normalizeEventSlug } from "@/lib/musicpro/slug";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isDisplayEmbedMode } from "@/lib/display/embed";
import { PROJECTOR_CANVAS, PROJECTOR_HEADER_CLASS } from "@/lib/display/projector-canvas";
import { DisplayProjectorRoot } from "@/components/display/DisplayProjectorRoot";
import { DisplayProjectorHeader } from "@/components/display/DisplayProjectorHeader";
import { DisplayFixedCanvas } from "@/components/display/DisplayFixedCanvas";
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
    applyQuizUpdate,
  } = useLoveRouletteSession({
    eventSlug,
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
    runtimeState === "finals" || runtimeState === "winner";

  const footerFinalists =
    voting.current?.finalists?.length ? voting.current.finalists : finalists;

  const isQuiz = runtimeState === "quiz" && Boolean(quizState);

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
        hideBackgroundRoulette={
          runtimeState === "extraction" || runtimeState === "matching"
        }
      />

      <DisplayLocalMediaLayer
        state={localMediaState}
        active={localMediaActive}
      />

      <DisplayProjectorHeader embedMode={embedMode} className={PROJECTOR_HEADER_CLASS}>
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
              : "items-center px-12",
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
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16 md:pb-20">
            <DisplayPhaseHero
              kicker="Quiz"
              headline="Quiz in corso"
              subline="Rispondete dallo smartphone"
            />
          </div>
        ) : runtimeState === "finals" || runtimeState === "winner" ? (
          <DisplayFinalsStage
            session={voting.current}
            runtimeState={runtimeState === "winner" ? "winner" : "finals"}
          />
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
        <footer className="relative z-10 grid grid-cols-3 gap-4 px-8 py-5 border-t border-white/10 bg-black/40 backdrop-blur-sm">
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
              const votes = voting.current?.counts[finalist.pairId];
              return (
                <div
                  key={finalist.pairId}
                  className="rounded-xl py-4 text-center text-xl font-semibold bg-black/30 border border-white/10 text-white/80"
                >
                  {label}
                  <span className="block text-sm font-normal text-white/45 mt-1">
                    {typeof votes === "number"
                      ? `${votes} voti`
                      : `#${index + 1}`}
                  </span>
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
