"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  useVisualViewportRect,
  visualViewportOverlayStyle,
} from "@/hooks/useVisualViewportRect";
import { useCurrentQuizQuestion } from "@/hooks/useQuizQuestions";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import { CasaProjector } from "@/components/admin/casa/CasaProjector";
import type { CasaSpotlight } from "@/components/admin/casa/CasaPlayerSpotlight";
import { CasaPrep } from "@/components/admin/casa/CasaPrep";
import { CasaQuestions } from "@/components/admin/casa/CasaQuestions";
import { CasaSocialPanel } from "@/components/admin/casa/social/CasaSocialPanel";
import { CasaSoftBoundary } from "@/components/admin/casa/CasaSoftBoundary";
import { CasaLayoutBar } from "@/components/admin/casa/widgets/CasaLayoutBar";
import { CasaWidgetDeck } from "@/components/admin/casa/widgets/CasaWidgetDeck";
import { CasaWidgetGallery } from "@/components/admin/casa/widgets/CasaWidgetGallery";
import {
  findAddPlacement,
  isCompactPlanciaView,
  nextStableDeckView,
} from "@/components/admin/casa/widgets/layout-math";
import { widgetMeta } from "@/components/admin/casa/widgets/widget-registry";
import { WidgetConductor } from "@/components/admin/casa/widgets/WidgetConductor";
import { WidgetTransport } from "@/components/admin/casa/widgets/WidgetTransport";
import { WidgetCue } from "@/components/admin/casa/widgets/WidgetCue";
import { WidgetExtraction } from "@/components/admin/casa/widgets/WidgetExtraction";
import { WidgetFinals } from "@/components/admin/casa/widgets/WidgetFinals";
import { WidgetLeaderboard } from "@/components/admin/casa/widgets/WidgetLeaderboard";
import { WidgetPanic } from "@/components/admin/casa/widgets/WidgetPanic";
import { WidgetPreflight } from "@/components/admin/casa/widgets/WidgetPreflight";
import { WidgetQuizRegia } from "@/components/admin/casa/widgets/WidgetQuizRegia";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { JoinQrCode } from "@/components/display/JoinQrCode";
import {
  fetchParticipants,
  patchEventConfig,
  postDisplayAudioStart,
  postDisplayCommand,
} from "@/lib/admin/animator-api";
import { DEFAULT_CASA_PREP, loadPrep, savePrep, type CasaPrep as Prep } from "@/lib/admin/casa-prep";
import {
  DEFAULT_CASA_CLOCK,
  formatElapsed,
  formatExact,
  loadClock,
  saveClock,
  type CasaClockPrefs,
} from "@/lib/admin/casa-clock";
import {
  CASA_PAD_HITS,
  prefetchCasaPadHits,
  toggleCasaPadHit,
  type CasaPadHitId,
} from "@/lib/admin/casa-pad-sfx";
import {
  applyAudioSink,
  canPickCasaLocalAudioOutput,
  casaAudioOptionId,
  DEFAULT_CASA_AUDIO_ROUTE,
  PROJECTOR_AUDIO_ROUTE,
  VERCEL_AUDIO_ROUTE,
  isRemoteAudioRoute,
  listCasaAudioOutputs,
  loadCasaAudioRoute,
  pickCasaLocalAudioOutput,
  saveCasaAudioRoute,
  type CasaAudioOutputOption,
  type CasaAudioRoute,
} from "@/lib/admin/casa-audio-route";
import { avantiLabel, stepAvanti } from "@/lib/admin/casa-avanti";
import { casaAutoBedLabel, resolveCasaBed } from "@/lib/admin/casa-beds";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_PROFILE_ID,
  createDefaultState,
  createId,
  getActiveProfile,
  loadLayouts,
  mapWidgetsBetweenCanvas,
  nearestSize,
  saveLayouts,
  sizeToPx,
  UNIQUE_WIDGET_TYPES,
  updateActiveWidgets,
  widgetLayoutPx,
  WIDGET_COLLAPSED_H,
  WIDGET_LABELS,
  WIDGET_MIN_H,
  WIDGET_MIN_W,
  type CasaLayoutsState,
  type CasaWidgetInstance,
  type CasaWidgetType,
} from "@/lib/admin/casa-layouts";
import {
  DEFAULT_GONG_ATMOSPHERE,
  DEFAULT_VIDEO,
  isAudioFile,
  nextIndex,
  pickDirectoryFiles,
  revokeTracks,
  tracksFromFiles,
  type CasaGongAtmosphere,
  type CasaMediaTrack,
  type CasaRepeatMode,
  type CasaVideoState,
} from "@/lib/admin/casa-media";
import {
  getNote,
  loadNotes,
  saveNotes,
  setNote,
  type CasaNotesState,
} from "@/lib/admin/casa-notes";
import {
  DEFAULT_CASA_QUESTIONS,
  loadQuestions,
  type CasaQuestion,
} from "@/lib/admin/casa-questions";
import {
  DEFAULT_MANCHE,
  DEFAULT_SECONDS,
  MANCHE_MAX,
  MANCHE_MIN,
  SECONDS,
} from "@/lib/admin/casa-quiz-settings";
import {
  DEFAULT_SLIDES,
  SIGLA_SRC,
  SLIDE_LABELS,
  SLIDE_ORDER,
  loadSlides,
  saveSlides,
  type CasaSlide,
  type CasaSlideId,
} from "@/lib/admin/casa-slides";
import "@/components/admin/casa/casa.css";

type Beat =
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

type Gender = "M" | "F";
type Guest = {
  id: string;
  nick: string;
  gender: Gender;
  photo?: string;
  score: number;
  muted?: boolean;
};
type Panel =
  | "nick"
  | "audio"
  | "pad"
  | "preview"
  | "setup"
  | "questions"
  | "quiz"
  | "prep"
  | "msg"
  | "screen"
  | "gear"
  | "clock"
  | "social"
  | null;

const AVATAR_M = "/grafiche/avatar-m.png";
const AVATAR_F = "/grafiche/avatar-f.png";

function defaultFace(gender?: Gender) {
  return gender === "F" ? AVATAR_F : AVATAR_M;
}

function CasaFace({
  photo,
  nick,
  gender,
}: {
  photo?: string;
  nick?: string;
  gender?: Gender;
}) {
  return (
    <span className="casa-face">
      <img src={photo || defaultFace(gender)} alt={nick ?? ""} />
    </span>
  );
}

function CasaHead({
  children,
  onOpen,
}: {
  children: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="casa-h" onClick={onOpen}>
      {children}
    </button>
  );
}

function SetupFields({
  manche,
  seconds,
  mustAnswer,
  onManche,
  onSeconds,
  onMustAnswer,
}: {
  manche: number;
  seconds: number;
  mustAnswer: boolean;
  onManche: (n: number) => void;
  onSeconds: (n: (typeof SECONDS)[number]) => void;
  onMustAnswer: () => void;
}) {
  return (
    <>
      <div className="casa-setup-row">
        <span>Domande</span>
        <div className="casa-stepper">
          <button
            type="button"
            className="casa-stepper-btn"
            onClick={() => onManche(manche - 1)}
          >
            −
          </button>
          <strong>{manche}</strong>
          <button
            type="button"
            className="casa-stepper-btn"
            onClick={() => onManche(manche + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className="casa-setup-row">
        <span>Secondi</span>
        <div className="casa-secs">
          {SECONDS.map((n) => (
            <button
              key={n}
              type="button"
              className="casa-sec"
              data-on={seconds === n ? "1" : undefined}
              onClick={() => onSeconds(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="casa-setup-row">
        <span>Obbligo di risposta</span>
        <button
          type="button"
          className="casa-sec casa-sec-wide"
          data-on={mustAnswer ? "1" : undefined}
          onClick={onMustAnswer}
        >
          {mustAnswer ? "On" : "Off"}
        </button>
      </div>
    </>
  );
}

const BEATS: { id: Beat; label: string; go: string }[] = [
  { id: "casa", label: "Casa", go: "Sigla" },
  { id: "sigla", label: "Sigla", go: "Presentazione" },
  { id: "pres", label: "Show", go: "Regole" },
  { id: "regole", label: "Regole", go: "La finale" },
  { id: "finale", label: "Finale", go: "Premio" },
  { id: "premio", label: "Premio", go: "Sponsor" },
  { id: "sponsor", label: "Sponsor", go: "Stasera" },
  { id: "stasera", label: "Stasera", go: "Presenti" },
  { id: "presenti", label: "Presenti", go: "Si comincia" },
  { id: "stacco", label: "Stacco", go: "Prima domanda" },
  { id: "quiz", label: "Quiz", go: "Avanti" },
];

const SEED: Guest[] = [
  { id: "1", nick: "Marco", gender: "M", score: 0 },
  { id: "2", nick: "Giulia", gender: "F", score: 0 },
  { id: "3", nick: "Luca", gender: "M", score: 0 },
  { id: "4", nick: "Sara", gender: "F", score: 0 },
];

const LINE: Record<Beat, string> = {
  casa: "La sala si siede. Tu sistemi i nick.",
  sigla: "Tu zitto. Video + audio.",
  pres: "Parli sopra. AVANTI quando hai finito.",
  regole: "Parli sopra.",
  finale: "Come si vince. In bocca al lupo.",
  premio: "Extra. Puoi saltare.",
  sponsor: "Extra. Puoi saltare.",
  stasera: "Invito in sala. Poi i nomi.",
  presenti: "Uno alla volta. AVANTI a fine battuta.",
  stacco: "5–4–3–2–1 e si parte.",
  quiz: "Manche in corso.",
};

function quizLine(gate: "tema" | "play") {
  return gate === "tema"
    ? "Slide categoria. AVANTI per la domanda."
    : "Manche in corso.";
}

const FADERS = [
  { id: "sigla", label: "Sigla" },
  { id: "bed", label: "Sottofondo" },
  { id: "fx", label: "Effetti sonori" },
] as const;

function cycleRepeat(mode: CasaRepeatMode): CasaRepeatMode {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
}

function repeatTitle(mode: CasaRepeatMode): string {
  if (mode === "one") return "Ripeti uno";
  if (mode === "all") return "Ripeti tutti";
  return "Ripeti (off)";
}

function MediaIco({
  label,
  onClick,
  disabled,
  on,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  on?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="casa-hit casa-hit-ico"
      aria-label={label}
      title={label}
      disabled={disabled}
      data-on={on ? "1" : undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function IcoPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M10 8.2v7.6L16.4 12 10 8.2z" fill="currentColor" />
    </svg>
  );
}

function IcoPause() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <rect x="7" y="6" width="3.5" height="12" rx="1" />
      <rect x="13.5" y="6" width="3.5" height="12" rx="1" />
    </svg>
  );
}

function IcoStop() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <rect x="7" y="7" width="10" height="10" rx="1.2" />
    </svg>
  );
}

function IcoPrev() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M14.8 6.2L8.5 12l6.3 5.8V6.2z" />
      <rect x="6.2" y="6.5" width="2" height="11" rx="0.6" />
    </svg>
  );
}

function IcoNext() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M9.2 6.2L15.5 12 9.2 17.8V6.2z" />
      <rect x="15.8" y="6.5" width="2" height="11" rx="0.6" />
    </svg>
  );
}

function IcoRepeat({ one }: { one?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <path
        d="M17 1.8l3.8 3.7L17 9.2"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 11.2V8.6A4.6 4.6 0 018.6 4h12.2"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7 22.2l-3.8-3.7L7 14.8"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12.8v2.6A4.6 4.6 0 0115.4 20H3.2"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      {one ? (
        <text
          x="12"
          y="13.6"
          textAnchor="middle"
          fill="currentColor"
          stroke="none"
          fontSize="8"
          fontWeight="800"
        >
          1
        </text>
      ) : null}
    </svg>
  );
}

function IcoFolder() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M3.5 6.5A2 2 0 015.5 4.5h4.2l1.6 1.7h7.2a2 2 0 012 2v9.1a2 2 0 01-2 2h-13a2 2 0 01-2-2V6.5z" />
    </svg>
  );
}

function IcoFile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 3.5h6.2L18.5 9v11.5a1.5 1.5 0 01-1.5 1.5H7A1.5 1.5 0 015.5 20.5v-15A1.5 1.5 0 017 3.5zm5.8 1.2v4.8h4.7l-4.7-4.8z" />
    </svg>
  );
}

function IcoClear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <path
        d="M7 7l10 10M17 7L7 17"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoMute() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4.5 9.2h3.2L12 5.8v12.4l-4.3-3.4H4.5V9.2z" />
      <path
        d="M16.2 9.2l5.1 5.1M21.3 9.2l-5.1 5.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoUnmute() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4.5 9.2h3.2L12 5.8v12.4l-4.3-3.4H4.5V9.2z" />
      <path
        d="M15.2 9.4a3.6 3.6 0 010 5.2M17.4 7.2a6.4 6.4 0 010 9.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IcoScreenOff() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="11"
        rx="1.5"
        strokeWidth="1.75"
      />
      <path d="M9 19.5h6" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M6 7l12 10"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PadHits({
  active,
  muted,
  onToggle,
}: {
  active: ReadonlySet<string>;
  muted: boolean;
  onToggle: (id: CasaPadHitId) => void;
}) {
  return (
    <div className="casa-pad">
      {CASA_PAD_HITS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="casa-pad-btn"
          data-on={active.has(p.id) ? "1" : undefined}
          onClick={() => {
            if (muted) return;
            onToggle(p.id);
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function formatMmSs(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function CasaPad({ eventCode }: { eventCode: string }) {
  const live = useCasaLiveSession();
  const [beat, setBeat] = useState<Beat>("casa");
  const [guests, setGuests] = useState<Guest[]>(SEED);
  const [query, setQuery] = useState("");
  const [help, setHelp] = useState(false);
  const [sigla, setSigla] = useState<"idle" | "warn" | "on" | "hold">("idle");
  const [count, setCount] = useState<number | null>(null);
  const [roll, setRoll] = useState(0);
  const [manche, setManche] = useState(DEFAULT_MANCHE);
  const [seconds, setSeconds] = useState<(typeof SECONDS)[number]>(DEFAULT_SECONDS);
  const [mustAnswer, setMustAnswer] = useState(false);
  const [prep, setPrep] = useState<Prep>(DEFAULT_CASA_PREP);
  const [showPct, setShowPct] = useState(false);
  const [left, setLeft] = useState(DEFAULT_MANCHE);
  const [quizGate, setQuizGate] = useState<"tema" | "play">("tema");
  const [pack, setPack] = useState<CasaQuestion[]>(DEFAULT_CASA_QUESTIONS);
  const [goBusy, setGoBusy] = useState(false);
  const [goError, setGoError] = useState<string | null>(null);
  const [open, setOpen] = useState<Panel>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [killAsk, setKillAsk] = useState(false);
  const [vols, setVols] = useState({ sigla: 70, bed: 45, fx: 55 });
  const [hits, setHits] = useState<Set<CasaPadHitId>>(() => new Set());
  const [screen, setScreen] = useState("loop");
  const [msgFilter, setMsgFilter] = useState(false);
  const [msgs, setMsgs] = useState([
    { id: "1", ini: "A", who: "Anonimo", text: "come si entra?" },
    { id: "2", ini: "W", who: "Anonimo", text: "dov’è il Wi‑Fi?" },
    { id: "3", ini: "L", who: "Luca", text: "si parte o no?" },
  ]);
  const [msgQueue, setMsgQueue] = useState<
    { id: string; ini: string; who: string; text: string; photo?: string; say?: boolean }[]
  >([]);
  const [spotlight, setSpotlight] = useState<CasaSpotlight | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [clockPrefs, setClockPrefs] = useState<CasaClockPrefs>(() => ({
    ...DEFAULT_CASA_CLOCK,
    originMs: Date.now(),
  }));
  const [mute, setMute] = useState<Record<(typeof FADERS)[number]["id"], boolean>>({
    sigla: false,
    bed: false,
    fx: false,
  });
  const [bedFolder, setBedFolder] = useState<string | null>(null);
  const [bedList, setBedList] = useState<CasaMediaTrack[]>([]);
  const [bedIndex, setBedIndex] = useState(0);
  const [bedRepeat, setBedRepeat] = useState<CasaRepeatMode>("all");
  const [bedPlaying, setBedPlaying] = useState(true);
  const [gongAtmo, setGongAtmo] = useState<CasaGongAtmosphere>(DEFAULT_GONG_ATMOSPHERE);
  const [videoState, setVideoState] = useState<CasaVideoState>(DEFAULT_VIDEO);
  const [masterVol, setMasterVol] = useState(100);
  const [layoutEdit, setLayoutEdit] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [layouts, setLayouts] = useState<CasaLayoutsState>(createDefaultState);
  const [deckView, setDeckView] = useState({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT });
  const [audioRoute, setAudioRoute] = useState<CasaAudioRoute>(
    DEFAULT_CASA_AUDIO_ROUTE,
  );
  const [audioOutputs, setAudioOutputs] = useState<CasaAudioOutputOption[]>([
    { id: "local:default", route: DEFAULT_CASA_AUDIO_ROUTE },
    { id: "projector", route: PROJECTOR_AUDIO_ROUTE },
    { id: "vercel", route: VERCEL_AUDIO_ROUTE },
  ]);
  const [notes, setNotes] = useState<CasaNotesState>(() =>
    typeof window === "undefined" ? { byInstanceId: {} } : loadNotes(),
  );
  const [freeTimerSec, setFreeTimerSec] = useState(0);
  const [freeTimerRun, setFreeTimerRun] = useState(false);
  const [quizLeftSec, setQuizLeftSec] = useState(DEFAULT_SECONDS);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [siglaSrc, setSiglaSrc] = useState(SIGLA_SRC);
  const [joinUrl, setJoinUrl] = useState(`/s/${eventCode}/play`);
  const siglaFile = useRef<HTMLInputElement>(null);
  const shotFile = useRef<HTMLInputElement>(null);
  const libFile = useRef<HTMLInputElement>(null);
  const bedAudio = useRef<HTMLAudioElement | null>(null);
  const gongAudioRef = useRef<HTMLAudioElement | null>(null);
  const bedInput = useRef<HTMLInputElement>(null);
  const bedFilesInput = useRef<HTMLInputElement>(null);
  const gongInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const deckWrapRef = useRef<HTMLDivElement>(null);
  const expandViewport = useVisualViewportRect(open != null);
  const videoTapRef = useRef<{ url: string; at: number } | null>(null);

  const index = BEATS.findIndex((b) => b.id === beat);
  const current = BEATS[index] ?? BEATS[0];
  const next = BEATS[index + 1];
  const onStage = guests[roll];
  const asked = Math.max(0, manche - left);
  const currentQ = pack[asked] ?? pack[pack.length - 1] ?? DEFAULT_CASA_QUESTIONS[0];

  const liveQuizActive =
    live.runtimeState === "quiz" && Boolean(live.quizState);
  const { displayPhase: liveQuizPhase } = useQuizPhaseSync({
    eventSlug: eventCode,
    quizState: live.quizState,
    enabled: liveQuizActive && !live.controlsDisabled,
    driveTicks: false,
  });
  const { currentQuestion: liveQuestion } = useCurrentQuizQuestion(
    eventCode,
    live.quizState,
    live.runtimeState,
  );
  const projectorQuizGate: "tema" | "play" = liveQuizActive
    ? liveQuizPhase === "theme_intro" || liveQuizPhase === "start_countdown"
      ? "tema"
      : "play"
    : quizGate;
  const projectorQuestion =
    liveQuizActive && liveQuestion
      ? {
          text: liveQuestion.body,
          category: liveQuestion.category,
          options: [
            liveQuestion.options[0]?.label ?? "",
            liveQuestion.options[1]?.label ?? "",
            liveQuestion.options[2]?.label ?? "",
            liveQuestion.options[3]?.label ?? "",
          ] as [string, string, string, string],
        }
      : currentQ;

  const activeProfile = getActiveProfile(layouts);
  const compactDeck = isCompactPlanciaView(deckView.w, deckView.h);
  const fitPhone =
    compactDeck && layouts.activeId === DEFAULT_PROFILE_ID;
  const deckCanvasW = fitPhone ? Math.round(deckView.w) : CANVAS_WIDTH;
  const deckCanvasH = fitPhone ? Math.round(deckView.h) : CANVAS_HEIGHT;
  const activeWidgets = fitPhone
    ? mapWidgetsBetweenCanvas(
        activeProfile.widgets,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        deckCanvasW,
        deckCanvasH,
      )
    : activeProfile.widgets;
  const remoteAudio = isRemoteAudioRoute(audioRoute);
  const masterScale = masterVol / 100;
  const effVol = (id: (typeof FADERS)[number]["id"]) =>
    mute[id] ? 0 : (vols[id] / 100) * masterScale;

  const activeBed = useMemo(
    () => resolveCasaBed(beat, bedFolder ? bedList : null, bedIndex),
    [beat, bedFolder, bedList, bedIndex],
  );
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? guests.filter((g) => g.nick.toLowerCase().includes(q)) : guests;
  }, [guests, query]);

  function commitLayouts(nextLayouts: CasaLayoutsState) {
    setLayouts(nextLayouts);
    saveLayouts(nextLayouts);
  }

  function storeDeckWidgets(widgets: CasaWidgetInstance[]) {
    const stored = fitPhone
      ? mapWidgetsBetweenCanvas(
          widgets,
          deckCanvasW,
          deckCanvasH,
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
        )
      : widgets;
    commitLayouts(updateActiveWidgets(layouts, stored));
  }

  function commitNotes(nextNotes: CasaNotesState) {
    setNotes(nextNotes);
    saveNotes(nextNotes);
  }

  function stopGongAtmo() {
    const el = gongAudioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  useEffect(() => {
    setLayouts(loadLayouts());
    setNotes(loadNotes());
  }, []);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/s/${eventCode}/play`);
  }, [eventCode]);

  useEffect(() => {
    prefetchCasaPadHits();
  }, []);

  useEffect(() => {
    setAudioRoute(loadCasaAudioRoute());
    const refreshOutputs = () => {
      void listCasaAudioOutputs().then(setAudioOutputs);
    };
    refreshOutputs();
    const devices = navigator.mediaDevices;
    if (!devices?.addEventListener) return;
    devices.addEventListener("devicechange", refreshOutputs);
    return () => devices.removeEventListener("devicechange", refreshOutputs);
  }, []);

  useEffect(() => {
    const wrap = deckWrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      setDeckView((prev) => nextStableDeckView(prev, { w: r.width, h: r.height }) ?? prev);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (open !== "audio") return;
    void listCasaAudioOutputs().then(setAudioOutputs);
  }, [open]);

  useEffect(() => {
    void applyAudioSink(bedAudio.current, audioRoute);
    void applyAudioSink(gongAudioRef.current, audioRoute);
  }, [audioRoute]);

  useEffect(() => {
    if (live.controlsDisabled || !live.pin) return;
    void postDisplayAudioStart(eventCode, live.pin, remoteAudio);
  }, [remoteAudio, eventCode, live.pin, live.controlsDisabled]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!freeTimerRun) return;
    const id = window.setInterval(() => setFreeTimerSec((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [freeTimerRun]);

  useEffect(() => {
    if (beat !== "quiz" || quizGate !== "play") {
      setQuizLeftSec(seconds);
      return;
    }
    setQuizLeftSec(seconds);
    const id = window.setInterval(() => {
      setQuizLeftSec((n) => Math.max(0, n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [beat, quizGate, seconds, asked]);

  useEffect(() => {
    setSlides(loadSlides(eventCode));
    setPrep(loadPrep(eventCode));
    setClockPrefs(loadClock(eventCode));
    setPack(loadQuestions(eventCode));
  }, [eventCode]);

  // Warm Generatore / question pool so AVANTI → start quiz is not empty.
  useEffect(() => {
    if (!live.pinReady) return;
    void fetch(`/api/events/${encodeURIComponent(eventCode)}/questions`);
  }, [eventCode, live.pinReady]);

  // Live roster for presenti cards (fallback SEED only while empty / offline).
  useEffect(() => {
    if (!live.pinReady) return;
    let cancelled = false;

    async function loadRoster() {
      try {
        const res = await fetchParticipants(eventCode, live.pin);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          participants?: {
            id: string;
            nickname: string;
            gender: "male" | "female";
          }[];
        };
        const rows = data.participants ?? [];
        if (cancelled || rows.length === 0) return;
        setGuests(
          rows.map((p) => ({
            id: p.id,
            nick: p.nickname,
            gender: p.gender === "female" ? "F" : "M",
            score: 0,
          })),
        );
      } catch {
        // keep SEED / last roster
      }
    }

    void loadRoster();
    const id = window.setInterval(() => void loadRoster(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [eventCode, live.pin, live.pinReady]);

  // Push opening slides / presenti cards to the real /display (sticky overlay).
  useEffect(() => {
    if (!live.pinReady || live.controlsDisabled) return;
    if (live.runtimeState !== "lobby") return;

    const slideIds: CasaSlideId[] = [
      "pres",
      "regole",
      "finale",
      "premio",
      "sponsor",
      "stasera",
    ];

    async function pushOverlay() {
      try {
        if (beat === "casa" || help) {
          await postDisplayCommand(eventCode, { type: "show_qr" }, live.pin);
          return;
        }
        if (beat === "sigla" && sigla === "warn") {
          await postDisplayCommand(
            eventCode,
            { type: "slide", kicker: "Tra un attimo", title: "SIGLA" },
            live.pin,
          );
          return;
        }
        if (beat === "sigla") {
          await postDisplayCommand(eventCode, { type: "clear" }, live.pin);
          return;
        }
        if (beat === "presenti" && onStage) {
          await postDisplayCommand(
            eventCode,
            {
              type: "slide",
              kicker: onStage.gender,
              title: onStage.nick.toUpperCase(),
            },
            live.pin,
          );
          return;
        }
        if (beat === "stacco") {
          await postDisplayCommand(
            eventCode,
            {
              type: "slide",
              kicker: "Si parte",
              title: count != null ? String(count) : "…",
            },
            live.pin,
          );
          return;
        }
        if (slideIds.includes(beat as CasaSlideId)) {
          const slide = slides[beat as CasaSlideId];
          await postDisplayCommand(
            eventCode,
            {
              type: "slide",
              kicker: slide.kicker,
              title: slide.headline,
              body: slide.sub || "",
            },
            live.pin,
          );
          return;
        }
        if (beat === "quiz") {
          // Local tema still in lobby — show theme on maxi until start succeeds.
          const theme = currentQ;
          await postDisplayCommand(
            eventCode,
            {
              type: "slide",
              kicker: "Manche",
              title: theme.category.toUpperCase(),
              body: theme.text.slice(0, 120),
            },
            live.pin,
          );
        }
      } catch {
        // non-blocking: preview still works
      }
    }

    void pushOverlay();
  }, [
    beat,
    count,
    currentQ,
    eventCode,
    help,
    live.controlsDisabled,
    live.pin,
    live.pinReady,
    live.runtimeState,
    onStage,
    sigla,
    slides,
  ]);

  useEffect(() => {
    if (open === "questions") return;
    setPack(loadQuestions(eventCode));
  }, [open, eventCode]);

  const flash = msgQueue[0] ?? null;

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => {
      setMsgQueue((q) => q.slice(1));
    }, prep.luciFlashSec * 1000);
    return () => window.clearTimeout(id);
  }, [flash, prep.luciFlashSec]);

  useEffect(() => {
    if (!spotlight) return;
    const id = window.setTimeout(() => setSpotlight(null), prep.luciFlashSec * 1000);
    return () => window.clearTimeout(id);
  }, [spotlight, prep.luciFlashSec]);

  // Sigla: restiamo su «warn» finché AVANTI («Parte ora») — niente auto-start.
  // Su iOS WKWebView play() senza gesto utente fallisce e due video insieme
  // possono killare il content process (schermo nero + solo «Evento»).

  useEffect(() => {
    if (beat !== "stacco" || count == null) return;
    if (count <= 0) {
      setBeat("quiz");
      setCount(null);
      setQuizGate("tema");
      return;
    }
    const id = window.setTimeout(() => setCount((n) => (n == null ? n : n - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [beat, count]);

  useEffect(() => {
    const el = bedAudio.current;
    if (!el) return;
    el.volume = effVol("bed");
  }, [mute.bed, vols.bed, masterVol]);

  useEffect(() => {
    const el = gongAudioRef.current;
    if (!el) return;
    el.volume = effVol("bed");
  }, [mute.bed, vols.bed, masterVol]);

  useEffect(() => {
    const el = bedAudio.current;
    if (!el) return;
    if (!activeBed) {
      el.pause();
      el.src = "";
      return;
    }
    const abs = new URL(activeBed.url, window.location.origin).href;
    if (el.src !== abs) {
      el.src = activeBed.url;
    }
    // Auto-phase bed always loops; playlist uses onEnded + nextIndex except "one".
    el.loop = !bedFolder || bedRepeat === "one";
    if (bedPlaying && !remoteAudio) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [activeBed, bedFolder, bedRepeat, bedPlaying, remoteAudio]);

  useEffect(() => {
    if (!showPct) {
      stopGongAtmo();
      return;
    }
    if (!gongAtmo.enabled || !gongAtmo.track) return;
    const el = gongAudioRef.current;
    if (!el) return;
    // Atmosphere takeover: pause sottofondo while reveal % is up.
    bedAudio.current?.pause();
    el.src = gongAtmo.track.url;
    el.loop = true;
    el.volume = effVol("bed");
    if (remoteAudio) {
      el.pause();
      return;
    }
    void el.play().catch(() => {});
  }, [showPct, gongAtmo.enabled, gongAtmo.track, remoteAudio]);

  useEffect(() => {
    if (showPct && gongAtmo.enabled && gongAtmo.track) return;
    const el = bedAudio.current;
    if (!el || !activeBed || !bedPlaying) return;
    if (remoteAudio) return;
    void el.play().catch(() => {});
  }, [showPct, gongAtmo.enabled, gongAtmo.track, activeBed, bedPlaying, remoteAudio]);

  function applyBedFiles(name: string, files: File[]) {
    revokeTracks(bedList);
    const nextTracks = tracksFromFiles(files, "audio");
    setBedFolder(nextTracks.length ? name : null);
    setBedList(nextTracks);
    setBedIndex(0);
    setBedPlaying(true);
  }

  async function pickBedFolder() {
    const picked = await pickDirectoryFiles();
    if (picked) {
      applyBedFiles(picked.name, picked.files);
      return;
    }
    bedInput.current?.click();
  }

  function commitAudioRoute(route: CasaAudioRoute) {
    setAudioRoute(route);
    saveCasaAudioRoute(route);
  }

  function clearBedFolder() {
    revokeTracks(bedList);
    bedAudio.current?.pause();
    setBedFolder(null);
    setBedList([]);
    setBedIndex(0);
  }

  function applyVideoFiles(files: File[], folderName?: string) {
    revokeTracks(videoState.list);
    const list = tracksFromFiles(files, "av");
    setVideoState({
      ...DEFAULT_VIDEO,
      list,
      muted: videoState.muted,
      repeat: videoState.repeat,
      onScreenUrl: videoState.onScreenUrl,
      onScreenName: videoState.onScreenName,
    });
    void folderName;
  }

  async function pickVideoFolder() {
    const picked = await pickDirectoryFiles();
    if (picked) {
      applyVideoFiles(picked.files, picked.name);
      return;
    }
    videoInput.current?.click();
  }

  function clearVideoList() {
    revokeTracks(videoState.list);
    setVideoState((prev) => ({
      ...DEFAULT_VIDEO,
      muted: prev.muted,
      onScreenUrl: prev.onScreenUrl,
      onScreenName: prev.onScreenName,
    }));
  }

  function clearMediaOnScreen() {
    setVideoState((prev) => ({
      ...prev,
      onScreenUrl: null,
      onScreenName: null,
    }));
  }

  async function go() {
    stopGongAtmo();
    setShowPct(false);
    setGoError(null);
    if (beat === "quiz") {
      if (quizGate === "tema") {
        if (live.runtimeState === "lobby") {
          setGoBusy(true);
          try {
            await fetch(
              `/api/events/${encodeURIComponent(eventCode)}/questions`,
            );
            const result = await live.runQuizAction("start", {
              questionCount: live.event?.quizSetup.questionCount ?? undefined,
              questionSeconds:
                live.event?.quizSetup.questionSeconds ?? undefined,
              hideRankingLastN: live.event?.quizSetup.hideRankingLastN,
            });
            if (!result.ok) {
              setGoError(result.error);
              return;
            }
            await postDisplayCommand(
              eventCode,
              { type: "clear" },
              live.pin,
            ).catch(() => undefined);
          } finally {
            setGoBusy(false);
          }
        }
        setQuizGate("play");
        return;
      }
      setLeft((n) => Math.max(0, n - 1));
      setQuizGate("tema");
      return;
    }
    const step = stepAvanti({
      beat,
      sigla,
      roll,
      guestCount: guests.length,
    });
    setBeat(step.beat);
    setSigla(step.sigla);
    setRoll(step.roll);
    if (step.stacco) setCount(5);
    if (step.beat === "quiz") {
      setCount(null);
      setQuizGate("tema");
    }
    if (step.beat !== "casa" && open === "prep") setOpen(null);
  }

  const goLabel =
    beat === "quiz" && quizGate === "tema"
      ? "Domanda"
      : avantiLabel({
          beat,
          sigla,
          roll,
          guestCount: guests.length,
        });

  function holdSiglaFrame() {
    setSigla((s) => (s === "on" ? "hold" : s));
  }

  function editSlide(id: CasaSlideId, patch: Partial<CasaSlide>) {
    setSlides((prev) => {
      const nextSlides = { ...prev, [id]: { ...prev[id], ...patch } };
      saveSlides(eventCode, nextSlides);
      return nextSlides;
    });
  }

  function skipSlide() {
    if (next) setBeat(next.id);
  }

  function dropPresent() {
    if (!onStage) return;
    setGuests((list) => list.filter((g) => g.id !== onStage.id));
  }

  function skipRoll() {
    setBeat("stacco");
    setCount(5);
  }

  function skipQuestion() {
    setLeft((n) => Math.max(0, n - 1));
    setQuizGate("tema");
  }

  function patchPrep(patch: Partial<Prep>) {
    setPrep((prev) => {
      const nextPrep = { ...prev, ...patch };
      savePrep(eventCode, nextPrep);
      if (
        live.pinReady &&
        ("shipTopN" in patch ||
          "salvaSec" in patch ||
          "ripescaggio" in patch)
      ) {
        void patchEventConfig(
          eventCode,
          {
            extractionCount: nextPrep.shipTopN,
            salvaSec:
              nextPrep.ripescaggio === "salva" ? nextPrep.salvaSec : null,
          },
          live.pin,
        ).catch(() => {});
      }
      return nextPrep;
    });
  }

  function patchClock(patch: Partial<CasaClockPrefs>) {
    setClockPrefs((prev) => {
      const nextClock = { ...prev, ...patch };
      saveClock(eventCode, nextClock);
      return nextClock;
    });
  }

  const exactNow = formatExact(now);
  const elapsedNow = formatElapsed(now - clockPrefs.originMs);

  const picked = guests.find((g) => g.id === pickedId) ?? null;

  function patchGuest(id: string, patch: Partial<Guest>) {
    setGuests((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function bumpScore(id: string, delta: number) {
    setGuests((list) =>
      list.map((row) => (row.id === id ? { ...row, score: row.score + delta } : row)),
    );
  }

  function revokePhoto(url?: string) {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }

  function setGuestPhoto(id: string, file: File | null) {
    setGuests((list) =>
      list.map((row) => {
        if (row.id !== id) return row;
        revokePhoto(row.photo);
        return { ...row, photo: file ? URL.createObjectURL(file) : undefined };
      }),
    );
  }

  function togglePad(id: CasaPadHitId) {
    if (remoteAudio) return;
    const on = toggleCasaPadHit(id, effVol("fx"), () => {
      setHits((cur) => {
        const nextHits = new Set(cur);
        nextHits.delete(id);
        return nextHits;
      });
    });
    setHits((cur) => {
      const nextHits = new Set(cur);
      if (on) nextHits.add(id);
      else nextHits.delete(id);
      return nextHits;
    });
  }

  const phaseLive = (
    <div className="casa-phase">
      {beat === "casa" ? (
        <button
          type="button"
          className="casa-hit casa-hit-entra"
          data-on={help ? "1" : undefined}
          onClick={() => setHelp((v) => !v)}
        >
          <span className="casa-qr-ico" aria-hidden>
            ▦
          </span>
          Entra
        </button>
      ) : null}
      {beat === "premio" || beat === "sponsor" ? (
        <button type="button" className="casa-hit" onClick={skipSlide}>
          Salta
        </button>
      ) : null}
      {beat === "presenti" ? (
        <>
          <button type="button" className="casa-hit" onClick={dropPresent}>
            Non c’è
          </button>
          <button type="button" className="casa-hit" onClick={skipRoll}>
            Salta presenti
          </button>
        </>
      ) : null}
      {beat === "quiz" ? (
        <>
          <button
            type="button"
            className="casa-hit"
            data-on={showPct ? "1" : undefined}
            onClick={() => setShowPct((v) => !v)}
          >
            % sul maxi
          </button>
          <button type="button" className="casa-hit" onClick={skipQuestion}>
            Salta domanda
          </button>
        </>
      ) : null}
    </div>
  );

  function changeManche(nextN: number) {
    const n = Math.min(MANCHE_MAX, Math.max(MANCHE_MIN, nextN));
    setManche(n);
    setLeft((prev) => (beat === "quiz" ? Math.min(prev, n) : n));
  }

  const mutedWho = new Set(
    guests.filter((g) => g.muted).map((g) => g.nick.trim().toLowerCase()),
  );
  const visibleMsgs = msgs.filter((m) => {
    if (mutedWho.has(m.who.trim().toLowerCase())) return false;
    if (msgFilter && !m.text.toLowerCase().includes("wi")) return false;
    return true;
  });

  function MsgRows({ limit }: { limit?: number }) {
    const rows = limit == null ? visibleMsgs : visibleMsgs.slice(-limit);
    return (
      <>
        {rows.map((m) => (
          <div className="casa-msg-row" key={m.id}>
            <button
              type="button"
              className="casa-msg-tap"
              onClick={() => {
                setMsgs((list) => list.filter((row) => row.id !== m.id));
                setMsgQueue((q) => [...q, { ...m, say: true }]);
              }}
            >
              <i>{m.ini}</i>
              <div>
                <b>{m.who}</b>
                <p>{m.text}</p>
              </div>
            </button>
            <button
              type="button"
              className="casa-trash"
              aria-label="Elimina messaggio"
              title="Elimina messaggio"
              onClick={() => setMsgs((list) => list.filter((row) => row.id !== m.id))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M9.5 4.5h5l.7 1.2H19a1 1 0 010 2h-.6l-.9 11.1A2 2 0 0115.5 20.5h-7a2 2 0 01-2-1.7L5.6 7.7H5a1 1 0 010-2h3.8L9.5 4.5zm1.2 2h2.6l-.4-.7h-1.8l-.4.7zM7.6 7.7l.8 10.3h7.2l.8-10.3H7.6zm2.2 2.1a.8.8 0 011.6 0l-.4 6a.8.8 0 11-1.6 0l.4-6zm3.6 0a.8.8 0 011.6 0l-.4 6a.8.8 0 11-1.6 0l.4-6z" />
              </svg>
            </button>
          </div>
        ))}
      </>
    );
  }

  function addWidget(type: CasaWidgetType) {
    if (UNIQUE_WIDGET_TYPES.has(type) && activeWidgets.some((w) => w.type === type)) {
      return;
    }
    const meta = widgetMeta(type);
    const preferred = sizeToPx(meta.defaultSize);
    const others = activeWidgets.map((w) => {
      const px = widgetLayoutPx(w);
      return { x: w.x, y: w.y, w: px.w, h: px.h };
    });
    // Prefer free slot; never overlap. May place collapsed if only header fits.
    const pos = findAddPlacement(
      preferred,
      others,
      deckCanvasW,
      deckCanvasH,
      WIDGET_MIN_W,
      WIDGET_MIN_H,
      40,
      40,
      WIDGET_COLLAPSED_H,
    );
    if (!pos) {
      window.alert(
        "Nessuno spazio libero sulla plancia. Collassa o sposta un modulo, poi riprova.",
      );
      return;
    }
    const asCollapsed = pos.h <= WIDGET_COLLAPSED_H;
    const size =
      pos.w === preferred.w && pos.h === preferred.h
        ? meta.defaultSize
        : nearestSize(pos.w, Math.max(pos.h, WIDGET_MIN_H));
    const widget: CasaWidgetInstance = {
      id: createId(type),
      type,
      x: pos.x,
      y: pos.y,
      size,
      collapsed: asCollapsed || undefined,
      ...(pos.w !== preferred.w || pos.h !== preferred.h || asCollapsed
        ? {
            w: pos.w,
            h: asCollapsed ? Math.max(preferred.h, WIDGET_MIN_H) : pos.h,
          }
        : {}),
    };
    storeDeckWidgets([...activeWidgets, widget]);
  }

  function openPanelForWidget(w: CasaWidgetInstance) {
    const map: Partial<Record<CasaWidgetType, Panel>> = {
      settings: "setup",
      players: "nick",
      messages: "msg",
      projector: "preview",
      audio: "audio",
      pad: "pad",
      clock: "clock",
      audio_bed: "audio",
      quiz_regia: "quiz",
    };
    const panel = map[w.type];
    if (panel) setOpen(panel);
  }

  function sendVideoToScreen(t: CasaMediaTrack, index: number) {
    setVideoState((v) => ({
      ...v,
      index,
      onScreenUrl: t.url,
      onScreenName: t.name,
    }));
  }
  function onVideoTrackPointer(t: CasaMediaTrack, index: number) {
    const now = Date.now();
    const prev = videoTapRef.current;
    if (prev && prev.url === t.url && now - prev.at < 400) {
      videoTapRef.current = null;
      sendVideoToScreen(t, index);
      return;
    }
    videoTapRef.current = { url: t.url, at: now };
    setVideoState((v) => ({ ...v, index }));
  }

  const missingProjector = !activeWidgets.some((w) => w.type === "projector");
  const missingAvanti = !activeWidgets.some((w) => w.type === "avanti");
  const showMissingWarn = !layoutEdit && (missingProjector || missingAvanti);

  const projectorProps = {
    eventCode,
    beat,
    sigla,
    help,
    count,
    onStage,
    showPct,
    slides,
    siglaSrc,
    siglaVolume: effVol("sigla"),
    onSiglaEnded: holdSiglaFrame,
    flash,
    spotlight,
    quizGate: projectorQuizGate,
    quizQuestion: projectorQuestion,
    mediaOnScreen:
      videoState.onScreenUrl && videoState.onScreenName
        ? {
            url: videoState.onScreenUrl,
            name: videoState.onScreenName,
            muted: videoState.muted,
          }
        : null,
    onClearMediaOnScreen: clearMediaOnScreen,
  } as const;

  function renderWidget(
    w: CasaWidgetInstance,
    ctx: { edit: boolean; wPx: number; hPx: number },
  ): ReactNode {
    const liveOff = ctx.edit ? "casa-w-controls-off" : undefined;
    switch (w.type) {
      case "settings":
        return (
          <div className={liveOff}>
            {phaseLive}
          </div>
        );
      case "players":
        return (
          <div className={`casa-roster-scroll ${liveOff ?? ""}`}>
            <div className="casa-roster">
              {guests.length === 0 ? (
                <p className="casa-sub">Nessuno in sala. Entra dal QR.</p>
              ) : null}
              {guests.map((g) => (
                <button
                  type="button"
                  className="casa-slot"
                  key={g.id}
                  data-on={pickedId === g.id ? "1" : undefined}
                  data-mute={g.muted ? "1" : undefined}
                  onClick={() => {
                    setPickedId(g.id);
                    setKillAsk(false);
                  }}
                >
                  <CasaFace photo={g.photo} nick={g.nick} gender={g.gender} />
                  <span className="casa-slot-nick">{g.nick}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case "messages":
        return (
          <div className={`casa-msg-scroll ${liveOff ?? ""}`}>
            <MsgRows />
          </div>
        );
      case "projector":
        return (
          <div
            className={["casa-proj-host", liveOff].filter(Boolean).join(" ")}
          >
            {open === "preview" ? (
              <div className="casa-screen casa-screen-ghost" />
            ) : (
              <CasaSoftBoundary label="Proiettore">
                <CasaProjector {...projectorProps} />
              </CasaSoftBoundary>
            )}
          </div>
        );
      case "audio":
        return (
          <div className={liveOff}>
            <label className="casa-audio-route">
              <span>Uscita</span>
              <select
                value={casaAudioOptionId(audioRoute)}
                onChange={(event) => {
                  const option = audioOutputs.find(
                    (item) => item.id === event.target.value,
                  );
                  if (option) commitAudioRoute(option.route);
                }}
                onFocus={() => {
                  void listCasaAudioOutputs().then(setAudioOutputs);
                }}
              >
                {(audioOutputs.length
                  ? audioOutputs
                  : [
                      {
                        id: casaAudioOptionId(audioRoute),
                        route: audioRoute,
                      },
                    ]
                ).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.route.label}
                  </option>
                ))}
              </select>
            </label>
            {FADERS.map((f) => (
                  <div className="casa-mix" key={f.id}>
                    <span>{f.label}</span>
                    <i className="casa-mix-bar">
                      <b
                        style={{
                          width: `${mute[f.id] ? 0 : vols[f.id] * masterScale}%`,
                        }}
                      />
                    </i>
                    <button
                      type="button"
                      className="casa-mute"
                      data-on={mute[f.id] ? "1" : undefined}
                      onClick={() => setMute((m) => ({ ...m, [f.id]: !m[f.id] }))}
                    >
                      M
                    </button>
                  </div>
                ))}
          </div>
        );
      case "pad":
        return (
          <div className={liveOff}>
            <PadHits active={hits} muted={mute.fx} onToggle={togglePad} />
          </div>
        );
      case "avanti":
        return (
          <div className={liveOff}>
            <WidgetConductor
              beat={beat}
              localLabel={goLabel}
              localBusy={goBusy}
              localError={goError}
              onLocalGo={() => {
                stopGongAtmo();
                void go();
              }}
            />
          </div>
        );
      case "transport":
        return (
          <div className={liveOff}>
            <WidgetTransport />
          </div>
        );
      case "clock":
        return (
          <div className={liveOff}>
            <div className="casa-clock-widget">
              <em className="casa-pill">{current.label}</em>
              {clockPrefs.showElapsed ? (
                <span>
                  Tempo <b>{elapsedNow}</b>
                </span>
              ) : null}
              {clockPrefs.showExact ? (
                <span>
                  Ora <b>{exactNow}</b>
                </span>
              ) : null}
              {!clockPrefs.showElapsed && !clockPrefs.showExact ? (
                <span>Tempo</span>
              ) : null}
            </div>
          </div>
        );
      case "timer":
        return (
          <div className={`casa-timer-widget ${liveOff ?? ""}`}>
            {beat === "quiz" && quizGate === "play" ? (
              <p className="casa-timer-readout">{quizLeftSec}s</p>
            ) : (
              <>
                <p className="casa-timer-readout">{formatMmSs(freeTimerSec)}</p>
                <div className="casa-bed-line">
                  <button
                    type="button"
                    className="casa-hit"
                    onClick={() => setFreeTimerRun((v) => !v)}
                  >
                    {freeTimerRun ? "Stop" : "Start"}
                  </button>
                  <button
                    type="button"
                    className="casa-hit"
                    onClick={() => {
                      setFreeTimerRun(false);
                      setFreeTimerSec(0);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>
        );
      case "notes":
        return (
          <textarea
            className={`casa-notes-field ${liveOff ?? ""}`}
            value={getNote(notes, w.id)}
            onChange={(e) => commitNotes(setNote(notes, w.id, e.target.value))}
            placeholder="Note per l'evento…"
          />
        );
      case "qr_help":
        return (
          <div className={`casa-qr-help ${liveOff ?? ""}`}>
            <JoinQrCode url={joinUrl} size={72} showUrl={false} className="casa-qr-mini" />
            <button
              type="button"
              className="casa-hit casa-hit-entra"
              data-on={help ? "1" : undefined}
              onClick={() => setHelp((v) => !v)}
            >
              <span className="casa-qr-ico" aria-hidden>
                ▦
              </span>
              Entra
            </button>
          </div>
        );
      case "volume_master":
        return (
          <label className={`casa-fader ${liveOff ?? ""}`}>
            <span>Master</span>
            <input
              type="range"
              min={0}
              max={100}
              value={masterVol}
              onChange={(e) => setMasterVol(Number(e.target.value))}
            />
            <strong>{masterVol}</strong>
          </label>
        );
      case "audio_bed":
        return (
          <div className={`casa-media-widget ${liveOff ?? ""}`}>
            <div className="casa-bed-line">
              <MediaIco
                label={bedPlaying ? "Pausa" : "Play"}
                onClick={() => setBedPlaying((v) => !v)}
              >
                {bedPlaying ? <IcoPause /> : <IcoPlay />}
              </MediaIco>
              <MediaIco
                label="Stop"
                onClick={() => setBedPlaying(false)}
              >
                <IcoStop />
              </MediaIco>
              <MediaIco
                label="Precedente"
                disabled={!bedFolder || bedList.length < 2}
                onClick={() =>
                  setBedIndex((i) =>
                    bedList.length ? (i - 1 + bedList.length) % bedList.length : 0,
                  )
                }
              >
                <IcoPrev />
              </MediaIco>
              <MediaIco
                label="Successivo"
                disabled={!bedFolder || bedList.length < 2}
                onClick={() =>
                  setBedIndex((i) => (bedList.length ? (i + 1) % bedList.length : 0))
                }
              >
                <IcoNext />
              </MediaIco>
              <MediaIco
                label={repeatTitle(bedRepeat)}
                on={bedRepeat !== "off"}
                onClick={() => setBedRepeat((m) => cycleRepeat(m))}
              >
                <IcoRepeat one={bedRepeat === "one"} />
              </MediaIco>
            </div>
            <div className="casa-bed-line">
              <MediaIco
                label="Apri file"
                onClick={() => bedFilesInput.current?.click()}
              >
                <IcoFile />
              </MediaIco>
              <MediaIco label="Apri cartella" onClick={() => void pickBedFolder()}>
                <IcoFolder />
              </MediaIco>
              <MediaIco label="Svuota lista" onClick={clearBedFolder}>
                <IcoClear />
              </MediaIco>
            </div>
            <p className="casa-sub">
              {bedFolder
                ? `${bedFolder} · ${bedList.length} brani`
                : `Colonna · ${casaAutoBedLabel(beat)}`}
            </p>
            {bedList.length ? (
              <div className="casa-playlist">
                {bedList.map((t, i) => (
                  <button
                    key={t.url}
                    type="button"
                    className="casa-track"
                    data-on={i === bedIndex ? "1" : undefined}
                    onClick={() => {
                      setBedIndex(i);
                      setBedPlaying(true);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="casa-gong-atmo">
              <label className="casa-switch-row">
                <span>Play al gong</span>
                <button
                  type="button"
                  className="casa-switch"
                  role="switch"
                  aria-checked={gongAtmo.enabled}
                  data-on={gongAtmo.enabled ? "1" : undefined}
                  onClick={() =>
                    setGongAtmo((g) => ({ ...g, enabled: !g.enabled }))
                  }
                >
                  <i />
                </button>
              </label>
              <button
                type="button"
                className="casa-hit"
                onClick={() => gongInput.current?.click()}
              >
                {gongAtmo.track ? gongAtmo.track.name : "File gong"}
              </button>
            </div>
          </div>
        );
      case "video_player":
        return (
          <div className={`casa-media-widget ${liveOff ?? ""}`}>
            <div className="casa-bed-line">
              <MediaIco
                label={videoState.muted ? "Audio disattivato" : "Audio attivo"}
                on={videoState.muted}
                onClick={() =>
                  setVideoState((v) => ({ ...v, muted: !v.muted }))
                }
              >
                {videoState.muted ? <IcoMute /> : <IcoUnmute />}
              </MediaIco>
              <MediaIco
                label={repeatTitle(videoState.repeat)}
                on={videoState.repeat !== "off"}
                onClick={() =>
                  setVideoState((v) => ({
                    ...v,
                    repeat: cycleRepeat(v.repeat),
                  }))
                }
              >
                <IcoRepeat one={videoState.repeat === "one"} />
              </MediaIco>
              <MediaIco
                label="Apri file"
                onClick={() => videoInput.current?.click()}
              >
                <IcoFile />
              </MediaIco>
              <MediaIco label="Apri cartella" onClick={() => void pickVideoFolder()}>
                <IcoFolder />
              </MediaIco>
            </div>
            <div className="casa-bed-line">
              <MediaIco label="Svuota lista" onClick={clearVideoList}>
                <IcoClear />
              </MediaIco>
              <MediaIco
                label="Togli dal maxi"
                disabled={!videoState.onScreenUrl}
                onClick={clearMediaOnScreen}
              >
                <IcoScreenOff />
              </MediaIco>
            </div>
            {videoState.list.length ? (
              <div className="casa-playlist">
                {videoState.list.map((t, i) => (
                  <button
                    key={t.url}
                    type="button"
                    className="casa-track"
                    data-on={
                      videoState.onScreenUrl === t.url || videoState.index === i
                        ? "1"
                        : undefined
                    }
                    onClick={() => onVideoTrackPointer(t, i)}
                    onDoubleClick={() => sendVideoToScreen(t, i)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="casa-sub">Doppio tap → manda sul proiettore</p>
            )}
          </div>
        );
      case "quiz_regia":
        return (
          <div className={liveOff}>
            <WidgetQuizRegia />
          </div>
        );
      case "preflight":
        return (
          <div className={liveOff}>
            <WidgetPreflight />
          </div>
        );
      case "panic":
        return (
          <div className={liveOff}>
            <WidgetPanic />
          </div>
        );
      case "finals":
        return (
          <div className={liveOff}>
            <WidgetFinals />
          </div>
        );
      case "extraction":
        return (
          <div className={liveOff}>
            <WidgetExtraction
              shipTopN={prep.shipTopN}
              ripescaggio={prep.ripescaggio}
              salvaSec={prep.salvaSec}
            />
          </div>
        );
      case "leaderboard":
        return (
          <div className={liveOff}>
            <WidgetLeaderboard limit={Math.max(prep.shipTopN, 12)} />
          </div>
        );
      case "cue":
        return (
          <div className={liveOff}>
            <WidgetCue />
          </div>
        );
      default:
        return (
          <div className={`casa-w-stub ${liveOff ?? ""}`}>
            <p className="casa-sub">{WIDGET_LABELS[w.type]}</p>
          </div>
        );
    }
  }

  return (
    <div className="casa" data-layout-edit={layoutEdit ? "1" : undefined}>
      <header className="casa-top">
        <div className="casa-top-mod casa-top-sala" aria-live="polite">
          <span>
            In sala <b>{guests.length}</b>
          </span>
        </div>

        <div className="casa-top-mod casa-top-layout">
          <CasaLayoutBar
            edit={layoutEdit}
            onEditChange={(edit) => {
              setLayoutEdit(edit);
              if (!edit) setGalleryOpen(false);
            }}
            layouts={layouts}
            onLayoutsChange={commitLayouts}
            onOpenGallery={() => {
              setGalleryOpen(true);
              document.getElementById("casa-gallery-dock")?.scrollIntoView({
                block: "nearest",
              });
            }}
          />
        </div>

        <button
          type="button"
          className="casa-top-mod casa-top-event"
          onClick={() => setOpen("prep")}
        >
          {prep.venueName || eventCode}
        </button>

        <button
          type="button"
          className="casa-top-mod casa-top-time"
          onClick={() => setOpen("clock")}
        >
          {clockPrefs.showElapsed ? (
            <span>
              Tempo <b>{elapsedNow}</b>
            </span>
          ) : null}
          {clockPrefs.showElapsed && clockPrefs.showExact ? (
            <span className="casa-top-time-sep" aria-hidden="true">
              ·
            </span>
          ) : null}
          {clockPrefs.showExact ? (
            <span>
              Ora <b>{exactNow}</b>
            </span>
          ) : null}
          {!clockPrefs.showElapsed && !clockPrefs.showExact ? (
            <span>Tempo</span>
          ) : null}
        </button>
      </header>

      <div className="casa-deck-wrap" ref={deckWrapRef} data-compact={fitPhone ? "1" : undefined}>
        {showMissingWarn ? (
          <div className="casa-layout-warn" role="status">
            <span>
              Manca {missingProjector && missingAvanti
                ? "Proiettore e Avanti"
                : missingProjector
                  ? "Proiettore"
                  : "Avanti"}{" "}
              — aggiungilo dal layout
            </span>
            <button type="button" onClick={() => setLayoutEdit(true)}>
              Modifica layout
            </button>
          </div>
        ) : null}
        {layoutEdit && !fitPhone ? (
          <CasaWidgetGallery
            open
            docked
            onClose={() => setGalleryOpen(false)}
            present={activeWidgets.map((w) => w.type)}
            onAdd={addWidget}
          />
        ) : (
          <CasaWidgetGallery
            open={galleryOpen}
            onClose={() => setGalleryOpen(false)}
            present={activeWidgets.map((w) => w.type)}
            onAdd={addWidget}
          />
        )}
        <CasaWidgetDeck
          edit={layoutEdit}
          widgets={activeWidgets}
          canvasWidth={deckCanvasW}
          canvasHeight={deckCanvasH}
          onChange={storeDeckWidgets}
          onAddRequest={() => setLayoutEdit(true)}
          onWidgetTitleClick={openPanelForWidget}
          renderWidget={renderWidget}
        />
      </div>

      {open ? (
        <div
          className="casa-expand-layer"
          style={visualViewportOverlayStyle(expandViewport)}
        >
          <button
            type="button"
            className="casa-veil"
            aria-label="Chiudi pannello"
            onClick={() => setOpen(null)}
          />
          <div
            className="casa-expand"
            data-preview={open === "preview" ? "1" : undefined}
            data-pad={open === "pad" ? "1" : undefined}
            data-nick={open === "nick" ? "1" : undefined}
            role="dialog"
            aria-modal="true"
          >
            <div className="casa-expand-head">
              <p className="casa-kicker">
                {open === "gear"
                  ? "Slide e sigla"
                  : open === "nick"
                    ? "Giocatori"
                    : open === "pad"
                      ? "Pad audio"
                      : open === "preview"
                        ? "Proiettore"
                        : open === "setup"
                          ? "Impostazioni"
                          : open === "questions"
                            ? "Domande"
                            : open === "prep"
                              ? "Preparazione evento"
                            : open === "social"
                              ? "Contenuti social"
                            : open === "msg"
                            ? "Messaggi"
                            : open === "screen"
                              ? "Schermi"
                              : open === "clock"
                                ? "Tempo"
                                : open === "quiz"
                                  ? "Foglio quiz"
                                  : "Audio"}
              </p>
              <button type="button" className="casa-close" onClick={() => setOpen(null)}>
                Chiudi
              </button>
            </div>

            <div className="casa-expand-body">
            {open === "gear" ? (
              <>
                <p className="casa-sub">Testi delle slide iniziali. Restano su questo computer.</p>
                <div className="casa-slide-grid">
                {SLIDE_ORDER.map((id) => (
                  <fieldset className="casa-slide-edit" key={id}>
                    <legend>{SLIDE_LABELS[id]}</legend>
                    <input
                      className="casa-field"
                      value={slides[id].kicker}
                      onChange={(e) => editSlide(id, { kicker: e.target.value })}
                      placeholder="Kicker"
                    />
                    <input
                      className="casa-field"
                      value={slides[id].headline}
                      onChange={(e) => editSlide(id, { headline: e.target.value })}
                      placeholder="Titolo"
                    />
                    <input
                      className="casa-field"
                      value={slides[id].sub}
                      onChange={(e) => editSlide(id, { sub: e.target.value })}
                      placeholder="Sottotitolo"
                    />
                  </fieldset>
                ))}
                </div>
                <div className="casa-bed-line">
                  <button
                    type="button"
                    className="casa-hit"
                    onClick={() => siglaFile.current?.click()}
                  >
                    File sigla
                  </button>
                  <span>{siglaSrc.startsWith("blob:") ? "File locale" : siglaSrc}</span>
                </div>
              </>
            ) : null}

            {open === "preview" ? (
              <CasaSoftBoundary label="Proiettore">
                <CasaProjector {...projectorProps} enlarge />
              </CasaSoftBoundary>
            ) : null}

            {open === "setup" ? (
              <>
                <div className="casa-setup-expand">
                  <div className="casa-setup-main">
                    <SetupFields
                      manche={manche}
                      seconds={seconds}
                      mustAnswer={mustAnswer}
                      onManche={changeManche}
                      onSeconds={setSeconds}
                      onMustAnswer={() => setMustAnswer((v) => !v)}
                    />
                    {beat === "casa" ? (
                      <button type="button" className="casa-hit" onClick={() => setOpen("prep")}>
                        {prep.venueName ? `Locale · ${prep.venueName}` : "Preparazione evento"}
                      </button>
                    ) : null}
                    <button type="button" className="casa-hit" onClick={() => setOpen("questions")}>
                      Domande
                    </button>
                    <button type="button" className="casa-hit" onClick={() => setOpen("gear")}>
                      Slide e sigla
                    </button>
                    <button type="button" className="casa-hit" onClick={() => setOpen("social")}>
                      Contenuti social
                    </button>
                    <button type="button" className="casa-hit" onClick={() => setOpen("screen")}>
                      Schermi
                    </button>
                    <p className="casa-sub">
                      {beat === "quiz" ? quizLine(quizGate) : LINE[beat]}
                      {mustAnswer ? " Chi non risponde prende −1." : ""}
                    </p>
                    {phaseLive}
                  </div>
                </div>
              </>
            ) : null}

            {open === "questions" ? <CasaQuestions eventCode={eventCode} /> : null}
            {open === "quiz" ? (
              <div className="casa-quiz-expand">
                <WidgetQuizRegia />
              </div>
            ) : null}
            {open === "prep" ? <CasaPrep prep={prep} onChange={patchPrep} /> : null}
            {open === "social" ? (
              <CasaSoftBoundary label="Social">
                <CasaSocialPanel prep={prep} slides={slides} />
              </CasaSoftBoundary>
            ) : null}

            {open === "clock" ? (
              <div className="casa-clock-panel">
                <div className="casa-switch-row">
                  <span>Tempo trascorso</span>
                  <button
                    type="button"
                    className="casa-switch"
                    role="switch"
                    aria-checked={clockPrefs.showElapsed}
                    data-on={clockPrefs.showElapsed ? "1" : undefined}
                    onClick={() => patchClock({ showElapsed: !clockPrefs.showElapsed })}
                  >
                    <i />
                  </button>
                </div>
                <div className="casa-switch-row">
                  <span>Ora esatta</span>
                  <button
                    type="button"
                    className="casa-switch"
                    role="switch"
                    aria-checked={clockPrefs.showExact}
                    data-on={clockPrefs.showExact ? "1" : undefined}
                    onClick={() => patchClock({ showExact: !clockPrefs.showExact })}
                  >
                    <i />
                  </button>
                </div>
                <p className="casa-sub">
                  Tempo <b>{elapsedNow}</b>
                  {" · "}
                  Ora <b>{exactNow}</b>
                </p>
                <button
                  type="button"
                  className="casa-hit"
                  onClick={() => {
                    patchClock({ originMs: Date.now() });
                    setNow(Date.now());
                  }}
                >
                  Reset
                </button>
              </div>
            ) : null}

            {open === "nick" ? (
              <div className="casa-nick-panel">
                <input
                  className="casa-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca nick"
                  enterKeyHint="search"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <p className="casa-sub">I nick arrivano dal QR sul telefono.</p>
                <div className="casa-list">
                  {shown.map((g) => (
                    <button
                      type="button"
                      className="casa-person"
                      key={g.id}
                      onClick={() => {
                        setPickedId(g.id);
                        setKillAsk(false);
                        setOpen(null);
                      }}
                    >
                      <CasaFace photo={g.photo} nick={g.nick} gender={g.gender} />
                      <span className="casa-slot-nick">{g.nick}</span>
                      <span className="casa-kicker">{g.gender}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {open === "audio" ? (
              <>
                <p className="casa-kicker">Uscita audio</p>
                <div className="casa-audio-dest">
                  {(audioOutputs.length
                    ? audioOutputs
                    : [
                        {
                          id: casaAudioOptionId(audioRoute),
                          route: audioRoute,
                        },
                      ]
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="casa-hit"
                      data-on={
                        casaAudioOptionId(audioRoute) === option.id
                          ? "1"
                          : undefined
                      }
                      onClick={() => commitAudioRoute(option.route)}
                    >
                      {option.route.label}
                    </button>
                  ))}
                </div>
                {canPickCasaLocalAudioOutput() ? (
                  <button
                    type="button"
                    className="casa-hit"
                    onClick={() => {
                      void pickCasaLocalAudioOutput().then((route) => {
                        if (route) commitAudioRoute(route);
                        void listCasaAudioOutputs().then(setAudioOutputs);
                      });
                    }}
                  >
                    Scegli uscita locale…
                  </button>
                ) : null}
                <p className="casa-sub">
                  {remoteAudio
                    ? "Colonna sul proiettore / Vercel. Questo telefono è muto."
                    : "Audio su questo dispositivo. Cuffie e speaker si scelgono anche dalle uscite di sistema."}
                </p>
                {FADERS.map((f) => (
                  <label className="casa-fader" key={f.id}>
                    <span>{f.label}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={vols[f.id]}
                      onChange={(e) =>
                        setVols((v) => ({ ...v, [f.id]: Number(e.target.value) }))
                      }
                    />
                    <button
                      type="button"
                      className="casa-mute"
                      data-on={mute[f.id] ? "1" : undefined}
                      onClick={() => setMute((m) => ({ ...m, [f.id]: !m[f.id] }))}
                    >
                      M
                    </button>
                    <strong>{vols[f.id]}</strong>
                  </label>
                ))}
                <div className="casa-bed-line">
                  <button type="button" className="casa-hit" onClick={() => void pickBedFolder()}>
                    Cartella
                  </button>
                  <button
                    type="button"
                    className="casa-hit"
                    data-on={!bedFolder ? "1" : undefined}
                    onClick={clearBedFolder}
                  >
                    Auto fase
                  </button>
                  <span>
                    {bedFolder
                      ? `${bedFolder} · ${bedList.length} brani`
                      : `Colonna · ${casaAutoBedLabel(beat)}`}
                  </span>
                </div>
                {bedList.length ? (
                  <div className="casa-playlist">
                    {bedList.map((t, i) => (
                      <button
                        key={t.url}
                        type="button"
                        className="casa-track"
                        data-on={i === bedIndex ? "1" : undefined}
                        onClick={() => setBedIndex(i)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            {open === "msg" ? (
              <>
                <button
                  type="button"
                  className="casa-filter"
                  data-on={msgFilter ? "1" : undefined}
                  onClick={() => setMsgFilter((v) => !v)}
                >
                  Filtra
                </button>
                <MsgRows />
              </>
            ) : null}

            {open === "screen" ? (
              <div className="casa-thumbs">
                {[
                  ["loop", "Sala"],
                  ["slide", "Classifica"],
                  ["sigla", "Sponsor"],
                  ["quiz", "Domande"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className="casa-thumb"
                    data-on={screen === id ? "1" : undefined}
                    onClick={() => setScreen(id)}
                  >
                    <i />
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {open === "pad" ? (
              <PadHits
                active={hits}
                muted={mute.fx}
                onToggle={togglePad}
              />
            ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {picked ? (
        <>
          <button
            type="button"
            className="casa-veil casa-veil-pop"
            aria-label="Chiudi giocatore"
            onClick={() => setPickedId(null)}
          />
          <div className="casa-pop" role="dialog" aria-modal="true">
            <div className="casa-pop-head">
              <button
                type="button"
                className="casa-pop-shot"
                onClick={() => shotFile.current?.click()}
              >
                <img
                  src={picked.photo || defaultFace(picked.gender)}
                  alt=""
                />
              </button>
              <div>
                <p className="casa-kicker">Giocatore</p>
                <strong>{picked.nick}</strong>
                <div className="casa-secs">
                  <button
                    type="button"
                    className="casa-mf"
                    data-on={picked.gender === "M" ? "1" : undefined}
                    onClick={() => patchGuest(picked.id, { gender: "M" })}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    className="casa-mf"
                    data-on={picked.gender === "F" ? "1" : undefined}
                    onClick={() => patchGuest(picked.id, { gender: "F" })}
                  >
                    F
                  </button>
                </div>
              </div>
              <button type="button" className="casa-close" onClick={() => setPickedId(null)}>
                Chiudi
              </button>
            </div>
            <div className="casa-pop-acts">
              <button type="button" className="casa-hit" onClick={() => shotFile.current?.click()}>
                Scatta
              </button>
              <button type="button" className="casa-hit" onClick={() => libFile.current?.click()}>
                Libreria
              </button>
              <button
                type="button"
                className="casa-hit"
                disabled={!picked.photo}
                onClick={() => setGuestPhoto(picked.id, null)}
              >
                Togli foto
              </button>
            </div>
            <label className="casa-pop-field">
              <span>Rinomina</span>
              <input
                className="casa-field"
                value={picked.nick}
                onChange={(e) => patchGuest(picked.id, { nick: e.target.value })}
              />
            </label>
            <div className="casa-pop-score">
              <span>Punti</span>
              <strong data-neg={picked.score < 0 ? "1" : undefined}>
                {picked.score > 0 ? `+${picked.score}` : picked.score}
              </strong>
            </div>
            <div className="casa-pop-pts">
              <button type="button" className="casa-hit" onClick={() => bumpScore(picked.id, 100)}>
                +100
              </button>
              <button type="button" className="casa-hit" onClick={() => bumpScore(picked.id, -100)}>
                −100
              </button>
              <button type="button" className="casa-hit" onClick={() => bumpScore(picked.id, 1000)}>
                +1000
              </button>
              <button type="button" className="casa-hit" onClick={() => bumpScore(picked.id, -1000)}>
                −1000
              </button>
            </div>
            <div className="casa-pop-acts">
              <button
                type="button"
                className="casa-hit"
                data-on={spotlight?.id === picked.id ? "1" : undefined}
                onClick={() =>
                  setSpotlight({
                    key: Date.now(),
                    id: picked.id,
                    nick: picked.nick,
                    gender: picked.gender,
                    photo: picked.photo,
                    score: picked.score,
                  })
                }
              >
                Schermo
              </button>
              <button
                type="button"
                className="casa-hit"
                data-on={picked.muted ? "1" : undefined}
                onClick={() => patchGuest(picked.id, { muted: !picked.muted })}
              >
                {picked.muted ? "Chat on" : "Silenzia chat"}
              </button>
            </div>
            {killAsk ? (
              <div className="casa-pop-kill">
                <p className="casa-sub">Eliminare {picked.nick} dall'evento?</p>
                <button type="button" className="casa-hit" onClick={() => setKillAsk(false)}>
                  Annulla
                </button>
                <button
                  type="button"
                  className="casa-hit casa-hit-hot"
                  onClick={() => {
                    revokePhoto(picked.photo);
                    setGuests((list) => list.filter((g) => g.id !== picked.id));
                    setPickedId(null);
                    setKillAsk(false);
                  }}
                >
                  Elimina
                </button>
              </div>
            ) : (
              <button type="button" className="casa-hit casa-hit-hot" onClick={() => setKillAsk(true)}>
                Elimina
              </button>
            )}
          </div>
        </>
      ) : null}

      <audio
        ref={bedAudio}
        className="casa-hidden"
        data-bed={activeBed?.name ?? "off"}
        onEnded={() => {
          if (!bedFolder || !bedList.length) return;
          const nextIdx = nextIndex(bedIndex, bedList.length, bedRepeat);
          if (nextIdx == null) {
            setBedPlaying(false);
            return;
          }
          setBedIndex(nextIdx);
        }}
      />
      <audio ref={gongAudioRef} className="casa-hidden" data-gong-atmo="" loop />
      <input
        ref={shotFile}
        type="file"
        className="casa-hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pickedId) setGuestPhoto(pickedId, file);
          e.target.value = "";
        }}
      />
      <input
        ref={libFile}
        type="file"
        className="casa-hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pickedId) setGuestPhoto(pickedId, file);
          e.target.value = "";
        }}
      />
      <input
        ref={siglaFile}
        type="file"
        className="casa-hidden"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (siglaSrc.startsWith("blob:")) URL.revokeObjectURL(siglaSrc);
          setSiglaSrc(URL.createObjectURL(file));
          e.target.value = "";
        }}
      />
      <input
        ref={bedInput}
        type="file"
        className="casa-hidden"
        multiple
        accept="audio/*"
        // @ts-expect-error webkitdirectory
        webkitdirectory=""
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) {
            const root = files[0]?.webkitRelativePath.split("/")[0] ?? "Cartella";
            applyBedFiles(root, Array.from(files));
          }
          e.target.value = "";
        }}
      />
      <input
        ref={bedFilesInput}
        type="file"
        className="casa-hidden"
        multiple
        accept="audio/*"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) applyBedFiles("File", Array.from(files));
          e.target.value = "";
        }}
      />
      <input
        ref={gongInput}
        type="file"
        className="casa-hidden"
        accept="audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file || !isAudioFile(file)) return;
          if (gongAtmo.track) URL.revokeObjectURL(gongAtmo.track.url);
          setGongAtmo((g) => ({
            ...g,
            track: { name: file.name, url: URL.createObjectURL(file) },
          }));
          e.target.value = "";
        }}
      />
      <input
        ref={videoInput}
        type="file"
        className="casa-hidden"
        multiple
        accept="video/*,image/*"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) applyVideoFiles(Array.from(files));
          e.target.value = "";
        }}
      />
    </div>
  );
}
