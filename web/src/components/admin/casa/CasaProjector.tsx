"use client";

import { useEffect, useRef, useState } from "react";
import { DisplayStageBackground } from "@/components/display/DisplayStageBackground";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { JoinQrCode } from "@/components/display/JoinQrCode";
import { PROJECTOR_CANVAS } from "@/lib/display/projector-canvas";
import {
  QUIZ_ANSWER_LETTER_CLASS,
  QUIZ_ANSWER_TEXT_CLASS,
  QUIZ_QUESTION_TEXT_CLASS,
} from "@/lib/display/quiz-display-typography";
import { projectorPreviewScale } from "@/lib/display/embed";
import {
  DEFAULT_SLIDES,
  SIGLA_SRC,
  type CasaSlide,
  type CasaSlideId,
} from "@/lib/admin/casa-slides";
import {
  CasaPlayerSpotlight,
  type CasaSpotlight,
} from "@/components/admin/casa/CasaPlayerSpotlight";

export type CasaBeat =
  | "casa"
  | "sigla"
  | "pres"
  | "regole"
  | "finale"
  | "premio"
  | "sponsor"
  | "stasera"
  | "presenti"
  | "stacco"
  | "quiz";


const QUIZ = {
  question: "IN VACANZA DOVE ANDATE?",
  options: ["MARE", "MONTAGNA", "CITTÀ", "CASA"],
} as const;

type Props = {
  eventCode: string;
  beat: CasaBeat;
  sigla: "idle" | "warn" | "on" | "hold";
  help: boolean;
  count: number | null;
  onStage: { nick: string; gender: "M" | "F" } | undefined;
  showPct?: boolean;
  enlarge?: boolean;
  slides?: Record<CasaSlideId, CasaSlide>;
  siglaSrc?: string;
  siglaVolume?: number;
  onSiglaEnded?: () => void;
  flash?: { who: string; text: string; photo?: string; say?: boolean } | null;
  spotlight?: CasaSpotlight | null;
};

export function CasaProjector({
  eventCode,
  beat,
  sigla,
  help,
  count,
  onStage,
  showPct = false,
  enlarge = false,
  slides = DEFAULT_SLIDES,
  siglaSrc = SIGLA_SRC,
  siglaVolume = 0.7,
  onSiglaEnded,
  flash = null,
  spotlight = null,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [joinUrl, setJoinUrl] = useState(`/s/${eventCode}/play`);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/s/${eventCode}/play`);
  }, [eventCode]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      setScale(projectorPreviewScale(r.width, r.height));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const slide = beat in slides ? slides[beat as CasaSlideId] : undefined;
  const lobby = beat === "casa" || help;
  const fullVideo = beat === "sigla" && (sigla === "on" || sigla === "hold");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, siglaVolume));
  }, [siglaVolume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || beat !== "sigla") return;
    if (sigla === "on") {
      void video.play().catch(() => onSiglaEnded?.());
    }
    if (sigla === "hold") {
      video.pause();
      if (video.duration && Number.isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
    }
  }, [beat, sigla, siglaSrc, onSiglaEnded]);

  return (
    <div
      ref={box}
      className="casa-screen theme-dark-fuchsia"
      data-enlarge={enlarge ? "1" : undefined}
    >
      <div
        className="casa-stage"
        style={{
          width: PROJECTOR_CANVAS.width,
          height: PROJECTOR_CANVAS.height,
          transform: `scale(${scale})`,
        }}
      >
        <DisplayStageBackground
          logoScale={lobby ? "full" : "compact"}
          hideBackgroundRoulette={fullVideo || beat === "stacco" || beat === "quiz"}
        />

        {help ? (
          <div className="casa-proj-help">
            <div className="casa-proj-plate">
              <p className="casa-proj-kicker">Come si entra</p>
              <p className="casa-proj-title">WI‑FI + QR</p>
              <p className="casa-proj-line">Rete della sala · password all’ingresso</p>
              <JoinQrCode url={joinUrl} showUrl={false} size={280} />
            </div>
          </div>
        ) : beat === "casa" ? (
          <div className="casa-proj-lobby">
            <p className="casa-proj-line">Scansiona il QR e preparati al gioco</p>
            <JoinQrCode url={joinUrl} showUrl={false} size={240} />
          </div>
        ) : beat === "sigla" && sigla === "warn" ? (
          <div className="casa-proj-center">
            <DisplayPhaseHero kicker="Tra un attimo" headline="SIGLA" uppercase />
          </div>
        ) : beat === "sigla" && (sigla === "on" || sigla === "hold") ? (
          <video
            ref={videoRef}
            className="casa-proj-sigla"
            src={siglaSrc}
            playsInline
            onEnded={onSiglaEnded}
            onError={() => onSiglaEnded?.()}
          />
        ) : beat === "presenti" && onStage ? (
          <div className="casa-proj-center">
            <DisplayPhaseHero
              kicker={onStage.gender}
              headline={onStage.nick.toUpperCase()}
              uppercase
            />
          </div>
        ) : beat === "stacco" && count != null ? (
          <div className="casa-proj-count">{count}</div>
        ) : beat === "quiz" ? (
          <div className="casa-proj-quiz">
            <p className={QUIZ_QUESTION_TEXT_CLASS}>{QUIZ.question}</p>
            <div className="casa-proj-opts">
              {QUIZ.options.map((opt, i) => (
                <div key={opt} className="casa-proj-opt">
                  <span className={QUIZ_ANSWER_LETTER_CLASS}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={QUIZ_ANSWER_TEXT_CLASS}>{opt}</span>
                  {showPct ? <span className="casa-proj-pct">{[18, 31, 27, 24][i]}%</span> : null}
                </div>
              ))}
            </div>
          </div>
        ) : slide ? (
          <div className="casa-proj-center">
            <DisplayPhaseHero
              kicker={slide.kicker}
              headline={slide.headline}
              subline={slide.sub}
              uppercase
            />
          </div>
        ) : null}

        <CasaPlayerSpotlight spot={spotlight} />

        {flash && !spotlight ? (
          <div className="casa-proj-flash">
            <div className="casa-proj-plate" data-say={flash.say ? "1" : undefined}>
              {flash.photo ? (
                <img className="casa-proj-face" src={flash.photo} alt="" />
              ) : null}
              {flash.say ? (
                <>
                  <p className="casa-proj-who">{flash.who}</p>
                  <p className="casa-proj-dice">Dice</p>
                  <p className="casa-proj-said">{flash.text}</p>
                </>
              ) : (
                <>
                  <p className="casa-proj-kicker">{flash.who}</p>
                  <p className="casa-proj-title">{flash.text}</p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {enlarge ? <span className="casa-pgm">PGM · 16:9</span> : null}
    </div>
  );
}
