"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DisplayStageBackground } from "@/components/display/DisplayStageBackground";
import { DisplayPhaseHero } from "@/components/display/DisplayShowText";
import { DisplaySiglaWarn } from "@/components/display/DisplaySiglaWarn";
import { DisplayThemeSlide } from "@/components/display/DisplayThemeSlide";
import { DisplayPlayerPresent } from "@/components/display/DisplayPlayerPresent";
import { DisplayQuizFooter } from "@/components/display/DisplayQuizFooter";
import { JoinQrCode } from "@/components/display/JoinQrCode";
import { PROJECTOR_CANVAS } from "@/lib/display/projector-canvas";
import {
  QUIZ_ANSWER_LETTER_CLASS,
  QUIZ_ANSWER_TEXT_CLASS,
  QUIZ_QUESTION_TEXT_CLASS,
} from "@/lib/display/quiz-display-typography";
import {
  QUIZ_ANSWER_SLIDE,
  QUIZ_QUESTION_SLIDE,
  quizAnswerEnterX,
  quizAnswersRevealMs,
} from "@/lib/display/quiz-reveal-motion";
import { projectorPreviewScale } from "@/lib/display/embed";
import {
  DEFAULT_SLIDES,
  SIGLA_SRC,
  type CasaSlide,
  type CasaSlideId,
} from "@/lib/admin/casa-slides";
import {
  probeSiglaMissing,
  shouldMountSiglaVideo,
} from "@/lib/admin/casa-sigla";
import { categoryThemeLabel, type QuizDisplayPhase } from "@/lib/musicpro/quiz-display";
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


const FALLBACK_QUIZ = {
  text: "In vacanza dove andate?",
  category: "lifestyle",
  options: ["Mare", "Montagna", "Città", "Casa"],
} as const;

type CasaQuizGate = "tema" | "play";

type Props = {
  eventCode: string;
  beat: CasaBeat;
  sigla: "idle" | "warn" | "on" | "hold";
  help: boolean;
  count: number | null;
  onStage: { nick: string; gender: "M" | "F"; photo?: string } | undefined;
  showPct?: boolean;
  enlarge?: boolean;
  slides?: Record<CasaSlideId, CasaSlide>;
  siglaSrc?: string;
  siglaVolume?: number;
  onSiglaEnded?: () => void;
  flash?: { who: string; text: string; photo?: string; say?: boolean } | null;
  spotlight?: CasaSpotlight | null;
  quizGate?: CasaQuizGate;
  /** Fase live allineata a /display e player (null = solo gate locale). */
  quizPhase?: QuizDisplayPhase | null;
  quizRemaining?: number | null;
  quizSecondsTotal?: number;
  quizQuestion?: {
    text: string;
    category: string;
    options: [string, string, string, string];
  } | null;
  mediaOnScreen?: { url: string; name: string; muted?: boolean } | null;
  onClearMediaOnScreen?: () => void;
};

function isVideoMedia(media: { url: string; name: string } | null | undefined) {
  if (!media) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(media.name) ||
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(media.url);
}

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
  quizGate = "tema",
  quizPhase = null,
  quizRemaining = null,
  quizSecondsTotal = 15,
  quizQuestion = null,
  mediaOnScreen = null,
  onClearMediaOnScreen,
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const [joinUrl, setJoinUrl] = useState(`/s/${eventCode}/play`);
  const [siglaMissing, setSiglaMissing] = useState(false);

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
  const siglaFullscreen = beat === "sigla" && (sigla === "on" || sigla === "hold");
  const mountSigla = siglaFullscreen && shouldMountSiglaVideo(siglaSrc, siglaMissing);
  const mediaVideoOn = Boolean(mediaOnScreen && isVideoMedia(mediaOnScreen));
  /** Never keep the ambient loop while another video is the hero. */
  const suspendBgVideo = mountSigla || mediaVideoOn || beat === "stacco";
  const theme = categoryThemeLabel(quizQuestion?.category ?? FALLBACK_QUIZ.category);
  const previewQuizPhase: QuizDisplayPhase | null =
    beat === "quiz"
      ? quizPhase ?? (quizGate === "tema" ? "theme_intro" : "answers")
      : null;

  useEffect(() => {
    let cancelled = false;
    setSiglaMissing(false);
    void probeSiglaMissing(siglaSrc).then((missing) => {
      if (!cancelled) setSiglaMissing(missing);
    });
    return () => {
      cancelled = true;
    };
  }, [siglaSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mountSigla) return;
    video.volume = Math.min(1, Math.max(0, siglaVolume));
  }, [siglaVolume, mountSigla, siglaSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mountSigla || beat !== "sigla") return;

    if (sigla === "on") {
      void video.play().catch(() => {
        // Autoplay / decode failure must NOT advance the show — flag missing UI.
        setSiglaMissing(true);
      });
    }
    if (sigla === "hold") {
      video.pause();
      if (video.duration && Number.isFinite(video.duration)) {
        video.currentTime = Math.max(0, video.duration - 0.05);
      }
    }

    return () => {
      video.pause();
    };
  }, [beat, sigla, siglaSrc, mountSigla]);

  return (
    <div
      ref={box}
      className="casa-screen theme-dark-fuchsia lr-display-type-root"
      data-enlarge={enlarge ? "1" : undefined}
    >
      <div
        className="casa-stage"
        style={{
          width: PROJECTOR_CANVAS.width,
          height: PROJECTOR_CANVAS.height,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <DisplayStageBackground
          logoScale={lobby ? "full" : "compact"}
          quizPhase={previewQuizPhase}
          hideBackgroundRoulette={
            siglaFullscreen || beat === "stacco" || beat === "quiz" || mediaVideoOn
          }
          suspendVideo={suspendBgVideo}
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
            <DisplaySiglaWarn />
          </div>
        ) : siglaFullscreen && (!mountSigla || siglaMissing) ? (
          <div className="casa-proj-center">
            <DisplayPhaseHero
              kicker="Sigla"
              headline="MANCA IL VIDEO"
              subline="Caricalo da Slide e sigla"
              uppercase
            />
          </div>
        ) : mountSigla ? (
          <video
            key={siglaSrc}
            ref={videoRef}
            className="casa-proj-sigla"
            src={siglaSrc}
            playsInline
            preload="metadata"
            onEnded={onSiglaEnded}
            onError={() => setSiglaMissing(true)}
          />
        ) : beat === "presenti" && onStage ? (
          <div className="casa-proj-center">
            <DisplayPlayerPresent
              nick={onStage.nick}
              gender={onStage.gender}
              photo={onStage.photo}
            />
          </div>
        ) : beat === "stacco" && count != null ? (
          <div className="casa-proj-count">{count}</div>
        ) : beat === "quiz" ? (
          <QuizPreview
            gate={quizGate}
            phase={quizPhase}
            remaining={quizRemaining}
            secondsTotal={quizSecondsTotal}
            question={quizQuestion}
            showPct={showPct}
            theme={theme}
          />
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

        {mediaOnScreen ? (
          <div className="casa-proj-media" data-casa-media-on="">
            {/\.(jpg|jpeg|png|gif|webp|avif|bmp)(\?|$)/i.test(mediaOnScreen.name) ||
            /\.(jpg|jpeg|png|gif|webp|avif|bmp)(\?|$)/i.test(mediaOnScreen.url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaOnScreen.url} alt={mediaOnScreen.name} />
            ) : (
              <video
                src={mediaOnScreen.url}
                autoPlay
                playsInline
                loop
                muted={mediaOnScreen.muted ?? true}
                preload="metadata"
                onError={() => onClearMediaOnScreen?.()}
              />
            )}
            {onClearMediaOnScreen ? (
              <button
                type="button"
                className="casa-proj-media-clear"
                onClick={onClearMediaOnScreen}
              >
                Chiudi media
              </button>
            ) : null}
          </div>
        ) : null}

        <CasaPlayerSpotlight spot={spotlight} />

        {flash && !spotlight ? (
          <div className="casa-proj-flash">
            <div className="casa-proj-plate" data-say={flash.say ? "1" : undefined}>
              {flash.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
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

function QuizPreview({
  gate,
  phase,
  remaining,
  secondsTotal,
  question,
  showPct,
  theme,
}: {
  gate: CasaQuizGate;
  phase: QuizDisplayPhase | null;
  remaining: number | null;
  secondsTotal: number;
  question: Props["quizQuestion"];
  showPct: boolean;
  theme: { title: string; subtitle: string };
}) {
  const body = (question?.text ?? FALLBACK_QUIZ.text).toUpperCase();
  const options = question?.options ?? FALLBACK_QUIZ.options;
  const category = question?.category ?? FALLBACK_QUIZ.category;
  const effective =
    phase ??
    (gate === "tema" ? "theme_intro" : "answers");

  if (effective === "start_countdown") {
    return (
      <div className="casa-proj-quiz-shell">
        <div className="casa-proj-center" aria-live="polite">
          <DisplayPhaseHero
            kicker="Si parte"
            headline={String(remaining ?? 0)}
            subline="Countdown avvio"
            uppercase
          />
        </div>
        <DisplayQuizFooter countdown={null} heartProgress={0.08} />
      </div>
    );
  }

  if (effective === "theme_intro") {
    return (
      <div className="casa-proj-quiz-shell">
        <div className="casa-proj-theme">
          <DisplayThemeSlide
            title={theme.title}
            subtitle={theme.subtitle}
            category={category}
            kicker="Manche"
          />
        </div>
        <DisplayQuizFooter countdown={null} heartProgress={0.12} />
      </div>
    );
  }

  if (effective === "question") {
    return (
      <div className="casa-proj-quiz-shell" data-phase="question">
        <div className="casa-proj-quiz">
          <motion.p
            className={QUIZ_QUESTION_TEXT_CLASS}
            initial={{ opacity: 0, x: QUIZ_QUESTION_SLIDE.fromX }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: QUIZ_QUESTION_SLIDE.duration,
              ease: QUIZ_QUESTION_SLIDE.ease,
            }}
          >
            {body}
          </motion.p>
          <div className="casa-proj-opts" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="casa-proj-opt casa-proj-opt-skel">
                <span className={QUIZ_ANSWER_LETTER_CLASS}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="casa-proj-skel-bar" />
              </div>
            ))}
          </div>
        </div>
        <DisplayQuizFooter countdown={null} heartProgress={0.16} />
      </div>
    );
  }

  if (effective === "next_question") {
    return (
      <div className="casa-proj-quiz-shell">
        <div className="casa-proj-center">
          <DisplayPhaseHero
            kicker="Classifica"
            headline="ACCOPPIAMENTO"
            subline="Provvisoria"
            uppercase
          />
        </div>
        <DisplayQuizFooter countdown={null} heartProgress={0.28} />
      </div>
    );
  }

  if (effective === "results") {
    return (
      <div className="casa-proj-quiz-shell" data-phase="results">
        <div className="casa-proj-quiz">
          <p className={QUIZ_QUESTION_TEXT_CLASS}>{body}</p>
          <div className="casa-proj-opts">
            {options.map((opt, i) => (
              <div key={`${opt}-${i}`} className="casa-proj-opt">
                <span className={QUIZ_ANSWER_LETTER_CLASS}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={QUIZ_ANSWER_TEXT_CLASS}>{opt.toUpperCase()}</span>
                <span className="casa-proj-pct">{[18, 31, 27, 24][i]}%</span>
              </div>
            ))}
          </div>
        </div>
        <DisplayQuizFooter countdown={null} heartProgress={0.24} />
      </div>
    );
  }

  // answers — countdown dopo reveal slide (allineato a /display)
  return (
    <QuizAnswersPreview
      body={body}
      options={options}
      remaining={remaining}
      secondsTotal={secondsTotal}
      showPct={showPct}
    />
  );
}

function QuizAnswersPreview({
  body,
  options,
  remaining,
  secondsTotal,
  showPct,
}: {
  body: string;
  options: readonly string[];
  remaining: number | null;
  secondsTotal: number;
  showPct: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [countdownReady, setCountdownReady] = useState(false);
  const locked = remaining != null && remaining <= 0;
  const total = Math.max(1, secondsTotal);
  const value = Math.max(0, remaining ?? total);

  useEffect(() => {
    setCountdownReady(false);
    if (reduceMotion) {
      setCountdownReady(true);
      return;
    }
    const timer = window.setTimeout(
      () => setCountdownReady(true),
      quizAnswersRevealMs(),
    );
    return () => window.clearTimeout(timer);
  }, [body, options, reduceMotion]);

  return (
    <div
      className="casa-proj-quiz-shell"
      data-phase="answers"
      data-locked={locked ? "1" : undefined}
    >
      <div className="casa-proj-quiz">
        <p className={QUIZ_QUESTION_TEXT_CLASS}>{body}</p>
        <div
          className={
            locked ? "casa-proj-opts casa-proj-opts-dim" : "casa-proj-opts"
          }
        >
          {options.map((opt, i) => (
            <motion.div
              key={`${opt}-${i}`}
              className="casa-proj-opt"
              initial={
                reduceMotion ? false : { opacity: 0, x: quizAnswerEnterX(i) }
              }
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: reduceMotion ? 0 : i * QUIZ_ANSWER_SLIDE.stagger,
                duration: QUIZ_ANSWER_SLIDE.duration,
                ease: QUIZ_ANSWER_SLIDE.ease,
              }}
            >
              <span className={QUIZ_ANSWER_LETTER_CLASS}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={QUIZ_ANSWER_TEXT_CLASS}>{opt.toUpperCase()}</span>
              {showPct ? (
                <span className="casa-proj-pct">{[18, 31, 27, 24][i]}%</span>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
      <DisplayQuizFooter
        countdown={countdownReady ? { value, total } : null}
        heartProgress={0.2}
      />
    </div>
  );
}
