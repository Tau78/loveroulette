"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPlayersManager } from "@/components/admin/AdminPlayersManager";
import { AdminRegiaPanel } from "@/components/admin/AdminRegiaPanel";
import { CasaProjector } from "@/components/admin/casa/CasaProjector";
import { CasaPrep } from "@/components/admin/casa/CasaPrep";
import { BoardSpecialTrialPanel } from "@/components/admin/casa/BoardSpecialTrialPanel";
import { BoardVideoRegiaPanel } from "@/components/admin/casa/BoardVideoRegiaPanel";
import { WidgetQuizRegia } from "@/components/admin/casa/widgets/WidgetQuizRegia";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import { JoinQrCode } from "@/components/display/JoinQrCode";
import { isSpecialTrialBlockingQuiz } from "@/lib/musicpro/special-trial";
import {
  fetchParticipants,
  isInvalidAnimatorPinError,
  postDisplayAudioStart,
  postDisplayCommand,
  postQuestionReport,
  postResetEvent,
  postSpecialTrialAction,
} from "@/lib/admin/animator-api";
import {
  boardPlayerFromRow,
  playerDetailDisplayCommand,
  playerPresentiDisplayCommand,
  playerScreenDetails,
  type BoardPlayer,
  type PlayerScreenField,
} from "@/lib/admin/board-player-screen";
import {
  applyAudioSink,
  canPickCasaLocalAudioOutput,
  casaAudioOptionId,
  isRemoteAudioRoute,
  listCasaAudioOutputs,
  loadCasaAudioRoute,
  pickCasaLocalAudioOutput,
  saveCasaAudioRoute,
  type CasaAudioOutputOption,
  type CasaAudioRoute,
} from "@/lib/admin/casa-audio-route";
import {
  BOARD_DISPLAY_CUES,
  type BoardDisplayCueId,
} from "@/lib/admin/board-display-cues";
import {
  displayUrl,
  isReactNativeWebView,
  notifyNativeCloseProjector,
  openProjectorWindowAsync,
} from "@/lib/display/embed";
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
  loadPadCustomHits,
  loadPadLabelOverrides,
  loadPadSetIds,
  resolvePadLibrary,
  resolvePadSet,
  savePadSetIds,
  type CasaPadHitId as PadId,
} from "@/lib/admin/casa-pad-bank";
import { BoardPadSamplerSuite } from "@/components/admin/casa/BoardPadSamplerSuite";
import {
  CASA_SIM_DEMO_CHAT_EVENT,
  type CasaSimDemoChatDetail,
} from "@/lib/admin/casa-demo-chat";
import {
  avantiLabel,
  stepAvanti,
  type CasaBeat,
} from "@/lib/admin/casa-avanti";
import { logAvantiBinary } from "@/lib/admin/avanti-binary-log";
import { casaQrDisplayCommand } from "@/lib/admin/casa-qr-display";
import { openingAutoplayHoldSeconds } from "@/lib/admin/casa-opening-autoplay";
import { boardCueQuestionIndex } from "@/lib/admin/board-cue-question";
import {
  casaAutoBedLabel,
  casaEffectiveBedBeat,
  resolveCasaBed,
  resolveCasaBedOrLobby,
} from "@/lib/admin/casa-beds";
import {
  consumeCasaResultsRevealCue,
  playCasaResultsRevealHit,
  resetCasaResultsRevealHit,
} from "@/lib/admin/casa-results-reveal";
import { whenQuizGongCleared } from "@/lib/audio/quiz-gong-results-gate";
import { AVANTI_CROSSFADE_MS } from "@/lib/audio/types";
import { getMediaVolume, resumeMediaAudio, setMediaVolume } from "@/lib/audio/media-element-gain";
import {
  applyLineupReplacement,
  pickLineupReplacement,
} from "@/lib/musicpro/quiz-state";
import { WidgetConductor } from "@/components/admin/casa/widgets/WidgetConductor";
import { useQuizPhaseSync } from "@/hooks/useQuizPhaseSync";
import { useQuizGongAtCountdownEnd } from "@/hooks/useQuizGongAtCountdownEnd";
import { useCurrentQuizQuestion, useQuizQuestions, questionWithShuffledOptions } from "@/hooks/useQuizQuestions";
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
  DEFAULT_SLIDES,
  loadSlides,
  SIGLA_SRC,
  type CasaSlideId,
} from "@/lib/admin/casa-slides";
import { SIGLA_WARN_SLIDE } from "@/lib/display/sigla-warn";
import { STACCO_KICKER } from "@/lib/display/stacco";
import "@/components/admin/casa/casa.css";
import "@/components/admin/casa/casa-board.css";

type Guest = BoardPlayer;

/**
 * Riquadri apribili (stile /serata): overlay dentro il contenitore rigido.
 * Distinti dai drawer della rail sinistra (Regia / Giocatori API / …).
 */
type ExpandPanel =
  | "players"
  | "msg"
  | "clock"
  | "audio"
  | "pad"
  | "preview"
  | "video"
  | null;

/**
 * Tab sinistra stile admin: aprono riquadri full-height dentro il contenitore rigido.
 * `plancia` = vista griglia (nessun drawer).
 */
type RailTab =
  | "plancia"
  | "regia"
  | "prove"
  | "video"
  | "giocatori"
  | "setup";

const RAIL_TABS: { id: RailTab; label: string }[] = [
  { id: "plancia", label: "Plancia" },
  { id: "regia", label: "Regia" },
  { id: "prove", label: "Prove" },
  { id: "video", label: "Video" },
  { id: "giocatori", label: "Giocatori" },
  { id: "setup", label: "Setup" },
];

function RailTabIcon({ id }: { id: RailTab }) {
  switch (id) {
    case "plancia":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "regia":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M4 12h4M16 12h4M12 4v4M12 16v4" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "prove":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "video":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M16 10l6-3v10l-6-3z" />
        </svg>
      );
    case "giocatori":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 19c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 19c.4-2 1.8-3.5 3.5-3.8" />
        </svg>
      );
    case "setup":
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.5M12 18.5V21M4.9 6.3l1.8 1.8M17.3 15.9l1.8 1.8M3 12h2.5M18.5 12H21M4.9 17.7l1.8-1.8M17.3 8.1l1.8-1.8" />
        </svg>
      );
  }
}

const FADERS = [
  { id: "sigla", label: "Sigla" },
  { id: "bed", label: "Sottofondo" },
  { id: "fx", label: "Effetti" },
] as const;

type FaderId = (typeof FADERS)[number]["id"];

const BOARD_PAD_FALLBACK = CASA_PAD_HITS.slice(0, 6);
const PLAYER_SLOTS = 6;
/** Highlight «a schermo» sulla faccia in Giocatori. */
const PLAYER_SCREEN_HOLD_MS = 5000;

const EXPAND_TITLE: Record<Exclude<ExpandPanel, null>, string> = {
  players: "Giocatori",
  msg: "Messaggi",
  clock: "Orologio",
  audio: "Audio e volumi",
  pad: "Pad effetti",
  preview: "Proiettore",
  video: "Regia video",
};

const RAIL_TITLE: Record<Exclude<RailTab, "plancia">, string> = {
  regia: "Regia",
  prove: "Prove",
  video: "Regia video",
  giocatori: "Giocatori",
  setup: "Setup",
};

const BOARD_LAYOUT_KEY = "casa-board-layout-v3";
const BOARD_RESCUE_KEY = "casa-board-rescue-v1";

type BoardLayout = {
  cols: [number, number, number];
  left: [number, number, number];
  right: [number, number, number];
  /** Proiettore · Comandi */
  center: [number, number];
};

const DEFAULT_BOARD_LAYOUT: BoardLayout = {
  cols: [0.9, 1.6, 1],
  /** Video · Giocatori · Messaggi */
  left: [1.25, 1.05, 1.1],
  /** Audio · Pad · Avanti */
  right: [1.35, 1.15, 1.0],
  center: [2.4, 0.85],
};

type ConfirmKind = "stop" | "rescue" | null;

type BoardToast = {
  id: number;
  message: string;
  undo?: () => void | Promise<void>;
};

function loadBoardLayout(): BoardLayout {
  if (typeof window === "undefined") return DEFAULT_BOARD_LAYOUT;
  try {
    const raw = window.localStorage.getItem(BOARD_LAYOUT_KEY);
    if (!raw) return DEFAULT_BOARD_LAYOUT;
    const parsed = JSON.parse(raw) as BoardLayout;
    if (
      !Array.isArray(parsed.cols) ||
      parsed.cols.length !== 3 ||
      !Array.isArray(parsed.left) ||
      !Array.isArray(parsed.right) ||
      !Array.isArray(parsed.center) ||
      parsed.center.length !== 2
    ) {
      return DEFAULT_BOARD_LAYOUT;
    }
    return {
      cols: parsed.cols.map((n) =>
        Math.max(0.35, Number(n) || 1),
      ) as BoardLayout["cols"],
      left: parsed.left.map((n) =>
        Math.max(0.4, Number(n) || 1),
      ) as BoardLayout["left"],
      right: parsed.right.map((n) =>
        Math.max(0.4, Number(n) || 1),
      ) as BoardLayout["right"],
      center: parsed.center.map((n) =>
        Math.max(0.45, Number(n) || 1),
      ) as BoardLayout["center"],
    };
  } catch {
    return DEFAULT_BOARD_LAYOUT;
  }
}

function BoardSplit({
  axis,
  label,
  onDrag,
}: {
  axis: "x" | "y";
  label: string;
  onDrag: (deltaPx: number, containerSize: number) => void;
}) {
  return (
    <button
      type="button"
      className={`casa-board-split casa-board-split-${axis}`}
      aria-label={label}
      title={label}
      onPointerDown={(e) => {
        e.preventDefault();
        const target = e.currentTarget;
        const parent = target.parentElement;
        if (!parent) return;
        const size =
          axis === "x" ? parent.clientWidth : parent.clientHeight;
        let last = axis === "x" ? e.clientX : e.clientY;
        target.setPointerCapture(e.pointerId);
        document.body.classList.add("casa-board-resizing");
        const moveRel = (ev: PointerEvent) => {
          const now = axis === "x" ? ev.clientX : ev.clientY;
          onDrag(now - last, size);
          last = now;
        };
        const up = (ev: PointerEvent) => {
          target.releasePointerCapture(ev.pointerId);
          target.removeEventListener("pointermove", moveRel);
          target.removeEventListener("pointerup", up);
          target.removeEventListener("pointercancel", up);
          document.body.classList.remove("casa-board-resizing");
        };
        target.addEventListener("pointermove", moveRel);
        target.addEventListener("pointerup", up);
        target.addEventListener("pointercancel", up);
      }}
    />
  );
}

function adjustPair(
  a: number,
  b: number,
  deltaPx: number,
  containerSize: number,
  min = 0.4,
): [number, number] {
  if (containerSize <= 0) return [a, b];
  const sum = a + b;
  const deltaFr = (deltaPx / containerSize) * sum;
  let na = a + deltaFr;
  let nb = b - deltaFr;
  if (na < min) {
    nb -= min - na;
    na = min;
  }
  if (nb < min) {
    na -= min - nb;
    nb = min;
  }
  return [Math.max(min, na), Math.max(min, nb)];
}

function BoardCardHead({
  title,
  onExpand,
  children,
}: {
  title: string;
  onExpand?: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="casa-board-card-h">
      {onExpand ? (
        <button
          type="button"
          className="casa-board-card-title"
          onClick={onExpand}
          title={`Apri ${title}`}
        >
          {title}
          <span className="casa-board-card-chev" aria-hidden>
            ▸
          </span>
        </button>
      ) : (
        <span>{title}</span>
      )}
      {children}
    </header>
  );
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
      className="casa-board-ico"
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
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
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

function formatBedTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function IcoMute() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 9h3.2L12 5.5v13L7.2 15H4V9zm11.1 1.1l1.4-1.4 1.5 1.5 1.5-1.5 1.4 1.4-1.5 1.5 1.5 1.5-1.4 1.4-1.5-1.5-1.5 1.5-1.4-1.4 1.5-1.5-1.5-1.5z" />
    </svg>
  );
}

function IcoUnmute() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 9h3.2L12 5.5v13L7.2 15H4V9zm10.2 1.2a3.6 3.6 0 0 1 0 3.6l-1.3-1.1a1.9 1.9 0 0 0 0-1.4l1.3-1.1zm2.2-2.4a6.5 6.5 0 0 1 0 8.4l-1.3-1.1a4.8 4.8 0 0 0 0-6.2l1.3-1.1z" />
    </svg>
  );
}

function TrashIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z" />
    </svg>
  );
}

/**
 * Plancia unificata (scheletro /board): contenitore rigido + tab sinistre
 * (Regia, Video, Giocatori, Setup). Ufficiale su `/admin/{code}/board`.
 * `/serata` redirect a board. /admin e /admin/plancia restano per raffronto.
 */
export function CasaPadBoard({ eventCode }: { eventCode: string }) {
  const live = useCasaLiveSession();
  const [beat, setBeat] = useState<CasaBeat>("casa");
  const [sigla, setSigla] = useState<"idle" | "warn" | "on" | "hold">("idle");
  const [roll, setRoll] = useState(0);
  const [count, setCount] = useState<number | null>(null);
  const [quizGate, setQuizGate] = useState<"tema" | "play">("tema");
  const [goBusy, setGoBusy] = useState(false);
  const [goError, setGoError] = useState<string | null>(null);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [siglaBundledOk, setSiglaBundledOk] = useState<boolean | null>(null);
  const onSiglaAvailability = useCallback((ok: boolean) => {
    setSiglaBundledOk(ok);
  }, []);
  /** Roster locale in plancia; la lista API è nella tab Giocatori. */
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const pickedIdRef = useRef<string | null>(null);
  const pickedTimerRef = useRef<number | null>(null);
  const [screenField, setScreenField] = useState<PlayerScreenField | null>(
    null,
  );

  useEffect(() => {
    pickedIdRef.current = pickedId;
  }, [pickedId]);

  useEffect(() => {
    return () => {
      if (pickedTimerRef.current != null) {
        window.clearTimeout(pickedTimerRef.current);
        pickedTimerRef.current = null;
      }
    };
  }, []);
  const [help, setHelp] = useState(false);
  /** Autoplay plancia: vale già in apertura (prima del quiz live). */
  const [boardAutoplay, setBoardAutoplay] = useState(false);
  const goRef = useRef<() => void | Promise<void>>(() => {});
  const [externalScreenOn, setExternalScreenOn] = useState(false);
  const projectorWinRef = useRef<Window | null>(null);
  /** WebView iPad: niente Window da chiudere — toggle via bridge. */
  const nativeProjectorOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onNative = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if (detail?.open === true) {
        nativeProjectorOpenRef.current = true;
        setExternalScreenOn(true);
        return;
      }
      if (detail?.open === false) {
        nativeProjectorOpenRef.current = false;
        setExternalScreenOn(false);
      }
    };
    window.addEventListener("lr-native-projector", onNative);
    return () => window.removeEventListener("lr-native-projector", onNative);
  }, []);
  const [rail, setRail] = useState<RailTab>("plancia");
  const [expand, setExpand] = useState<ExpandPanel>(null);
  const [layout, setLayout] = useState<BoardLayout>(DEFAULT_BOARD_LAYOUT);
  const [prep, setPrep] = useState<Prep>(DEFAULT_CASA_PREP);
  const [clockPrefs, setClockPrefs] = useState<CasaClockPrefs>(() => ({
    ...DEFAULT_CASA_CLOCK,
    originMs: Date.now(),
  }));
  const [now, setNow] = useState(() => Date.now());
  const [hits, setHits] = useState<Set<CasaPadHitId>>(() => new Set());
  const [padSetIds, setPadSetIds] = useState<PadId[]>(() =>
    typeof window === "undefined"
      ? BOARD_PAD_FALLBACK.map((h) => h.id)
      : loadPadSetIds(),
  );
  const [padBankRev, setPadBankRev] = useState(0);
  const padSetHits = useMemo(() => {
    const library = resolvePadLibrary(
      loadPadCustomHits(),
      loadPadLabelOverrides(),
    );
    return resolvePadSet(padSetIds, library);
    // padBankRev: rilegge custom/label da localStorage dopo edit suite
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [padSetIds, padBankRev]);
  const [msgs, setMsgs] = useState<
    { id: string; who: string; text: string }[]
  >(() => [
    { id: "1", who: "Anonimo", text: "come si entra?" },
    { id: "2", who: "Anonimo", text: "dov’è il Wi‑Fi?" },
    { id: "3", who: "Luca", text: "si parte o no?" },
  ]);
  const [bedFolder, setBedFolder] = useState<string | null>(null);
  const [bedList, setBedList] = useState<CasaMediaTrack[]>([]);
  const [bedIndex, setBedIndex] = useState(0);
  const [bedRepeat, setBedRepeat] = useState<CasaRepeatMode>("all");
  const [bedPlaying, setBedPlaying] = useState(false);
  /** Dopo il primo Play riuscito (o AVANTI che avvia la colonna): abilita gong/reveal. */
  const [audioArmed, setAudioArmed] = useState(false);
  const [masterVol, setMasterVol] = useState(100);
  const [audioRoute, setAudioRoute] = useState<CasaAudioRoute>(() =>
    typeof window === "undefined"
      ? { kind: "local", sinkId: "default", label: "Questo dispositivo" }
      : loadCasaAudioRoute(),
  );
  const [audioOutputs, setAudioOutputs] = useState<CasaAudioOutputOption[]>([]);
  const remoteAudio = isRemoteAudioRoute(audioRoute);
  const [vols, setVols] = useState<Record<FaderId, number>>({
    sigla: 70,
    bed: 45,
    fx: 55,
  });
  const [mute, setMute] = useState<Record<FaderId, boolean>>({
    sigla: false,
    bed: false,
    fx: false,
  });
  const [gongAtmo] = useState<CasaGongAtmosphere>(DEFAULT_GONG_ATMOSPHERE);
  const [bedSeek, setBedSeek] = useState({ current: 0, duration: 0 });
  const [bedPickError, setBedPickError] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<CasaVideoState>(DEFAULT_VIDEO);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [cmdBusy, setCmdBusy] = useState(false);
  const [cmdError, setCmdError] = useState<string | null>(null);
  const [boardToast, setBoardToast] = useState<BoardToast | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeQ, setResumeQ] = useState(1);
  const [activeDisplayCue, setActiveDisplayCue] =
    useState<BoardDisplayCueId | null>(null);
  /** Dopo Partenza: playlist/regia locali cedono a sigla e colonna del gioco. */
  const [gameOwnsAv, setGameOwnsAv] = useState(false);
  const bedAudio = useRef<HTMLAudioElement | null>(null);
  const bedFadeRaf = useRef<number | null>(null);
  const bedDirInput = useRef<HTMLInputElement>(null);
  const bedFilesInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const videoDirInput = useRef<HTMLInputElement>(null);
  const videoTapRef = useRef<{ url: string; at: number } | null>(null);
  const staccoLaunchRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);
  const toastUndoBusy = useRef(false);

  const clearBoardToast = useCallback(() => {
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setBoardToast(null);
  }, []);

  const flashBoardToast = useCallback(
    (
      message: string,
      opts?: { undo?: () => void | Promise<void>; ms?: number },
    ) => {
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current);
      }
      const id = Date.now();
      const hasUndo = Boolean(opts?.undo);
      setBoardToast({
        id,
        message,
        undo: opts?.undo,
      });
      toastTimerRef.current = window.setTimeout(
        () => {
          setBoardToast((cur) => (cur?.id === id ? null : cur));
          toastTimerRef.current = null;
        },
        opts?.ms ?? (hasUndo ? 3000 : 2200),
      );
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const applyDemoChatMessages = useCallback(
    (messages: { id: string; who: string; text: string }[]) => {
      if (!messages.length) return;
      setMsgs(messages.map((m) => ({ id: m.id, who: m.who, text: m.text })));
    },
    [],
  );

  // Chat demo da «10 coppie test» → riquadro Messaggi (evento + callback diretto).
  useEffect(() => {
    function onDemoChat(ev: Event) {
      const detail = (ev as CustomEvent<CasaSimDemoChatDetail>).detail;
      const messages = detail?.messages;
      if (!messages?.length) return;
      applyDemoChatMessages(messages);
    }
    window.addEventListener(CASA_SIM_DEMO_CHAT_EVENT, onDemoChat);
    return () => {
      window.removeEventListener(CASA_SIM_DEMO_CHAT_EVENT, onDemoChat);
    };
  }, [applyDemoChatMessages]);

  // Roster live → riquadro Giocatori (stesso fetch di CasaPad / tab Lista).
  useEffect(() => {
    if (!live.pinReady) return;
    let cancelled = false;

    async function loadRoster() {
      try {
        const res = await fetchParticipants(eventCode, live.pin);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          participants?: Parameters<typeof boardPlayerFromRow>[0][];
        };
        const rows = data.participants ?? [];
        if (cancelled) return;
        if (rows.length === 0) {
          setGuests([]);
          return;
        }
        setGuests(rows.map(boardPlayerFromRow));
      } catch {
        /* keep last roster */
      }
    }

    void loadRoster();
    const id = window.setInterval(() => void loadRoster(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [eventCode, live.pin, live.pinReady]);

  const specialTrialPanelOpen =
    live.specialTrial != null &&
    (live.specialTrial.status === "booked" ||
      live.specialTrial.status === "setup" ||
      live.specialTrial.status === "running" ||
      live.specialTrial.status === "closing" ||
      live.specialTrial.status === "results");

  const venue = prep.venueName || live.event?.title || live.event?.venueName || eventCode;
  const onStage = guests[roll];
  const goLabel =
    beat === "quiz" && quizGate === "tema"
      ? "Domanda"
      : avantiLabel({ beat, sigla, roll, guestCount: guests.length });
  const masterScale = masterVol / 100;
  const effVol = (id: FaderId) =>
    mute[id] ? 0 : (vols[id] / 100) * masterScale;
  const onlineHint = live.stats.onlineCount || live.stats.participantCount;
  const liveQuizActive =
    live.runtimeState === "quiz" && Boolean(live.quizState);
  // Binario: start_countdown + answers (timer→%) tickano sempre; hold solo con Auto.
  const { displayPhase: liveQuizPhase, remaining: liveQuizRemaining } =
    useQuizPhaseSync({
      eventSlug: eventCode,
      quizState: live.quizState,
      enabled: liveQuizActive && !live.controlsDisabled,
      driveTicks:
        liveQuizActive &&
        !live.controlsDisabled &&
        (live.quizState?.autoplayEnabled === true ||
          live.quizState?.displayPhase === "start_countdown" ||
          live.quizState?.displayPhase === "answers"),
      onTick: (quiz, runtime) => {
        live.applyQuizUpdate(quiz, runtime);
      },
    });
  // Gong sullo «0» del countdown risposte — solo dopo Play (niente stale all’apertura).
  useQuizGongAtCountdownEnd({
    quizState: live.quizState,
    enabled:
      audioArmed &&
      liveQuizActive &&
      !live.controlsDisabled &&
      !mute.fx &&
      masterVol > 0,
  });
  const { currentQuestion: liveQuestion } = useCurrentQuizQuestion(
    eventCode,
    live.quizState,
    live.runtimeState,
  );

  const bedBeat = casaEffectiveBedBeat(beat, liveQuizActive);

  // Bianco (STOP): silenzia il bed countdown sotto al gong.
  useEffect(() => {
    if (!liveQuizActive || liveQuizPhase !== "answers") return;
    if (liveQuizRemaining == null || liveQuizRemaining > 0) return;
    fadeOutBed(() => setBedPlaying(false));
    // fadeOutBed is stable enough for lock edge; intentionally omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveQuizActive, liveQuizPhase, liveQuizRemaining]);

  // Dopo gong + gap: riparte la colonna (bed tematica sotto le %).
  useEffect(() => {
    if (!audioArmed || !liveQuizActive || liveQuizPhase !== "results") return;
    return whenQuizGongCleared(() => {
      setBedPlaying(true);
    });
  }, [audioArmed, liveQuizActive, liveQuizPhase]);

  useEffect(() => {
    if (!liveQuizActive || liveQuizPhase !== "results") {
      if (liveQuizPhase !== "results") resetCasaResultsRevealHit();
      return;
    }
    if (!audioArmed) return;
    const cue = `${live.quizState?.currentIndex ?? 0}:${live.quizState?.phaseStartedAt ?? "results"}`;
    playCasaResultsRevealHit({ cueKey: cue });
  }, [
    audioArmed,
    live.quizState?.currentIndex,
    live.quizState?.phaseStartedAt,
    liveQuizActive,
    liveQuizPhase,
  ]);

  const {
    questions: cueQuestions,
    loading: cueLoading,
    refetch: refetchCueQuestions,
  } = useQuizQuestions(
    eventCode,
    Boolean(live.event) || Boolean(live.quizState),
  );

  // Dopo start quiz (materialize pool→event) gli id cambiano: ricarica la banca.
  useEffect(() => {
    if (!liveQuizActive) return;
    refetchCueQuestions();
  }, [liveQuizActive, refetchCueQuestions]);
  const plannedCount = Math.max(
    1,
    live.event?.quizSetup.questionCount ?? (cueQuestions.length || 1),
  );
  const [lineupIds, setLineupIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (live.quizState?.questionIds?.length) {
      setLineupIds(live.quizState.questionIds);
      return;
    }
    if (lineupIds != null || cueQuestions.length === 0) return;
    const limit = Math.min(plannedCount, cueQuestions.length);
    setLineupIds(cueQuestions.slice(0, limit).map((q) => q.id));
  }, [cueQuestions, live.quizState?.questionIds, lineupIds, plannedCount]);

  const nextCueIndex = boardCueQuestionIndex({
    quizActive: liveQuizActive,
    displayPhase: liveQuizActive ? liveQuizPhase : null,
    currentIndex: live.quizState?.currentIndex ?? 0,
  });
  const cueLineup =
    live.quizState?.questionIds ?? lineupIds ?? [];
  const nextCueQuestion = useMemo(() => {
    if (nextCueIndex < 0 || nextCueIndex >= cueLineup.length) return null;
    const id = cueLineup[nextCueIndex];
    if (!id) return null;
    const raw = cueQuestions.find((q) => q.id === id) ?? null;
    if (!raw) return null;
    return questionWithShuffledOptions(raw, eventCode);
  }, [cueQuestions, cueLineup, eventCode, nextCueIndex]);
  const canChangeNextQuestion =
    nextCueIndex >= 0 &&
    nextCueIndex < cueLineup.length &&
    cueQuestions.length > 0;
  const projectorQuizGate: "tema" | "play" = liveQuizActive
    ? liveQuizPhase === "theme_intro" || liveQuizPhase === "start_countdown"
      ? "tema"
      : "play"
    : quizGate;
  const projectorQuestion = useMemo(() => {
    if (!liveQuizActive || !liveQuestion) return null;
    return {
      text: liveQuestion.body,
      category: liveQuestion.category,
      options: [
        liveQuestion.options[0]?.label ?? "",
        liveQuestion.options[1]?.label ?? "",
        liveQuestion.options[2]?.label ?? "",
        liveQuestion.options[3]?.label ?? "",
      ] as [string, string, string, string],
    };
  }, [
    liveQuizActive,
    liveQuestion?.id,
    liveQuestion?.body,
    liveQuestion?.category,
    liveQuestion?.options[0]?.label,
    liveQuestion?.options[1]?.label,
    liveQuestion?.options[2]?.label,
    liveQuestion?.options[3]?.label,
  ]);

  const elapsedNow = formatElapsed(now - clockPrefs.originMs);
  const exactNow = formatExact(now);

  const bedOpts = useMemo(
    () => ({
      sigla,
      displayCue: activeDisplayCue,
      specialTrial: live.specialTrial?.status ?? null,
    }),
    [sigla, activeDisplayCue, live.specialTrial?.status],
  );

  const specialTrialActive = isSpecialTrialBlockingQuiz(live.specialTrial);

  const activeBed = useMemo(
    () =>
      resolveCasaBed(
        bedBeat,
        gameOwnsAv || beat === "sigla" || specialTrialActive
          ? null
          : bedFolder
            ? bedList
            : null,
        bedIndex,
        liveQuizActive ? liveQuizPhase : null,
        liveQuizActive ? liveQuestion?.category ?? null : null,
        bedOpts,
      ),
    [
      bedBeat,
      beat,
      bedFolder,
      bedList,
      bedIndex,
      gameOwnsAv,
      specialTrialActive,
      liveQuizActive,
      liveQuizPhase,
      liveQuestion?.category,
      bedOpts,
    ],
  );

  useEffect(() => {
    setPrep(loadPrep(eventCode));
    setClockPrefs(loadClock(eventCode));
    setLayout(loadBoardLayout());
    setSlides(loadSlides(eventCode));
    setAudioRoute(loadCasaAudioRoute());
    prefetchCasaPadHits();
    const refreshOutputs = () => {
      void listCasaAudioOutputs().then(setAudioOutputs);
    };
    refreshOutputs();
    const devices = navigator.mediaDevices;
    if (!devices?.addEventListener) return;
    devices.addEventListener("devicechange", refreshOutputs);
    return () => devices.removeEventListener("devicechange", refreshOutputs);
  }, [eventCode]);

  useEffect(() => {
    if (expand !== "audio") return;
    void listCasaAudioOutputs().then(setAudioOutputs);
  }, [expand]);

  useEffect(() => {
    void applyAudioSink(bedAudio.current, audioRoute);
  }, [audioRoute]);

  useEffect(() => {
    if (live.controlsDisabled || !live.pin) return;
    void postDisplayAudioStart(eventCode, live.pin, remoteAudio);
  }, [remoteAudio, eventCode, live.pin, live.controlsDisabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(BOARD_LAYOUT_KEY, JSON.stringify(layout));
    } catch {
      /* ignore quota */
    }
  }, [layout]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    savePrep(eventCode, prep);
  }, [eventCode, prep]);

  useEffect(() => {
    saveClock(eventCode, clockPrefs);
  }, [eventCode, clockPrefs]);

  useEffect(() => {
    if (beat !== "stacco") {
      staccoLaunchRef.current = false;
      return;
    }
    if (count == null) return;

    if (count > 0) {
      const t = window.setTimeout(
        () => setCount((c) => (c == null ? null : c - 1)),
        1000,
      );
      return () => window.clearTimeout(t);
    }

    // Fine stacco → quiz sull’argomento (tema), senza click.
    if (staccoLaunchRef.current) return;
    staccoLaunchRef.current = true;
    setCount(null);
    setBeat("quiz");
    setQuizGate("tema");

    void (async () => {
      if (live.runtimeState !== "lobby") return;
      setGoBusy(true);
      setGoError(null);
      try {
        const questionsRes = await Promise.race([
          fetch(`/api/events/${encodeURIComponent(eventCode)}/questions`),
          new Promise<Response>((_, reject) =>
            window.setTimeout(
              () => reject(new Error("Timeout caricamento domande.")),
              10_000,
            ),
          ),
        ]);
        if (!questionsRes.ok) {
          setGoError("Impossibile caricare le domande.");
          return;
        }
        const result = await live.runQuizAction("start", {
          questionCount: live.event?.quizSetup.questionCount ?? undefined,
          questionSeconds: live.event?.quizSetup.questionSeconds ?? undefined,
          hideRankingLastN: live.event?.quizSetup.hideRankingLastN,
              rankingEveryN: live.event?.quizSetup.rankingEveryN,
          skipStartCountdown: true,
          autoplayEnabled: boardAutoplay,
          questionIds: lineupIds ?? undefined,
        });
        if (!result.ok) {
          setGoError(result.error);
          return;
        }
        setQuizGate("play");
        void postDisplayCommand(eventCode, { type: "clear" }, live.pin);
      } catch (err) {
        setGoError(
          err instanceof Error ? err.message : "Avvio quiz non riuscito.",
        );
      } finally {
        setGoBusy(false);
      }
    })();
  }, [
    beat,
    boardAutoplay,
    count,
    eventCode,
    live.event?.quizSetup.hideRankingLastN,
    live.event?.quizSetup.questionCount,
    live.event?.quizSetup.questionSeconds,
    live.pin,
    live.runQuizAction,
    live.runtimeState,
    lineupIds,
  ]);

  useEffect(() => {
    if (!live.pinReady) return;
    const slideIds: CasaSlideId[] = [
      "pres",
      "regole",
      "finale",
      "premio",
      "sponsor",
      "stasera",
    ];
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        try {
          {
            const qrCmd = casaQrDisplayCommand(help, beat);
            if (qrCmd) {
              await postDisplayCommand(eventCode, qrCmd, live.pin);
              return;
            }
          }
          if (beat === "sigla" && sigla === "warn") {
            await postDisplayCommand(eventCode, SIGLA_WARN_SLIDE, live.pin);
            return;
          }
          if (beat === "sigla") {
            await postDisplayCommand(eventCode, { type: "clear" }, live.pin);
            return;
          }
          if (beat === "presenti" && onStage) {
            await postDisplayCommand(
              eventCode,
              playerPresentiDisplayCommand(onStage),
              live.pin,
            );
            return;
          }
          if (beat === "stacco") {
            await postDisplayCommand(
              eventCode,
              {
                type: "slide",
                kicker: STACCO_KICKER,
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
          }
        } catch {
          /* display non bloccante */
        }
      })();
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    beat,
    sigla,
    help,
    count,
    eventCode,
    live.pin,
    live.pinReady,
    onStage,
    slides,
  ]);

  useEffect(() => {
    const el = bedAudio.current;
    if (!el) return;
    if (bedFadeRaf.current != null) return;
    setMediaVolume(el, effVol("bed"));
  }, [vols.bed, mute.bed, masterVol]);

  useEffect(() => {
    const el = bedAudio.current;
    if (!el) return;
    if (!activeBed?.url) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      setBedSeek({ current: 0, duration: 0 });
      return;
    }
    const abs = new URL(activeBed.url, window.location.origin).href;
    const shouldPlay =
      bedPlaying && !remoteAudio && !(gameOwnsAv && beat === "sigla");
    const targetVol = Math.min(1, Math.max(0, effVol("bed")));
    const fadeMs = AVANTI_CROSSFADE_MS;
    el.loop = !bedFolder || bedRepeat === "one" || gameOwnsAv;

    const cancelFade = () => {
      if (bedFadeRaf.current != null) {
        cancelAnimationFrame(bedFadeRaf.current);
        bedFadeRaf.current = null;
      }
    };

    const fadeTo = (toVol: number, ms: number, onDone?: () => void) => {
      cancelFade();
      const startVol = getMediaVolume(el);
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        setMediaVolume(el, startVol + (toVol - startVol) * t);
        if (t < 1) {
          bedFadeRaf.current = requestAnimationFrame(tick);
          return;
        }
        bedFadeRaf.current = null;
        setMediaVolume(el, toVol);
        onDone?.();
      };
      bedFadeRaf.current = requestAnimationFrame(tick);
    };

    if (el.src === abs) {
      el.loop = !bedFolder || bedRepeat === "one" || gameOwnsAv;
      if (shouldPlay) {
        const wasPaused = el.paused;
        void el.play().then(() => {
          if (wasPaused || getMediaVolume(el) < targetVol * 0.85) {
            setMediaVolume(el, 0);
            fadeTo(targetVol, fadeMs);
          } else {
            setMediaVolume(el, targetVol);
          }
        }).catch(() => setBedPlaying(false));
      } else if (!el.paused) {
        fadeTo(0, fadeMs, () => {
          el.pause();
          setMediaVolume(el, targetVol);
        });
      } else {
        setMediaVolume(el, targetVol);
      }
      return;
    }

    // Crossover morbido su cambio bed (AVANTI / fasi quiz / playlist).
    cancelFade();

    const swapIn = () => {
      el.src = activeBed.url;
      setBedSeek({ current: 0, duration: 0 });
      el.loop = !bedFolder || bedRepeat === "one" || gameOwnsAv;
      setMediaVolume(el, 0);
      if (!shouldPlay) {
        el.pause();
        setMediaVolume(el, targetVol);
        return;
      }
      void el.play().then(() => {
        fadeTo(targetVol, fadeMs);
      }).catch(() => setBedPlaying(false));
    };

    if (!el.paused && el.currentSrc) {
      fadeTo(0, fadeMs, () => {
        el.pause();
        swapIn();
      });
      return;
    }

    swapIn();
  }, [
    activeBed?.url,
    bedFolder,
    bedRepeat,
    bedPlaying,
    gameOwnsAv,
    beat,
    remoteAudio,
  ]);

  useEffect(() => {
    const el = bedAudio.current;
    if (!el) return;
    const onTime = () => {
      setBedSeek({
        current: el.currentTime || 0,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
      });
    };
    const onEnded = () => {
      if (!bedFolder || bedList.length === 0) return;
      const next = nextIndex(bedIndex, bedList.length, bedRepeat);
      if (next == null) {
        setBedPlaying(false);
        return;
      }
      if (next === bedIndex && bedRepeat === "one") {
        el.currentTime = 0;
        void el.play().catch(() => setBedPlaying(false));
        return;
      }
      setBedIndex(next);
      setBedPlaying(true);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [bedFolder, bedList.length, bedIndex, bedRepeat]);

  /**
   * Apertura locale (casa→stacco) + ingresso quiz come /serata.
   * In quiz live, WidgetConductor passa a WidgetTransport (GO fase).
   * Non tocca stepAvanti / binario — solo il wiring della board.
   */
  async function go() {
    setGoError(null);

    if (beat !== "quiz") {
      setGoBusy(false);
      const step = stepAvanti({
        beat,
        sigla,
        roll,
        guestCount: guests.length,
      });

      // Partenza (casa → warn): slide pre-sigla + colonna più elettrizzante (non spegnere).
      if (beat === "casa" && step.beat === "sigla" && step.sigla === "warn") {
        setGameOwnsAv(true);
        clearMediaOnScreen();
        setActiveDisplayCue(null);
        setAudioArmed(true);
        setBedPlaying(true);
      }

      // Sigla (warn → on): fade colonna, parte video+audio sigla sul proiettore
      if (beat === "sigla" && sigla === "warn" && step.sigla === "on") {
        setGameOwnsAv(true);
        clearMediaOnScreen();
        fadeOutBed(() => setBedPlaying(false));
      }

      // Fuori sigla → BENVENUTI + lobby (crossfade A/V via AnimatePresence + bed fade)
      if (beat === "sigla" && step.beat === "pres") {
        leaveSiglaToWelcome("avanti");
        return;
      }

      // Altri passi apertura: colonna auto, no media regia
      if (step.beat !== "casa" && step.beat !== "sigla") {
        setGameOwnsAv(true);
        clearMediaOnScreen();
        setAudioArmed(true);
        setBedPlaying(true);
      }

      setBeat(step.beat);
      setSigla(step.sigla);
      setRoll(step.roll);
      if (step.stacco) setCount(5);
      if (step.beat === "quiz") {
        setCount(null);
        setQuizGate("tema");
      }
      if (step.beat !== "casa" && rail === "setup") setRail("plancia");
      if (step.beat !== "casa") setExpand(null);
      return;
    }

    // beat === quiz: primo tap avvia sessione live se ancora lobby, poi tema→domanda
    if (quizGate === "tema") {
      if (live.runtimeState === "lobby") {
        setGoBusy(true);
        try {
          const questionsRes = await Promise.race([
            fetch(`/api/events/${encodeURIComponent(eventCode)}/questions`),
            new Promise<Response>((_, reject) =>
              window.setTimeout(
                () => reject(new Error("Timeout caricamento domande.")),
                10_000,
              ),
            ),
          ]);
          if (!questionsRes.ok) {
            setGoError("Impossibile caricare le domande.");
            return;
          }
          const result = await live.runQuizAction("start", {
            questionCount: live.event?.quizSetup.questionCount ?? undefined,
            questionSeconds: live.event?.quizSetup.questionSeconds ?? undefined,
            hideRankingLastN: live.event?.quizSetup.hideRankingLastN,
              rankingEveryN: live.event?.quizSetup.rankingEveryN,
            autoplayEnabled: boardAutoplay,
            questionIds: lineupIds ?? undefined,
          });
          if (!result.ok) {
            setGoError(result.error);
            return;
          }
          void postDisplayCommand(eventCode, { type: "clear" }, live.pin);
        } catch (err) {
          setGoError(
            err instanceof Error ? err.message : "Avvio quiz non riuscito.",
          );
          return;
        } finally {
          setGoBusy(false);
        }
      }
      setQuizGate("play");
      return;
    }

    setQuizGate("tema");
  }

  goRef.current = () => {
    void go();
  };

  // Allinea flag plancia ↔ quiz quando siamo in manche live.
  useEffect(() => {
    if (live.runtimeState !== "quiz" || !live.quizState) return;
    setBoardAutoplay(live.quizState.autoplayEnabled === true);
  }, [live.runtimeState, live.quizState?.autoplayEnabled]);

  // Autoplay apertura: ogni slide/passo senza timer dedicato → 5s poi AVANTI locale.
  useEffect(() => {
    if (!boardAutoplay || live.controlsDisabled || goBusy) return;
    const hold = openingAutoplayHoldSeconds({ beat, sigla });
    if (hold == null) return;
    const timer = window.setTimeout(() => {
      void goRef.current();
    }, hold * 1000);
    return () => window.clearTimeout(timer);
  }, [
    boardAutoplay,
    beat,
    sigla,
    roll,
    guests.length,
    goBusy,
    live.controlsDisabled,
  ]);

  function firePad(id: CasaPadHitId, src?: string) {
    if (remoteAudio) return;
    const on = toggleCasaPadHit(
      id,
      effVol("fx"),
      () => {
        setHits((cur) => {
          const next = new Set(cur);
          next.delete(id);
          return next;
        });
      },
      src,
    );
    setHits((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function commitAudioRoute(route: CasaAudioRoute) {
    setAudioRoute(route);
    saveCasaAudioRoute(route);
  }

  function handlePadSetIdsChange(ids: PadId[]) {
    setPadSetIds(ids);
    savePadSetIds(ids);
    setPadBankRev((n) => n + 1);
  }

  function applyBedFiles(name: string, files: File[]) {
    const tracks = tracksFromFiles(files, "audio");
    if (!tracks.length) {
      setBedPickError("Nessun file audio in questa selezione.");
      return;
    }
    revokeTracks(bedList);
    setBedPickError(null);
    setBedFolder(name);
    setBedList(tracks);
    setBedIndex(0);
    setAudioArmed(true);
    setBedPlaying(true);
  }

  async function pickBedFolder() {
    setBedPickError(null);
    const picked = await pickDirectoryFiles();
    if (picked) {
      applyBedFiles(picked.name, picked.files);
      return;
    }
    // Safari / deny picker → input cartella (webkitdirectory)
    bedDirInput.current?.click();
  }

  function onBedFiles(files: FileList | null, folderName = "File locali") {
    if (!files?.length) return;
    applyBedFiles(folderName, Array.from(files));
  }

  function applyVideoFiles(files: File[]) {
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
  }

  async function pickVideoFolder() {
    const picked = await pickDirectoryFiles();
    if (picked) {
      applyVideoFiles(picked.files);
      return;
    }
    videoDirInput.current?.click();
  }

  function clearMediaOnScreen() {
    setVideoState((prev) => ({
      ...prev,
      onScreenUrl: null,
      onScreenName: null,
    }));
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

  function seekBed(ratio: number) {
    const el = bedAudio.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    el.currentTime = Math.max(0, Math.min(el.duration, ratio * el.duration));
  }

  /**
   * Play/Pausa colonna — `el.play()` nel gesto utente (Safari/iOS).
   * Senza playlist locale usa la bed auto (lobby su beat casa).
   */
  async function toggleBedPlayback() {
    const el = bedAudio.current;
    if (!el) return;

    if (bedPlaying) {
      setBedPlaying(false);
      el.pause();
      return;
    }

    // Arm FX prima del play: se siamo già a results / answers=0, consuma le cue
    // stale così il primo Play non spara gong+reveal insieme alla lobby.
    if (liveQuizActive && live.quizState) {
      const cue = `${live.quizState.currentIndex}:${live.quizState.phaseStartedAt}`;
      if (
        liveQuizPhase === "results" ||
        (liveQuizPhase === "answers" && (liveQuizRemaining ?? 0) <= 0)
      ) {
        consumeCasaResultsRevealCue(cue);
      }
    }
    setAudioArmed(true);

    if (remoteAudio) {
      setBedPlaying(true);
      flashBoardToast(`Audio su ${audioRoute.label}`);
      return;
    }

    const bed =
      activeBed ??
      resolveCasaBedOrLobby(
        bedBeat,
        null,
        0,
        liveQuizActive ? liveQuizPhase : null,
        liveQuizActive ? liveQuestion?.category ?? null : null,
        bedOpts,
      );

    const abs = new URL(bed.url, window.location.origin).href;
    if (el.src !== abs) {
      el.src = bed.url;
      setBedSeek({ current: 0, duration: 0 });
    }
    el.loop = !bedFolder || bedRepeat === "one" || gameOwnsAv;
    const targetVol = Math.min(1, Math.max(0, effVol("bed")));
    setMediaVolume(el, targetVol);
    setBedPlaying(true);
    try {
      await resumeMediaAudio(el);
      await el.play();
      flashBoardToast(`${bed.name} in play`);
    } catch {
      setBedPlaying(false);
      setCmdError("Play bloccato dal browser — ritocca Play");
    }
  }

  const hasPlaylist = bedList.length > 0;
  const currentTrackName = hasPlaylist
    ? bedList[bedIndex]?.name ?? "—"
    : null;

  const mediaOnScreen =
    gameOwnsAv || beat === "sigla"
      ? null
      : videoState.onScreenUrl && videoState.onScreenName
        ? {
            url: videoState.onScreenUrl,
            name: videoState.onScreenName,
            muted: videoState.muted,
          }
        : null;

  const eventTitle =
    live.event?.title?.trim() || venue || eventCode;
  const pinRequired = Boolean(live.event?.animatorPinRequired);
  const drawerOpen = rail !== "plancia";
  const drawerTitle =
    rail === "plancia" ? "" : RAIL_TITLE[rail];

  function openRail(tab: RailTab) {
    setExpand(null);
    setRail((cur) => (cur === tab && tab !== "plancia" ? "plancia" : tab));
  }

  function openExpand(panel: Exclude<ExpandPanel, null>) {
    setRail("plancia");
    setExpand(panel);
  }

  const picked = guests.find((g) => g.id === pickedId) ?? null;
  /** Niente overlay giocatore sopra il countdown risposte. */
  const playerScreenBlocked =
    liveQuizActive && liveQuizPhase === "answers";

  async function sendPlayerToScreen(
    player: BoardPlayer,
    field: PlayerScreenField = "card",
  ) {
    if (live.controlsDisabled) return;
    if (!live.pinReady) {
      flashBoardToast("PIN animatore richiesto");
      live.openPinModal();
      return;
    }
    if (playerScreenBlocked) {
      flashBoardToast("Non durante il countdown risposte");
      return;
    }
    const command = playerDetailDisplayCommand(player, field);
    setScreenField(field);
    try {
      const response = await postDisplayCommand(
        eventCode,
        command,
        live.pin,
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Invio al proiettore non riuscito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          live.openPinModal();
        }
        setCmdError(message);
        return;
      }
      const detail = playerScreenDetails(player).find((d) => d.field === field);
      const hint =
        field === "card" || field === "photo" || field === "nick"
          ? `${player.nick} a schermo`
          : `${player.nick} · ${detail?.label ?? field}: ${detail?.value ?? ""}`;
      flashBoardToast(hint);
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Invio al proiettore non riuscito.",
      );
    }
  }

  function clearPickedHold() {
    if (pickedTimerRef.current != null) {
      window.clearTimeout(pickedTimerRef.current);
      pickedTimerRef.current = null;
    }
  }

  function clearPlayerFromScreen(toastNick?: string) {
    clearPickedHold();
    pickedIdRef.current = null;
    setPickedId(null);
    setScreenField(null);
    if (!live.controlsDisabled && live.pinReady) {
      void postDisplayCommand(eventCode, { type: "clear" }, live.pin);
    }
    if (toastNick) flashBoardToast(`${toastNick} tolto dallo schermo`);
  }

  /** Presenti: salta il resto della presentazione → stacco (niente click uno a uno). */
  function skipPresentiRoll() {
    if (beat !== "presenti") return;
    logAvantiBinary("skip", "presenti roll skipped → stacco", {
      from: beat,
      to: "stacco",
      roll,
    });
    setBeat("stacco");
    setCount(5);
    flashBoardToast("Presentazione saltata → stacco");
  }

  /** Chiude il riquadro: se c’era un giocatore a schermo, torna al gioco. */
  function closeExpand() {
    if (expand === "players" && pickedId) {
      clearPlayerFromScreen();
    }
    setExpand(null);
  }

  /** Toggle on per 5s: highlight + schermo, poi spegne. */
  function armPickedHold(playerId: string) {
    clearPickedHold();
    pickedIdRef.current = playerId;
    setPickedId(playerId);
    pickedTimerRef.current = window.setTimeout(() => {
      pickedTimerRef.current = null;
      if (pickedIdRef.current !== playerId) return;
      pickedIdRef.current = null;
      setPickedId(null);
      setScreenField(null);
      if (!live.controlsDisabled && live.pinReady) {
        void postDisplayCommand(eventCode, { type: "clear" }, live.pin);
      }
    }, PLAYER_SCREEN_HOLD_MS);
  }

  /** Card Giocatori: tap = toggle a schermo (on 5s); ritap = off + clear. */
  function sendPlayerFromCard(player: BoardPlayer) {
    if (pickedId === player.id) {
      clearPlayerFromScreen(player.nick);
      return;
    }
    if (playerScreenBlocked) {
      flashBoardToast("Non durante il countdown risposte");
      return;
    }
    armPickedHold(player.id);
    void sendPlayerToScreen(player, "card");
  }

  /** Riquadro espanso: seleziona, mostra dettagli e manda card a schermo. */
  function pickPlayerInExpand(player: BoardPlayer) {
    if (pickedId === player.id) {
      clearPlayerFromScreen();
      return;
    }
    if (playerScreenBlocked) {
      flashBoardToast("Non durante il countdown risposte");
      return;
    }
    armPickedHold(player.id);
    setScreenField("card");
    void sendPlayerToScreen(player, "card");
  }

  /** Toggle dettaglio nel foglio giocatore (stesso campo = off). */
  function togglePlayerDetail(player: BoardPlayer, field: PlayerScreenField) {
    if (screenField === field && pickedId === player.id) {
      clearPlayerFromScreen(player.nick);
      return;
    }
    if (playerScreenBlocked) {
      flashBoardToast("Non durante il countdown risposte");
      return;
    }
    armPickedHold(player.id);
    void sendPlayerToScreen(player, field);
  }

  function resizeCols(edge: 0 | 1, deltaPx: number, containerSize: number) {
    setLayout((cur) => {
      const [a, b] = adjustPair(
        cur.cols[edge],
        cur.cols[edge + 1],
        deltaPx,
        containerSize,
        0.35,
      );
      const cols = [...cur.cols] as BoardLayout["cols"];
      cols[edge] = a;
      cols[edge + 1] = b;
      return { ...cur, cols };
    });
  }

  function resizeStack(
    stack: "left" | "right" | "center",
    edge: 0 | 1,
    deltaPx: number,
    containerSize: number,
  ) {
    setLayout((cur) => {
      const row = [...cur[stack]] as number[];
      if (edge + 1 >= row.length) return cur;
      const [a, b] = adjustPair(
        row[edge]!,
        row[edge + 1]!,
        deltaPx,
        containerSize,
        stack === "center" ? 0.45 : 0.4,
      );
      row[edge] = a;
      row[edge + 1] = b;
      return { ...cur, [stack]: row };
    });
  }

  function resetLocalShow() {
    setBeat("casa");
    setSigla("idle");
    setRoll(0);
    setCount(null);
    setQuizGate("tema");
    setGoError(null);
    setHelp(false);
    setGameOwnsAv(false);
  }

  function leaveSiglaToWelcome(reason: "avanti" | "sigla_ended") {
    if (beat !== "sigla") return;
    if (sigla !== "on" && sigla !== "hold") return;

    console.info(
      `[avanti-binary] sigla/${sigla}→pres/idle reason=${reason}`,
    );
    setGameOwnsAv(true);
    clearMediaOnScreen();
    setBedPlaying(true);
    setBeat("pres");
    setSigla("idle");
    if (rail === "setup") setRail("plancia");
    setExpand(null);
  }

  function holdSiglaFrame() {
    // Fine video/audio sigla: stesso passo di AVANTI → BENVENUTI + lobby.
    leaveSiglaToWelcome("sigla_ended");
  }

  function fadeOutBed(done: () => void) {
    const el = bedAudio.current;
    if (bedFadeRaf.current != null) {
      cancelAnimationFrame(bedFadeRaf.current);
      bedFadeRaf.current = null;
    }
    if (!el || el.paused) {
      done();
      return;
    }
    const startVol = getMediaVolume(el);
    const t0 = performance.now();
    const dur = AVANTI_CROSSFADE_MS;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      setMediaVolume(el, startVol * (1 - t));
      if (t < 1) {
        bedFadeRaf.current = requestAnimationFrame(tick);
        return;
      }
      bedFadeRaf.current = null;
      el.pause();
      setMediaVolume(el, Math.min(1, Math.max(0, effVol("bed"))));
      done();
    };
    bedFadeRaf.current = requestAnimationFrame(tick);
  }

  async function changeNextQuestion() {
    if (!canChangeNextQuestion || cmdBusy) return;
    if (liveQuizActive && live.controlsDisabled) return;
    setCmdBusy(true);
    setCmdError(null);
    try {
      if (liveQuizActive) {
        const result = await live.runQuizAction("replaceNextQuestion", {
          targetIndex: nextCueIndex,
        });
        if (!result.ok) {
          setCmdError(result.error);
          flashBoardToast(result.error);
          if (result.invalidPin) live.openPinModal();
          return;
        }
        refetchCueQuestions();
        flashBoardToast("Domanda cambiata");
        return;
      }
      const ids =
        cueLineup.length > 0 ? [...cueLineup] : (lineupIds ?? []);
      const replacement = pickLineupReplacement(
        cueQuestions,
        ids,
        nextCueIndex,
      );
      if (!replacement) {
        const msg = "Nessuna altra domanda disponibile da mettere al posto.";
        setCmdError(msg);
        flashBoardToast(msg);
        return;
      }
      const nextIds = applyLineupReplacement(ids, nextCueIndex, replacement);
      setLineupIds(nextIds);
      flashBoardToast(
        replacement.kind === "swap"
          ? `Domanda scambiata con Q${replacement.withIndex + 1}`
          : "Domanda cambiata",
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Cambio domanda non riuscito.";
      setCmdError(msg);
      flashBoardToast(msg);
    } finally {
      setCmdBusy(false);
    }
  }

  async function showRankingNow() {
    if (!liveQuizActive || cmdBusy || live.controlsDisabled) return;
    if (liveQuizPhase === "next_question") return;
    const prevPhase = live.quizState?.displayPhase;
    setCmdBusy(true);
    setCmdError(null);
    try {
      const result = await live.runQuizAction("setPhase", {
        displayPhase: "next_question",
      });
      if (!result.ok) {
        setCmdError(result.error);
        if (result.invalidPin) live.openPinModal();
        return;
      }
      flashBoardToast("Classifica sul proiettore", {
        undo:
          prevPhase && prevPhase !== "next_question"
            ? async () => {
                const undoResult = await live.runQuizAction("setPhase", {
                  displayPhase: prevPhase,
                });
                if (!undoResult.ok) {
                  setCmdError(undoResult.error);
                  if (undoResult.invalidPin) live.openPinModal();
                  return;
                }
                flashBoardToast("Classifica annullata");
              }
            : undefined,
      });
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Classifica non riuscita.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function toggleAlBuio() {
    if (!liveQuizActive || cmdBusy || live.controlsDisabled) return;
    const next = !(live.quizState?.skipResults === true);
    setCmdBusy(true);
    setCmdError(null);
    try {
      const result = await live.runQuizAction("setSkipResults", {
        skipResults: next,
      });
      if (!result.ok) {
        setCmdError(result.error);
        if (result.invalidPin) live.openPinModal();
        return;
      }
      flashBoardToast(
        next ? "Al Buio ON · niente %" : "Al Buio OFF · % di nuovo",
        {
          undo: async () => {
            const undoResult = await live.runQuizAction("setSkipResults", {
              skipResults: !next,
            });
            if (!undoResult.ok) {
              setCmdError(undoResult.error);
              if (undoResult.invalidPin) live.openPinModal();
              return;
            }
            flashBoardToast(
              next ? "Al Buio annullato · % di nuovo" : "Al Buio di nuovo ON",
            );
          },
        },
      );
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Al Buio non riuscito.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function undoBoardToast() {
    const toast = boardToast;
    if (!toast?.undo || toastUndoBusy.current) return;
    toastUndoBusy.current = true;
    clearBoardToast();
    setCmdBusy(true);
    try {
      await toast.undo();
    } catch (err) {
      setCmdError(err instanceof Error ? err.message : "Annulla non riuscito.");
    } finally {
      setCmdBusy(false);
      toastUndoBusy.current = false;
    }
  }

  function openResumeRow() {
    if (!liveQuizActive || live.controlsDisabled) return;
    const cur = (live.quizState?.currentIndex ?? 0) + 1;
    setResumeQ(cur);
    setResumeOpen((v) => !v);
    setCmdError(null);
  }

  async function confirmResumeAt() {
    if (!liveQuizActive || cmdBusy || live.controlsDisabled) return;
    const total = live.quizState?.total ?? 0;
    if (total <= 0) return;
    const q = Math.max(1, Math.min(total, Math.round(resumeQ)));
    setCmdBusy(true);
    setCmdError(null);
    try {
      const result = await live.runQuizAction("resumeAt", {
        targetIndex: q - 1,
      });
      if (!result.ok) {
        setCmdError(result.error);
        if (result.invalidPin) live.openPinModal();
        return;
      }
      setResumeOpen(false);
      flashBoardToast(`Ripreso da Q${q}`);
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Ripresa non riuscita.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function confirmFinishManche() {
    if (!liveQuizActive || cmdBusy || live.controlsDisabled) return;
    setCmdBusy(true);
    setCmdError(null);
    try {
      const result = await live.runQuizAction("finish");
      if (!result.ok) {
        setCmdError(result.error);
        if (result.invalidPin) live.openPinModal();
        return;
      }
      setResumeOpen(false);
      flashBoardToast("Manche chiusa → matching");
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Chiusura manche non riuscita.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function sendDisplayCue(cueId: BoardDisplayCueId) {
    if (cmdBusy || live.controlsDisabled) return;
    const cue = BOARD_DISPLAY_CUES.find((c) => c.id === cueId);
    if (!cue) return;
    setCmdBusy(true);
    setCmdError(null);
    try {
      const response = await postDisplayCommand(
        eventCode,
        cue.command,
        live.pin,
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Invio al proiettore non riuscito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          live.openPinModal();
        }
        setCmdError(message);
        return;
      }
      setActiveDisplayCue(cueId);
      if (cue.videoPath) {
        setVideoState((v) => ({
          ...v,
          onScreenUrl: cue.videoPath,
          onScreenName: cue.label,
        }));
      } else {
        clearMediaOnScreen();
      }
      if (cueId === "tra5") {
        setBedPlaying(true);
      }
      flashBoardToast(cue.title);
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Invio al proiettore non riuscito.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function copyProjectorLink() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const url = displayUrl(eventCode, { origin: origin || undefined });
    try {
      await navigator.clipboard.writeText(url);
      const host =
        typeof window !== "undefined" ? window.location.hostname : "";
      const where =
        host === "localhost" || host === "127.0.0.1" ? "locale" : "remoto";
      flashBoardToast(`Link proiettore copiato · ${where}`);
    } catch {
      setCmdError("Non riesco a copiare il link proiettore.");
    }
  }

  async function activateExternalScreen() {
    setCmdError(null);
    // Toggle nativo iPad: usa stato UI (non solo ref) così OFF funziona sempre.
    if (
      isReactNativeWebView() &&
      (nativeProjectorOpenRef.current || externalScreenOn)
    ) {
      notifyNativeCloseProjector();
      nativeProjectorOpenRef.current = false;
      setExternalScreenOn(false);
      flashBoardToast("Schermo proiettore chiuso");
      return;
    }

    // Se già aperta (popup desktop), chiudi (toggle).
    const existing = projectorWinRef.current;
    if (existing && !existing.closed) {
      try {
        existing.close();
      } catch {
        /* ignore */
      }
      projectorWinRef.current = null;
      setExternalScreenOn(false);
      flashBoardToast("Schermo proiettore chiuso");
      return;
    }

    // Ottimistico: la plancia resta usabile subito (il nativo conferma/annulla).
    if (isReactNativeWebView()) {
      nativeProjectorOpenRef.current = true;
      setExternalScreenOn(true);
    }

    const result = await openProjectorWindowAsync(eventCode, {
      present: true,
    });
    projectorWinRef.current = result.window;
    if (result.mode === "blocked") {
      setExternalScreenOn(false);
      nativeProjectorOpenRef.current = false;
      setCmdError(
        "Popup bloccato. Consenti le finestre o usa «Copia link» su un altro device.",
      );
      return;
    }
    if (result.mode === "native-bridge") {
      nativeProjectorOpenRef.current = true;
      setExternalScreenOn(true);
      flashBoardToast("Proiettore sul secondo schermo (HDMI / AirPlay)");
      // Allinea overlay QR al toggle plancia (niente QR sticky se QR è off).
      void syncQrOverlayAfterSchermo();
      return;
    }
    setExternalScreenOn(true);
    void syncQrOverlayAfterSchermo();
    const tip =
      result.mode === "secondary"
        ? "Proiettore sullo schermo collegato (HDMI)"
        : "Proiettore aperto — in Stage Manager trascinalo sulla HDMI";
    flashBoardToast(tip);
  }

  async function syncQrOverlayAfterSchermo() {
    if (!live.pinReady) return;
    const qrCmd = casaQrDisplayCommand(help, beat);
    if (!qrCmd) return;
    try {
      await postDisplayCommand(eventCode, qrCmd, live.pin);
    } catch {
      /* display non bloccante */
    }
  }

  async function toggleSpecialTrialBook() {
    if (!liveQuizActive || cmdBusy || live.controlsDisabled) return;
    const trial = live.specialTrial;
    // In corso: pannello nel riquadro — niente tab, niente unbook da qui.
    if (
      trial?.status === "running" ||
      trial?.status === "closing" ||
      trial?.status === "results"
    ) {
      return;
    }

    setCmdBusy(true);
    setCmdError(null);
    try {
      const action =
        trial?.status === "booked" || trial?.status === "setup"
          ? "unbook"
          : "book";
      const res = await postSpecialTrialAction(
        eventCode,
        { action },
        live.pin,
      );
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        specialTrial?: typeof trial;
        quiz?: typeof live.quizState;
      } | null;
      if (!res.ok) {
        setCmdError(data?.error ?? "Prova speciale non riuscita.");
        if (res.status === 403) live.openPinModal();
        return;
      }
      live.applySpecialTrialUpdate(
        data?.specialTrial ?? null,
        data?.quiz ?? undefined,
      );
      if (action === "book") {
        flashBoardToast("Prova speciale — controlli nel riquadro");
      }
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Prova speciale non riuscita.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function reportCueQuestion() {
    const q =
      nextCueQuestion ??
      (liveQuestion
        ? {
            id: liveQuestion.id,
            category: liveQuestion.category,
            body: liveQuestion.body,
            options: liveQuestion.options,
          }
        : null);
    if (!q || cmdBusy) return;
    setCmdBusy(true);
    setCmdError(null);
    try {
      const response = await postQuestionReport(
        eventCode,
        {
          questionId: q.id,
          category: q.category,
          body: q.body,
          options: q.options.map((o) =>
            typeof o === "string" ? o : o.label,
          ),
          cueIndex: nextCueQuestion ? nextCueIndex : undefined,
        },
        live.pin,
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Segnalazione non riuscita.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          live.openPinModal();
        }
        setCmdError(message);
        return;
      }
      const data = (await response.json()) as {
        sent?: boolean;
        mailto?: string;
      };
      if (data.sent) {
        setCmdError(null);
        flashBoardToast("Segnalata all’agenzia");
        return;
      }
      if (data.mailto) {
        window.location.href = data.mailto;
      }
    } catch (err) {
      setCmdError(
        err instanceof Error ? err.message : "Segnalazione non riuscita.",
      );
    } finally {
      setCmdBusy(false);
    }
  }

  async function stopToStart() {
    if (cmdBusy) return;
    setCmdBusy(true);
    setCmdError(null);
    try {
      if (live.runtimeState !== "lobby") {
        const response = await postResetEvent(
          eventCode,
          { clearParticipants: false },
          live.pin,
        );
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          const message = payload?.error ?? "Stop non riuscito.";
          if (response.status === 401 || isInvalidAnimatorPinError(message)) {
            live.openPinModal();
          }
          setCmdError(message);
          return;
        }
        live.applyQuizUpdate(null, "lobby");
        void postDisplayCommand(eventCode, { type: "clear" }, live.pin);
      }
      resetLocalShow();
      setConfirmKind(null);
    } catch (err) {
      setCmdError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setCmdBusy(false);
    }
  }

  async function saveAndRestart() {
    if (cmdBusy) return;
    setCmdBusy(true);
    setCmdError(null);
    try {
      let participants: unknown[] = [];
      try {
        const res = await fetchParticipants(eventCode, live.pin);
        if (res.ok) {
          const data = (await res.json()) as { participants?: unknown[] };
          participants = data.participants ?? [];
        }
      } catch {
        /* snapshot best-effort */
      }

      const snapshot = {
        at: new Date().toISOString(),
        eventCode,
        beat,
        sigla,
        roll,
        quizGate,
        runtimeState: live.runtimeState,
        quiz: live.quizState
          ? {
              currentIndex: live.quizState.currentIndex,
              total: live.quizState.total,
              displayPhase: live.quizState.displayPhase,
              questionIds: live.quizState.questionIds,
            }
          : null,
        stats: live.stats,
        participants,
        prep,
      };
      window.localStorage.setItem(
        `${BOARD_RESCUE_KEY}:${eventCode}`,
        JSON.stringify(snapshot),
      );

      const response = await postResetEvent(
        eventCode,
        { clearParticipants: false },
        live.pin,
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = payload?.error ?? "Riavvio non riuscito.";
        if (response.status === 401 || isInvalidAnimatorPinError(message)) {
          live.openPinModal();
        }
        setCmdError(message);
        return;
      }

      resetLocalShow();
      window.location.reload();
    } catch (err) {
      setCmdError(err instanceof Error ? err.message : "Errore di rete.");
      setCmdBusy(false);
    }
  }

  return (
    <div className="casa-board-shell" data-casa-board-shell="">
    <div className="casa-board" data-casa-board="">
      <audio ref={bedAudio} hidden preload="auto" />
      <input
        ref={bedDirInput}
        type="file"
        accept="audio/*"
        multiple
        hidden
        // @ts-expect-error webkitdirectory — fallback cartella se showDirectoryPicker manca
        webkitdirectory=""
        onChange={(e) => {
          const files = e.target.files;
          const name =
            files?.[0]?.webkitRelativePath?.split("/")[0] || "Cartella";
          onBedFiles(files, name);
          e.target.value = "";
        }}
      />
      <input
        ref={bedFilesInput}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => {
          onBedFiles(e.target.files, "File locali");
          e.target.value = "";
        }}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*,image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) applyVideoFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
      <input
        ref={videoDirInput}
        type="file"
        accept="video/*,image/*"
        multiple
        hidden
        // @ts-expect-error webkitdirectory — fallback cartella
        webkitdirectory=""
        onChange={(e) => {
          if (e.target.files?.length) applyVideoFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      <nav className="casa-board-rail" aria-label="Sezioni plancia">
        {RAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="casa-board-rail-btn"
            data-on={rail === tab.id ? "1" : undefined}
            aria-current={rail === tab.id ? "page" : undefined}
            onClick={() => openRail(tab.id)}
          >
            <span className="casa-board-rail-ico">
              <RailTabIcon id={tab.id} />
            </span>
            <span className="casa-board-rail-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="casa-board-body">
      <header className="casa-board-top">
        <div className="casa-board-mod" aria-live="polite">
          In sala <b>{Math.max(guests.length, onlineHint)}</b>
        </div>
        <div className="casa-board-mod casa-board-mod-row casa-board-cues">
          {BOARD_DISPLAY_CUES.map((cue) => (
            <button
              key={cue.id}
              type="button"
              className="casa-board-chip"
              data-on={activeDisplayCue === cue.id ? "1" : undefined}
              disabled={cmdBusy || live.controlsDisabled}
              title={
                cue.id === "qr"
                  ? "QR join sul proiettore"
                  : cue.id === "tra5"
                    ? "Slide «Tra 5 minuti inizia» sul proiettore"
                    : `Manda «${cue.label}» sul proiettore`
              }
              onClick={() => {
                void sendDisplayCue(cue.id);
              }}
            >
              {cue.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="casa-board-mod casa-board-event"
          onClick={() => openRail("setup")}
        >
          {venue}
        </button>
        <button
          type="button"
          className="casa-board-mod casa-board-time"
          onClick={() => openExpand("clock")}
        >
          {clockPrefs.showElapsed ? (
            <span>
              Tempo <b>{elapsedNow}</b>
            </span>
          ) : null}
          {clockPrefs.showElapsed && clockPrefs.showExact ? (
            <span className="casa-board-sep">·</span>
          ) : null}
          {clockPrefs.showExact ? (
            <span>
              Ora <b>{exactNow}</b>
            </span>
          ) : null}
        </button>
      </header>

      <main
        className="casa-board-grid"
        style={
          {
            "--board-col-a": `${layout.cols[0]}fr`,
            "--board-col-b": `${layout.cols[1]}fr`,
            "--board-col-c": `${layout.cols[2]}fr`,
          } as CSSProperties
        }
      >
        <section className="casa-board-col casa-board-left">
          <article
            className="casa-board-card casa-board-card-video"
            style={{ flex: `${layout.left[0]} 1 0` }}
          >
            <BoardCardHead
              title="Video"
              onExpand={() => openExpand("video")}
            >
              <button
                type="button"
                className="casa-board-mini"
                data-on={videoState.onScreenUrl ? "1" : undefined}
                onClick={() => openExpand("video")}
                title="Apri playlist video"
              >
                {videoState.onScreenUrl ? "ON" : "Lista"}
              </button>
            </BoardCardHead>
            <div className="casa-board-miniplayer">
              <p
                className="casa-board-miniplayer-title"
                title={
                  videoState.onScreenName ??
                  videoState.list[videoState.index]?.name ??
                  undefined
                }
              >
                {videoState.onScreenName
                  ? `Maxi · ${videoState.onScreenName}`
                  : videoState.list.length
                    ? `${videoState.list[videoState.index]?.name ?? "—"} · ${videoState.index + 1}/${videoState.list.length}`
                    : "Nessun video"}
              </p>
              <div className="casa-board-miniplayer-transport">
                <MediaIco
                  label="Precedente"
                  disabled={videoState.list.length < 2}
                  onClick={() => {
                    if (!videoState.list.length) return;
                    const i =
                      (videoState.index - 1 + videoState.list.length) %
                      videoState.list.length;
                    const t = videoState.list[i];
                    if (!t) return;
                    if (videoState.onScreenUrl) sendVideoToScreen(t, i);
                    else setVideoState((v) => ({ ...v, index: i }));
                  }}
                >
                  <IcoPrev />
                </MediaIco>
                <MediaIco
                  label={videoState.onScreenUrl ? "In maxi" : "Manda al maxi"}
                  on={Boolean(videoState.onScreenUrl)}
                  disabled={!videoState.list.length || gameOwnsAv || beat === "sigla"}
                  onClick={() => {
                    if (gameOwnsAv || beat === "sigla") return;
                    const t = videoState.list[videoState.index];
                    if (t) sendVideoToScreen(t, videoState.index);
                  }}
                >
                  <IcoPlay />
                </MediaIco>
                <MediaIco
                  label="Successivo"
                  disabled={videoState.list.length < 2}
                  onClick={() => {
                    if (!videoState.list.length) return;
                    const i =
                      (videoState.index + 1) % videoState.list.length;
                    const t = videoState.list[i];
                    if (!t) return;
                    if (videoState.onScreenUrl) sendVideoToScreen(t, i);
                    else setVideoState((v) => ({ ...v, index: i }));
                  }}
                >
                  <IcoNext />
                </MediaIco>
                <MediaIco
                  label="Togli dal maxi"
                  disabled={!videoState.onScreenUrl}
                  onClick={clearMediaOnScreen}
                >
                  <IcoStop />
                </MediaIco>
                <MediaIco
                  label={videoState.muted ? "Audio disattivato" : "Audio attivo"}
                  on={videoState.muted}
                  onClick={() =>
                    setVideoState((v) => ({ ...v, muted: !v.muted }))
                  }
                >
                  {videoState.muted ? <IcoMute /> : <IcoUnmute />}
                </MediaIco>
              </div>
              <div className="casa-board-miniplayer-actions">
                <button
                  type="button"
                  className="casa-board-action"
                  data-on={videoState.repeat === "one" ? "1" : undefined}
                  onClick={() =>
                    setVideoState((v) => ({
                      ...v,
                      repeat: v.repeat === "one" ? "off" : "one",
                    }))
                  }
                >
                  Loop 1
                </button>
                <button
                  type="button"
                  className="casa-board-action"
                  data-on={videoState.repeat === "all" ? "1" : undefined}
                  onClick={() =>
                    setVideoState((v) => ({
                      ...v,
                      repeat: v.repeat === "all" ? "off" : "all",
                    }))
                  }
                >
                  Loop all
                </button>
              </div>
            </div>
          </article>

          <BoardSplit
            axis="y"
            label="Ridimensiona video / giocatori"
            onDrag={(d, size) => resizeStack("left", 0, d, size)}
          />

          <article
            className="casa-board-card"
            style={{ flex: `${layout.left[1]} 1 0` }}
          >
            <BoardCardHead title="Giocatori" onExpand={() => openExpand("players")}>
              <button
                type="button"
                className="casa-board-mini"
                onClick={() => openRail("giocatori")}
              >
                Lista
              </button>
            </BoardCardHead>
            <div className="casa-board-players" data-scroll="y">
              {guests.length === 0
                ? Array.from({ length: PLAYER_SLOTS }, (_, i) => (
                    <button
                      key={`slot-${i}`}
                      type="button"
                      className="casa-board-avatar casa-board-avatar-ph"
                      onClick={() => openExpand("players")}
                      title="In attesa dal QR"
                    >
                      <span>?</span>
                      <em>Libero</em>
                    </button>
                  ))
                : guests.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="casa-board-avatar"
                      data-g={g.gender}
                      data-on={pickedId === g.id ? "1" : undefined}
                      title={`${g.nick} a schermo · tap di nuovo per togliere`}
                      onClick={() => sendPlayerFromCard(g)}
                    >
                      <span
                        style={
                          g.photo
                            ? {
                                backgroundImage: `url(${g.photo})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                color: "transparent",
                              }
                            : undefined
                        }
                      >
                        {g.nick.slice(0, 1).toUpperCase()}
                      </span>
                      <em>{g.nick}</em>
                    </button>
                  ))}
            </div>
            {guests.length === 0 ? (
              <p className="casa-board-empty casa-board-empty-tight">
                In attesa dal QR
                {onlineHint ? ` · ${onlineHint} in sala` : ""}
              </p>
            ) : null}
          </article>

          <BoardSplit
            axis="y"
            label="Ridimensiona giocatori / messaggi"
            onDrag={(d, size) => resizeStack("left", 1, d, size)}
          />

          <article
            className="casa-board-card"
            style={{ flex: `${layout.left[2]} 1 0` }}
          >
            <BoardCardHead title="Messaggi" onExpand={() => openExpand("msg")} />
            <div className="casa-board-msgs" data-scroll="y">
              {msgs.length === 0 ? (
                <p className="casa-board-empty">
                  Nessun messaggio · «10 coppie test» in Lista ne aggiunge
                </p>
              ) : (
                msgs.map((m) => (
                  <div key={m.id} className="casa-board-msg">
                    <div>
                      <strong>{m.who}</strong>
                      <p>{m.text}</p>
                    </div>
                    <button
                      type="button"
                      className="casa-board-trash"
                      aria-label="Elimina messaggio"
                      title="Elimina messaggio"
                      onClick={() => setMsgs((list) => list.filter((row) => row.id !== m.id))}
                    >
                      <TrashIco />
                    </button>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <BoardSplit
          axis="x"
          label="Ridimensiona colonna sinistra"
          onDrag={(d, size) => resizeCols(0, d, size)}
        />

        <section className="casa-board-col casa-board-center">
          <article
            className="casa-board-card casa-board-proj"
            style={{ flex: `${layout.center[0]} 1 0` }}
          >
            <BoardCardHead title="Proiettore" onExpand={() => openExpand("preview")}>
              <span className="casa-board-head-actions">
                <button
                  type="button"
                  className="casa-board-mini"
                  data-on={help ? "1" : undefined}
                  onClick={() => setHelp((v) => !v)}
                >
                  {help ? "QR on" : "QR"}
                </button>
                <button
                  type="button"
                  className="casa-board-mini"
                  data-on={externalScreenOn ? "1" : undefined}
                  title={
                    externalScreenOn
                      ? "Chiudi proiettore sul secondo schermo"
                      : "Apri /display sullo schermo HDMI o monitor collegato"
                  }
                  onClick={() => {
                    void activateExternalScreen();
                  }}
                >
                  {externalScreenOn ? "Schermo off" : "Schermo"}
                </button>
                <button
                  type="button"
                  className="casa-board-mini"
                  title="Copia link proiettore (/display)"
                  onClick={() => {
                    void copyProjectorLink();
                  }}
                >
                  Copia link
                </button>
              </span>
            </BoardCardHead>
            <div className="casa-board-proj-host">
              <CasaProjector
                eventCode={eventCode}
                beat={beat}
                sigla={sigla}
                help={help}
                count={count}
                onStage={onStage}
                slides={slides}
                siglaSrc={SIGLA_SRC}
                siglaVolume={effVol("sigla")}
                quizGate={projectorQuizGate}
                quizPhase={liveQuizActive ? liveQuizPhase : null}
                quizRemaining={liveQuizActive ? liveQuizRemaining : null}
                quizSecondsTotal={
                  live.quizState?.timing.questionSeconds ?? 15
                }
                quizQuestion={projectorQuestion}
                mediaOnScreen={mediaOnScreen}
                onSiglaAvailability={onSiglaAvailability}
                onSiglaEnded={holdSiglaFrame}
                specialTrial={live.specialTrial}
                onSpecialTrialTick={() => {
                  void postSpecialTrialAction(
                    eventCode,
                    { action: "tick" },
                    live.pin,
                  ).then(async (res) => {
                    if (!res.ok) return;
                    const data = (await res.json().catch(() => null)) as {
                      specialTrial?: typeof live.specialTrial;
                      quiz?: typeof live.quizState;
                    } | null;
                    live.applySpecialTrialUpdate(
                      data?.specialTrial ?? null,
                      data?.quiz ?? undefined,
                    );
                  });
                }}
              />
              {help ? (
                <div className="casa-board-qr">
                  <JoinQrCode
                    url={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/s/${eventCode}/play`
                        : `/s/${eventCode}/play`
                    }
                    size={88}
                    showUrl={false}
                  />
                </div>
              ) : null}
            </div>
          </article>

          <BoardSplit
            axis="y"
            label="Ridimensiona proiettore / comandi"
            onDrag={(d, size) => resizeStack("center", 0, d, size)}
          />

          <article
            className="casa-board-card casa-board-card-cmds"
            style={{ flex: `${layout.center[1]} 1 0` }}
            data-prove={specialTrialPanelOpen ? "1" : undefined}
          >
            <header className="casa-board-card-h">
              <span>
                {specialTrialPanelOpen ? "Prova speciale" : "Prossima domanda"}
              </span>
              <span className="casa-board-cue-h-meta">
                {!specialTrialPanelOpen &&
                cueLineup.length > 0 &&
                nextCueIndex >= 0 &&
                nextCueIndex < cueLineup.length ? (
                  <em className="casa-board-cue-num">Q{nextCueIndex + 1}</em>
                ) : null}
                {specialTrialPanelOpen &&
                live.specialTrial &&
                (live.specialTrial.status === "booked" ||
                  live.specialTrial.status === "setup") ? (
                  <button
                    type="button"
                    className="casa-board-mini"
                    disabled={cmdBusy || live.controlsDisabled}
                    title="Annulla prova speciale"
                    onClick={() => {
                      void toggleSpecialTrialBook();
                    }}
                  >
                    Annulla
                  </button>
                ) : null}
                <span
                  className="casa-board-busy-led"
                  data-on={cmdBusy ? "1" : undefined}
                  title={cmdBusy ? "Comando in corso" : undefined}
                  aria-hidden
                />
              </span>
            </header>
            {specialTrialPanelOpen ? (
              <BoardSpecialTrialPanel
                eventCode={eventCode}
                pin={live.pin}
                trial={live.specialTrial}
                disabled={live.controlsDisabled}
                compact
                onInvalidPin={() => live.openPinModal()}
                onUpdate={({ specialTrial, quiz }) => {
                  live.applySpecialTrialUpdate(specialTrial, quiz);
                }}
              />
            ) : (
              <>
            <div className="casa-board-cue-live" aria-live="polite">
              {cueLoading && !nextCueQuestion && cueLineup.length === 0 ? (
                <p className="casa-board-empty">Caricamento…</p>
              ) : nextCueIndex < 0 || nextCueIndex >= cueLineup.length ? (
                <p className="casa-board-empty">Ultima domanda — niente dopo</p>
              ) : nextCueQuestion ? (
                <>
                  <p className="casa-board-cue-cat">{nextCueQuestion.category}</p>
                  <p className="casa-board-cue-body">{nextCueQuestion.body}</p>
                  <p className="casa-board-cue-opts-inline">
                    {nextCueQuestion.options
                      .map(
                        (opt, i) =>
                          `${String.fromCharCode(65 + i)} ${opt.label}`,
                      )
                      .join(" · ")}
                  </p>
                </>
              ) : (
                <p className="casa-board-empty">
                  Domanda {nextCueIndex + 1} (testo non in cache)
                </p>
              )}
            </div>
            <div className="casa-board-cmds-stack">
              <div className="casa-board-cmds">
                <button
                  type="button"
                  className="casa-board-cmd"
                  disabled={
                    !canChangeNextQuestion ||
                    cmdBusy ||
                    (liveQuizActive && live.controlsDisabled)
                  }
                  title="Sostituisce questa domanda con un’altra della stessa categoria"
                  onClick={() => {
                    void changeNextQuestion();
                  }}
                >
                  Cambia domanda
                </button>
                <button
                  type="button"
                  className="casa-board-cmd casa-board-cmd-danger"
                  disabled={cmdBusy}
                  onClick={() => {
                    setCmdError(null);
                    setConfirmKind("stop");
                  }}
                >
                  Stop
                </button>
                <button
                  type="button"
                  className="casa-board-cmd casa-board-cmd-report"
                  disabled={
                    cmdBusy ||
                    (!nextCueQuestion && !liveQuestion)
                  }
                  title="Invia domanda e risposte all’agenzia"
                  onClick={() => {
                    void reportCueQuestion();
                  }}
                >
                  Segnala
                </button>
                <button
                  type="button"
                  className="casa-board-cmd casa-board-cmd-danger"
                  disabled={live.controlsDisabled || cmdBusy}
                  onClick={() => {
                    setCmdError(null);
                    setConfirmKind("rescue");
                  }}
                >
                  Salva e riavvia
                </button>
              </div>
              <div className="casa-board-cmds">
                <button
                  type="button"
                  className="casa-board-cmd casa-board-cmd-rank"
                  disabled={
                    !liveQuizActive ||
                    cmdBusy ||
                    live.controlsDisabled ||
                    liveQuizPhase === "next_question"
                  }
                  title="Mostra classifica intermedia sul proiettore"
                  onClick={() => {
                    void showRankingNow();
                  }}
                >
                  Classifica
                </button>
                <button
                  type="button"
                  className={
                    live.quizState?.skipResults
                      ? "casa-board-cmd casa-board-cmd-warn casa-board-cmd-on"
                      : "casa-board-cmd casa-board-cmd-warn"
                  }
                  disabled={!liveQuizActive || cmdBusy || live.controlsDisabled}
                  aria-pressed={live.quizState?.skipResults === true}
                  title={
                    live.quizState?.skipResults
                      ? "Al Buio ON: niente % fino a fine manche (tap per spegnere)"
                      : "Al Buio: salta le percentuali da ora fino a fine manche"
                  }
                  onClick={() => {
                    void toggleAlBuio();
                  }}
                >
                  Al Buio
                </button>
                <button
                  type="button"
                  className={
                    live.specialTrial?.status === "booked"
                      ? "casa-board-cmd casa-board-cmd-booked"
                      : "casa-board-cmd"
                  }
                  disabled={live.controlsDisabled || live.runtimeState !== "quiz"}
                  title={
                    live.specialTrial?.status === "booked"
                      ? "Prenotata — tap per annullare"
                      : "Prenota prova speciale al prossimo respiro quiz"
                  }
                  onClick={() => {
                    void toggleSpecialTrialBook();
                  }}
                >
                  Prova speciale
                </button>
                <button
                  type="button"
                  className={
                    beat === "presenti"
                      ? "casa-board-cmd casa-board-cmd-warn"
                      : resumeOpen
                        ? "casa-board-cmd casa-board-cmd-warn"
                        : "casa-board-cmd"
                  }
                  disabled={
                    beat === "presenti"
                      ? live.controlsDisabled
                      : !liveQuizActive || cmdBusy || live.controlsDisabled
                  }
                  title={
                    beat === "presenti"
                      ? "Salta la presentazione giocatori → stacco"
                      : "Riprendi da una domanda (solo quiz, senza wipe)"
                  }
                  aria-pressed={beat === "presenti" ? undefined : resumeOpen}
                  onClick={() => {
                    if (beat === "presenti") {
                      skipPresentiRoll();
                      return;
                    }
                    openResumeRow();
                  }}
                >
                  {beat === "presenti" ? "Salta" : "Riprendi"}
                </button>
              </div>
              {resumeOpen ? (
                <div className="casa-board-confirm-quiet">
                  <span>
                    Da Q
                    <input
                      className="casa-board-resume-q"
                      type="number"
                      min={1}
                      max={live.quizState?.total ?? 1}
                      value={resumeQ}
                      disabled={cmdBusy}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n)) setResumeQ(n);
                      }}
                      aria-label="Numero domanda"
                    />
                    /{live.quizState?.total ?? "—"}
                  </span>
                  <button
                    type="button"
                    className="casa-board-confirm-quiet-btn"
                    disabled={cmdBusy}
                    onClick={() => setResumeOpen(false)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="casa-board-confirm-quiet-btn casa-board-confirm-quiet-end"
                    disabled={cmdBusy}
                    title="Chiude la manche come se le domande fossero finite → matching"
                    onClick={() => {
                      void confirmFinishManche();
                    }}
                  >
                    Termina
                  </button>
                  <button
                    type="button"
                    className="casa-board-confirm-quiet-btn casa-board-confirm-quiet-go"
                    disabled={cmdBusy}
                    onClick={() => {
                      void confirmResumeAt();
                    }}
                  >
                    Vai
                  </button>
                </div>
              ) : null}
            </div>
            {cmdError ? (
              <p className="casa-board-audio-err">{cmdError}</p>
            ) : null}
              </>
            )}
          </article>
        </section>

        <BoardSplit
          axis="x"
          label="Ridimensiona colonna destra"
          onDrag={(d, size) => resizeCols(1, d, size)}
        />

        <section className="casa-board-col casa-board-right">
          <article
            className="casa-board-card casa-board-card-audio"
            style={{ flex: `${layout.right[0]} 1 0` }}
          >
            <BoardCardHead title="Audio" onExpand={() => openExpand("audio")}>
              <span className="casa-board-head-actions">
                <button
                  type="button"
                  className="casa-board-mini"
                  data-on={remoteAudio ? "1" : undefined}
                  title="Apri Audio per cambiare uscita"
                  onClick={() => openExpand("audio")}
                >
                  {audioRoute.label.length > 14
                    ? `${audioRoute.label.slice(0, 12)}…`
                    : audioRoute.label}
                </button>
              </span>
            </BoardCardHead>
            <div className="casa-board-miniplayer">
              <label className="casa-board-fader casa-board-fader-master">
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
              <p
                className="casa-board-miniplayer-title"
                title={currentTrackName ?? undefined}
              >
                {gameOwnsAv || beat === "sigla"
                  ? `Gioco · ${casaAutoBedLabel(bedBeat, liveQuizActive ? liveQuizPhase : null, null, bedOpts)}`
                  : hasPlaylist
                    ? `${currentTrackName} · ${bedIndex + 1}/${bedList.length}`
                    : `Colonna · ${casaAutoBedLabel(bedBeat, liveQuizActive ? liveQuizPhase : null, null, bedOpts)}`}
              </p>
              <div className="casa-board-miniplayer-transport">
                <MediaIco
                  label="Precedente"
                  disabled={!hasPlaylist || bedList.length < 2}
                  onClick={() => {
                    setBedIndex((i) =>
                      bedList.length
                        ? (i - 1 + bedList.length) % bedList.length
                        : 0,
                    );
                    setBedPlaying(true);
                  }}
                >
                  <IcoPrev />
                </MediaIco>
                <MediaIco
                  label={bedPlaying ? "Pausa" : "Play"}
                  on={bedPlaying}
                  onClick={() => {
                    void toggleBedPlayback();
                  }}
                >
                  {bedPlaying ? <IcoPause /> : <IcoPlay />}
                </MediaIco>
                <MediaIco
                  label="Successivo"
                  disabled={!hasPlaylist || bedList.length < 2}
                  onClick={() => {
                    setBedIndex((i) =>
                      bedList.length ? (i + 1) % bedList.length : 0,
                    );
                    setBedPlaying(true);
                  }}
                >
                  <IcoNext />
                </MediaIco>
                <MediaIco
                  label="Stop"
                  onClick={() => {
                    setBedPlaying(false);
                    const el = bedAudio.current;
                    if (el) el.currentTime = 0;
                  }}
                >
                  <IcoStop />
                </MediaIco>
              </div>
              <div className="casa-board-seek">
                <span>{formatBedTime(bedSeek.current)}</span>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  value={
                    bedSeek.duration > 0
                      ? Math.round((bedSeek.current / bedSeek.duration) * 1000)
                      : 0
                  }
                  disabled={!hasPlaylist || bedSeek.duration <= 0}
                  aria-label="Scorri brano"
                  onChange={(e) => seekBed(Number(e.target.value) / 1000)}
                />
                <span>{formatBedTime(bedSeek.duration)}</span>
              </div>
              {bedPickError ? (
                <p className="casa-board-audio-err">{bedPickError}</p>
              ) : null}
              <div className="casa-board-miniplayer-actions">
                <button
                  type="button"
                  className="casa-board-action"
                  onClick={() => bedFilesInput.current?.click()}
                >
                  Apri file
                </button>
                <button
                  type="button"
                  className="casa-board-action"
                  onClick={() => void pickBedFolder()}
                >
                  Apri cartella
                </button>
                <button
                  type="button"
                  className="casa-board-action"
                  data-on={bedRepeat === "one" ? "1" : undefined}
                  onClick={() =>
                    setBedRepeat((m) => (m === "one" ? "off" : "one"))
                  }
                >
                  Loop 1
                </button>
                <button
                  type="button"
                  className="casa-board-action"
                  data-on={bedRepeat === "all" ? "1" : undefined}
                  onClick={() =>
                    setBedRepeat((m) => (m === "all" ? "off" : "all"))
                  }
                >
                  Loop all
                </button>
              </div>
            </div>
          </article>

          <BoardSplit
            axis="y"
            label="Ridimensiona audio / pad"
            onDrag={(d, size) => resizeStack("right", 0, d, size)}
          />

          <article
            className="casa-board-card"
            style={{ flex: `${layout.right[1]} 1 0` }}
          >
            <BoardCardHead title="Pad effetti" onExpand={() => openExpand("pad")} />
              <div className="casa-board-pad">
                {padSetHits.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="casa-board-pad-btn"
                    data-on={hits.has(p.id) ? "1" : undefined}
                    onClick={() => firePad(p.id, p.src)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
          </article>

          <BoardSplit
            axis="y"
            label="Ridimensiona pad / avanti"
            onDrag={(d, size) => resizeStack("right", 1, d, size)}
          />

          <article
            className="casa-board-card casa-board-card-go"
            style={{ flex: `${layout.right[2]} 1 0` }}
          >
            <header className="casa-board-card-h">
              <span>Avanti</span>
              <span className="casa-board-head-actions">
                <button
                  type="button"
                  className="casa-board-mini"
                  data-on={boardAutoplay ? "1" : undefined}
                  disabled={live.controlsDisabled}
                  title={
                    boardAutoplay
                      ? "Autoplay acceso — apertura e hold avanzano da sole (5s se manca un tempo)"
                      : "Autoplay spento — serve AVANTI / Partenza"
                  }
                  onClick={() => {
                    if (live.controlsDisabled) return;
                    const nextEnabled = !boardAutoplay;
                    setBoardAutoplay(nextEnabled);
                    if (
                      live.runtimeState !== "quiz" ||
                      !live.quizState
                    ) {
                      return;
                    }
                    const snapshot = live.quizState;
                    live.applyQuizUpdate({
                      ...snapshot,
                      autoplayEnabled: nextEnabled,
                      updatedAt: new Date().toISOString(),
                    });
                    void live
                      .runQuizAction("setAutoplayEnabled", {
                        enabled: nextEnabled,
                      })
                      .then((result) => {
                        if (result.ok) return;
                        setCmdError(result.error);
                        setBoardAutoplay(snapshot.autoplayEnabled === true);
                        live.applyQuizUpdate({
                          ...snapshot,
                          autoplayEnabled: snapshot.autoplayEnabled,
                          updatedAt: new Date().toISOString(),
                        });
                      });
                  }}
                >
                  Autoplay
                </button>
              </span>
            </header>
            <div className="casa-board-go-host">
              <WidgetConductor
                beat={beat}
                localLabel={goLabel}
                onLocalGo={() => void go()}
                localBusy={goBusy}
                localError={goError}
              />
            </div>
          </article>
        </section>
      </main>

      <footer className="casa-board-foot">
        <span className="casa-board-phase">{beat}</span>
        <span className="casa-board-foot-meta">
          {siglaBundledOk === false ? (
            <span className="casa-board-foot-warn" title="Asset installazione">
              Sigla video assente · fallback audio/logo · metti
              web/public/grafiche/video/sigla.mp4
            </span>
          ) : null}
          {gongAtmo.enabled ? "Gong on" : "Gong off"} · ufficiale /board
        </span>
      </footer>
      </div>

      {drawerOpen ? (
        <div className="casa-board-drawer" role="dialog" aria-modal="true">
          <header className="casa-board-drawer-h">
            <strong>{drawerTitle}</strong>
            <button
              type="button"
              className="casa-board-mini"
              onClick={() => setRail("plancia")}
            >
              Chiudi
            </button>
          </header>
          <div className="casa-board-drawer-body">
            {rail === "regia" ? (
              <AdminRegiaPanel
                eventCode={eventCode}
                joinUrl={live.event?.joinUrl}
                animatorPin={live.pin}
                disabled={live.controlsDisabled}
                onInvalidPin={() => live.openPinModal()}
                variant="deck"
                mancheSlot={<WidgetQuizRegia />}
              />
            ) : null}
            {rail === "video" ? (
              <BoardVideoRegiaPanel
                videoState={videoState}
                onOpenFile={() => videoInput.current?.click()}
                onOpenFolder={() => void pickVideoFolder()}
                onToggleRepeat={(mode) =>
                  setVideoState((v) => ({
                    ...v,
                    repeat: v.repeat === mode ? "off" : mode,
                  }))
                }
                onToggleMute={() =>
                  setVideoState((v) => ({ ...v, muted: !v.muted }))
                }
                onClearScreen={clearMediaOnScreen}
                onTrackPointer={onVideoTrackPointer}
                onTrackToScreen={sendVideoToScreen}
              />
            ) : null}
            {/* Sempre montato: altrimenti «10 coppie test» non raggiunge Messaggi. */}
            <div
              className="casa-board-rail-panel"
              hidden={rail !== "giocatori"}
              aria-hidden={rail !== "giocatori"}
            >
              <AdminPlayersManager
                eventCode={eventCode}
                eventTitle={eventTitle}
                pinRequired={pinRequired}
                onDemoChat={applyDemoChatMessages}
              />
            </div>
            {rail === "setup" ? (
              <CasaPrep
                prep={prep}
                onChange={(patch) => setPrep((p) => ({ ...p, ...patch }))}
              />
            ) : null}
            {rail === "prove" ? (
              <BoardSpecialTrialPanel
                eventCode={eventCode}
                pin={live.pin}
                trial={live.specialTrial}
                disabled={live.controlsDisabled}
                onInvalidPin={() => live.openPinModal()}
                onUpdate={({ specialTrial, quiz }) => {
                  live.applySpecialTrialUpdate(specialTrial, quiz);
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {expand ? (
        <div className="casa-board-expand" role="dialog" aria-modal="true">
          <button
            type="button"
            className="casa-board-expand-veil"
            aria-label="Chiudi"
            onClick={closeExpand}
          />
          <div
            className="casa-board-expand-panel"
            data-preview={expand === "preview" ? "1" : undefined}
            data-pad={expand === "pad" ? "1" : undefined}
            data-players={expand === "players" ? "1" : undefined}
          >
            <header className="casa-board-expand-h">
              <strong>{EXPAND_TITLE[expand]}</strong>
              <button
                type="button"
                className="casa-board-mini"
                onClick={closeExpand}
              >
                Chiudi
              </button>
            </header>
            <div className="casa-board-expand-body">
              {expand === "players" ? (
                <div className="casa-board-expand-players" data-scroll="y">
                  {guests.length === 0 ? (
                    <p className="casa-board-empty">
                      I nick arrivano dal QR sul telefono. Usa <b>Lista</b> sulla
                      card o la tab Giocatori per la gestione completa.
                    </p>
                  ) : (
                    <p className="casa-board-empty">
                      Tap = a schermo (on 5s). Ritap = off. Swipe per tutti.
                      Poi scegli un altro dato.
                    </p>
                  )}
                  <div className="casa-board-players casa-board-players-expand">
                    {guests.length === 0
                      ? Array.from({ length: PLAYER_SLOTS }, (_, i) => (
                          <div
                            key={`ex-slot-${i}`}
                            className="casa-board-avatar casa-board-avatar-ph"
                          >
                            <span>?</span>
                            <em>Libero</em>
                          </div>
                        ))
                      : guests.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            className="casa-board-avatar"
                            data-g={g.gender}
                            data-on={pickedId === g.id ? "1" : undefined}
                            title={`${g.nick} · dettagli e schermo`}
                            onClick={() => pickPlayerInExpand(g)}
                          >
                            <span
                              style={
                                g.photo
                                  ? {
                                      backgroundImage: `url(${g.photo})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                      color: "transparent",
                                    }
                                  : undefined
                              }
                            >
                              {g.nick.slice(0, 1).toUpperCase()}
                            </span>
                            <em>{g.nick}</em>
                          </button>
                        ))}
                  </div>
                  {picked ? (
                    <div className="casa-board-player-sheet">
                      <p className="casa-board-player-sheet-kicker">
                        {picked.nick}
                        <span> · tap un dato</span>
                      </p>
                      <div className="casa-board-player-fields">
                        {playerScreenDetails(picked).map((d) => (
                          <button
                            key={d.field}
                            type="button"
                            className="casa-board-player-field"
                            data-on={
                              screenField === d.field &&
                              pickedId === picked.id
                                ? "1"
                                : undefined
                            }
                            disabled={
                              live.controlsDisabled || playerScreenBlocked
                            }
                            onClick={() =>
                              togglePlayerDetail(picked, d.field)
                            }
                          >
                            <span>{d.label}</span>
                            <strong>{d.value}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : guests.length > 0 ? (
                    <p className="casa-board-empty">
                      Nessuno selezionato. Tap una faccia per mandarla a
                      schermo.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="casa-board-chip-btn casa-board-chip-btn-wide"
                    onClick={() => {
                      closeExpand();
                      openRail("giocatori");
                    }}
                  >
                    Apri gestione giocatori
                  </button>
                </div>
              ) : null}

              {expand === "msg" ? (
                <div className="casa-board-msgs" data-scroll="y">
                  {msgs.length === 0 ? (
                    <p className="casa-board-empty">
                      Nessun messaggio. Apri Lista → «10 coppie test» per la
                      demo. La chat live dai telefoni non è ancora attiva.
                    </p>
                  ) : (
                    msgs.map((m) => (
                      <div key={m.id} className="casa-board-msg">
                        <div>
                          <strong>{m.who}</strong>
                          <p>{m.text}</p>
                        </div>
                        <button
                          type="button"
                          className="casa-board-trash"
                          aria-label="Elimina messaggio"
                          onClick={() =>
                            setMsgs((list) => list.filter((row) => row.id !== m.id))
                          }
                        >
                          <TrashIco />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}

              {expand === "clock" ? (
                <div className="casa-board-clock-prefs">
                  <label>
                    <input
                      type="checkbox"
                      checked={clockPrefs.showElapsed}
                      onChange={(e) =>
                        setClockPrefs((c) => ({
                          ...c,
                          showElapsed: e.target.checked,
                        }))
                      }
                    />
                    Mostra tempo
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={clockPrefs.showExact}
                      onChange={(e) =>
                        setClockPrefs((c) => ({
                          ...c,
                          showExact: e.target.checked,
                        }))
                      }
                    />
                    Mostra ora
                  </label>
                  <p className="casa-board-empty">
                    Tempo <b>{elapsedNow}</b> · Ora <b>{exactNow}</b>
                  </p>
                  <button
                    type="button"
                    className="casa-board-chip-btn casa-board-chip-btn-wide"
                    onClick={() =>
                      setClockPrefs((c) => ({ ...c, originMs: Date.now() }))
                    }
                  >
                    Azzera tempo
                  </button>
                </div>
              ) : null}

              {expand === "audio" ? (
                <div className="casa-board-vol-panel">
                  <p className="casa-board-sampler-label">Uscita audio</p>
                  <div className="casa-board-audio-dest">
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
                        className="casa-board-action"
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
                    {canPickCasaLocalAudioOutput() ? (
                      <button
                        type="button"
                        className="casa-board-action"
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
                  </div>
                  <p className="casa-board-audio-meta">
                    {remoteAudio
                      ? `Colonna su ${audioRoute.label} — questa plancia è muta`
                      : `Audio su ${audioRoute.label}`}
                  </p>
                  <div className="casa-board-miniplayer-actions">
                    <button
                      type="button"
                      className="casa-board-action"
                      onClick={() => bedFilesInput.current?.click()}
                    >
                      Apri file
                    </button>
                    <button
                      type="button"
                      className="casa-board-action"
                      onClick={() => void pickBedFolder()}
                    >
                      Apri cartella
                    </button>
                    <button
                      type="button"
                      className="casa-board-action"
                      data-on={bedRepeat === "one" ? "1" : undefined}
                      onClick={() =>
                        setBedRepeat((m) => (m === "one" ? "off" : "one"))
                      }
                    >
                      Loop 1
                    </button>
                    <button
                      type="button"
                      className="casa-board-action"
                      data-on={bedRepeat === "all" ? "1" : undefined}
                      onClick={() =>
                        setBedRepeat((m) => (m === "all" ? "off" : "all"))
                      }
                    >
                      Loop all
                    </button>
                  </div>
                  <div className="casa-board-seek">
                    <span>{formatBedTime(bedSeek.current)}</span>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      value={
                        bedSeek.duration > 0
                          ? Math.round(
                              (bedSeek.current / bedSeek.duration) * 1000,
                            )
                          : 0
                      }
                      disabled={!hasPlaylist || bedSeek.duration <= 0}
                      aria-label="Scorri brano"
                      onChange={(e) => seekBed(Number(e.target.value) / 1000)}
                    />
                    <span>{formatBedTime(bedSeek.duration)}</span>
                  </div>
                  <label className="casa-board-fader">
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
                  {FADERS.map((f) => (
                    <label className="casa-board-fader" key={f.id}>
                      <button
                        type="button"
                        className="casa-board-mute"
                        data-on={mute[f.id] ? "1" : undefined}
                        onClick={() =>
                          setMute((m) => ({ ...m, [f.id]: !m[f.id] }))
                        }
                        title={mute[f.id] ? "Smuta" : "Muta"}
                      >
                        {f.label}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={vols[f.id]}
                        disabled={mute[f.id]}
                        onChange={(e) =>
                          setVols((v) => ({
                            ...v,
                            [f.id]: Number(e.target.value),
                          }))
                        }
                      />
                      <strong>{mute[f.id] ? "—" : vols[f.id]}</strong>
                    </label>
                  ))}
                  <p className="casa-board-audio-meta">
                    {hasPlaylist
                      ? `${bedFolder} · ${bedList.length} tracce`
                      : `Colonna auto · ${casaAutoBedLabel(bedBeat, liveQuizActive ? liveQuizPhase : null, null, bedOpts)}`}
                  </p>
                  {bedPickError ? (
                    <p className="casa-board-audio-err">{bedPickError}</p>
                  ) : null}
                  <div
                    className="casa-board-playlist casa-board-playlist-expand"
                    role="listbox"
                    aria-label="Playlist audio"
                  >
                    {hasPlaylist ? (
                      bedList.map((t, i) => (
                        <button
                          key={t.url}
                          type="button"
                          className="casa-board-track"
                          data-on={i === bedIndex ? "1" : undefined}
                          onClick={() => {
                            setBedIndex(i);
                            setBedPlaying(true);
                          }}
                        >
                          {t.name}
                        </button>
                      ))
                    ) : (
                      <p className="casa-board-playlist-empty">
                        Apri una cartella o dei file audio per la playlist.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {expand === "pad" ? (
                <BoardPadSamplerSuite
                  volume={effVol("fx")}
                  muted={remoteAudio}
                  hitsPlaying={hits}
                  onHitPlayingChange={(id, playing) => {
                    setHits((cur) => {
                      const next = new Set(cur);
                      if (playing) next.add(id);
                      else next.delete(id);
                      return next;
                    });
                  }}
                  setIds={padSetIds}
                  onSetIdsChange={handlePadSetIdsChange}
                  onBankChange={() => setPadBankRev((n) => n + 1)}
                />
              ) : null}

              {expand === "preview" ? (
                <div className="casa-board-proj-host casa-board-proj-expand">
                  <CasaProjector
                    eventCode={eventCode}
                    beat={beat}
                    sigla={sigla}
                    help={help}
                    count={count}
                    onStage={onStage}
                    slides={slides}
                    siglaSrc={SIGLA_SRC}
                    siglaVolume={effVol("sigla")}
                    quizGate={projectorQuizGate}
                    quizPhase={liveQuizActive ? liveQuizPhase : null}
                    quizRemaining={liveQuizActive ? liveQuizRemaining : null}
                    quizSecondsTotal={
                      live.quizState?.timing.questionSeconds ?? 15
                    }
                    quizQuestion={projectorQuestion}
                    mediaOnScreen={mediaOnScreen}
                    enlarge
                    onSiglaEnded={holdSiglaFrame}
                    specialTrial={live.specialTrial}
                  />
                </div>
              ) : null}

              {expand === "video" ? (
                <BoardVideoRegiaPanel
                  videoState={videoState}
                  onOpenFile={() => videoInput.current?.click()}
                  onOpenFolder={() => void pickVideoFolder()}
                  onToggleRepeat={(mode) =>
                    setVideoState((v) => ({
                      ...v,
                      repeat: v.repeat === mode ? "off" : mode,
                    }))
                  }
                  onToggleMute={() =>
                    setVideoState((v) => ({ ...v, muted: !v.muted }))
                  }
                  onClearScreen={clearMediaOnScreen}
                  onTrackPointer={onVideoTrackPointer}
                  onTrackToScreen={sendVideoToScreen}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirmKind === "stop"}
        title="Stop — tornare all’inizio?"
        description="La sessione live torna in lobby. I giocatori restano in lista. La plancia riparte da Casa (QR)."
        confirmLabel="Stop"
        variant="warning"
        busy={cmdBusy}
        onCancel={() => {
          if (!cmdBusy) setConfirmKind(null);
        }}
        onConfirm={() => void stopToStart()}
      />
      <AdminConfirmDialog
        open={confirmKind === "rescue"}
        title="Salva e riavvia?"
        description="Salva giocatori, punteggi e stato in locale, resetta il motore live (lobby, iscritti conservati) e ricarica la plancia. Usa in caso di blocco o desync."
        confirmLabel="Salva e riavvia"
        variant="destructive"
        busy={cmdBusy}
        onCancel={() => {
          if (!cmdBusy) setConfirmKind(null);
        }}
        onConfirm={() => void saveAndRestart()}
      />
      {boardToast ? (
        <div className="casa-board-toast" role="status" aria-live="polite">
          <span className="casa-board-toast-msg">{boardToast.message}</span>
          {boardToast.undo ? (
            <button
              type="button"
              className="casa-board-toast-undo"
              disabled={cmdBusy}
              onClick={() => {
                void undoBoardToast();
              }}
            >
              Annulla
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
    </div>
  );
}
