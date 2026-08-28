"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CasaProjector } from "@/components/admin/casa/CasaProjector";
import type { CasaSpotlight } from "@/components/admin/casa/CasaPlayerSpotlight";
import { CasaPrep } from "@/components/admin/casa/CasaPrep";
import { CasaQuestions } from "@/components/admin/casa/CasaQuestions";
import { CasaLayoutBar } from "@/components/admin/casa/widgets/CasaLayoutBar";
import { CasaWidgetDeck } from "@/components/admin/casa/widgets/CasaWidgetDeck";
import { CasaWidgetGallery } from "@/components/admin/casa/widgets/CasaWidgetGallery";
import { pushApart } from "@/components/admin/casa/widgets/layout-math";
import { widgetMeta } from "@/components/admin/casa/widgets/widget-registry";
import { JoinQrCode } from "@/components/display/JoinQrCode";
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
import { avantiLabel, stepAvanti } from "@/lib/admin/casa-avanti";
import { casaAutoBedLabel, resolveCasaBed } from "@/lib/admin/casa-beds";
import {
  createDefaultState,
  createId,
  getActiveProfile,
  loadLayouts,
  saveLayouts,
  sizeToPx,
  UNIQUE_WIDGET_TYPES,
  updateActiveWidgets,
  type CasaLayoutsState,
  type CasaWidgetInstance,
  type CasaWidgetSize,
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
  | "prep"
  | "msg"
  | "screen"
  | "gear"
  | "clock"
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

function msgLimitForSize(size: CasaWidgetSize): number {
  return size === "L" || size === "XL" ? 8 : 3;
}

function cycleRepeat(mode: CasaRepeatMode): CasaRepeatMode {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
}

function repeatLabel(mode: CasaRepeatMode): string {
  if (mode === "one") return "Repeat 1";
  if (mode === "all") return "Repeat";
  return "Off";
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
  const [layouts, setLayouts] = useState<CasaLayoutsState>(createDefaultState);
  const [galleryOpen, setGalleryOpen] = useState(false);
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
  const videoTapRef = useRef<{ url: string; at: number } | null>(null);

  const index = BEATS.findIndex((b) => b.id === beat);
  const current = BEATS[index] ?? BEATS[0];
  const next = BEATS[index + 1];
  const onStage = guests[roll];
  const asked = Math.max(0, manche - left);
  const currentQ = pack[asked] ?? pack[pack.length - 1] ?? DEFAULT_CASA_QUESTIONS[0];
  const activeProfile = getActiveProfile(layouts);
  const activeWidgets = activeProfile.widgets;
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

  useEffect(() => {
    if (open === "questions") return;
    setPack(loadQuestions(eventCode));
  }, [open, eventCode]);

  const flash = msgQueue[0] ?? null;

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => {
      setMsgQueue((q) => q.slice(1));
    }, 10_000);
    return () => window.clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    if (!spotlight) return;
    const id = window.setTimeout(() => setSpotlight(null), 8_000);
    return () => window.clearTimeout(id);
  }, [spotlight]);

  useEffect(() => {
    if (sigla !== "warn") return;
    const id = window.setTimeout(() => setSigla("on"), 2000);
    return () => window.clearTimeout(id);
  }, [sigla]);

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
    if (bedPlaying) {
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [activeBed, bedFolder, bedRepeat, bedPlaying]);

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
    void el.play().catch(() => {});
  }, [showPct, gongAtmo.enabled, gongAtmo.track]);

  useEffect(() => {
    if (showPct && gongAtmo.enabled && gongAtmo.track) return;
    const el = bedAudio.current;
    if (!el || !activeBed || !bedPlaying) return;
    void el.play().catch(() => {});
  }, [showPct, gongAtmo.enabled, gongAtmo.track, activeBed, bedPlaying]);

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

  function go() {
    stopGongAtmo();
    setShowPct(false);
    if (beat === "quiz") {
      if (quizGate === "tema") {
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

  function MsgRows({ limit = 3 }: { limit?: number }) {
    const rows = visibleMsgs.slice(-limit);
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
              onClick={() => setMsgs((list) => list.filter((row) => row.id !== m.id))}
            >
              ⌫
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
    const { w: ww, h: hh } = sizeToPx(meta.defaultSize);
    const others = activeWidgets.map((w) => {
      const px = sizeToPx(w.size);
      return { x: w.x, y: w.y, w: px.w, h: px.h };
    });
    const pos = pushApart({ x: 40, y: 40, w: ww, h: hh }, others, 1200, 700);
    const widget: CasaWidgetInstance = {
      id: createId(type),
      type,
      x: pos.x,
      y: pos.y,
      size: meta.defaultSize,
    };
    commitLayouts(updateActiveWidgets(layouts, [...activeWidgets, widget]));
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
    quizGate,
    quizQuestion: currentQ,
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
          <div className={liveOff}>
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
          <div className={liveOff}>
            <MsgRows limit={msgLimitForSize(w.size)} />
          </div>
        );
      case "projector":
        return (
          <div className={liveOff}>
            {open === "preview" ? (
              <div className="casa-screen casa-screen-ghost" />
            ) : (
              <CasaProjector {...projectorProps} />
            )}
          </div>
        );
      case "audio":
        return (
          <div className={liveOff}>
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
            <button type="button" className="casa-go" onClick={go}>
              {goLabel}
            </button>
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
            placeholder="Note per la serata…"
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
              <button
                type="button"
                className="casa-hit"
                onClick={() => setBedPlaying((v) => !v)}
              >
                {bedPlaying ? "Pausa" : "Play"}
              </button>
              <button
                type="button"
                className="casa-hit"
                disabled={!bedFolder || bedList.length < 2}
                onClick={() =>
                  setBedIndex((i) =>
                    bedList.length ? (i - 1 + bedList.length) % bedList.length : 0,
                  )
                }
              >
                ‹
              </button>
              <button
                type="button"
                className="casa-hit"
                disabled={!bedFolder || bedList.length < 2}
                onClick={() =>
                  setBedIndex((i) => (bedList.length ? (i + 1) % bedList.length : 0))
                }
              >
                ›
              </button>
              <button
                type="button"
                className="casa-hit"
                data-on={bedRepeat !== "off" ? "1" : undefined}
                onClick={() => setBedRepeat((m) => cycleRepeat(m))}
              >
                {repeatLabel(bedRepeat)}
              </button>
            </div>
            <div className="casa-bed-line">
              <button
                type="button"
                className="casa-hit"
                onClick={() => bedFilesInput.current?.click()}
              >
                Apri file
              </button>
              <button type="button" className="casa-hit" onClick={() => void pickBedFolder()}>
                Apri cartella
              </button>
              <button type="button" className="casa-hit" onClick={clearBedFolder}>
                Clear
              </button>
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
              <button
                type="button"
                className="casa-hit"
                data-on={videoState.muted ? "1" : undefined}
                onClick={() =>
                  setVideoState((v) => ({ ...v, muted: !v.muted }))
                }
              >
                {videoState.muted ? "Muted" : "Audio"}
              </button>
              <button
                type="button"
                className="casa-hit"
                data-on={videoState.repeat !== "off" ? "1" : undefined}
                onClick={() =>
                  setVideoState((v) => ({
                    ...v,
                    repeat: cycleRepeat(v.repeat),
                  }))
                }
              >
                {repeatLabel(videoState.repeat)}
              </button>
              <button
                type="button"
                className="casa-hit"
                onClick={() => videoInput.current?.click()}
              >
                Apri
              </button>
              <button
                type="button"
                className="casa-hit"
                onClick={() => void pickVideoFolder()}
              >
                Apri cartella
              </button>
            </div>
            <div className="casa-bed-line">
              <button type="button" className="casa-hit" onClick={clearVideoList}>
                Clear lista
              </button>
              <button
                type="button"
                className="casa-hit"
                disabled={!videoState.onScreenUrl}
                onClick={clearMediaOnScreen}
              >
                Togli dal maxi
              </button>
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
      default:
        return null;
    }
  }

  return (
    <div className="casa" data-layout-edit={layoutEdit ? "1" : undefined}>
      <header className="casa-top">
        <button
          type="button"
          className="casa-title"
          onClick={() => setOpen("prep")}
        >
          {prep.venueName || eventCode}
        </button>
        <CasaLayoutBar
          edit={layoutEdit}
          onEditChange={setLayoutEdit}
          layouts={layouts}
          onLayoutsChange={commitLayouts}
          onOpenGallery={() => setGalleryOpen(true)}
        />
        <div className="casa-status">
          <div className="casa-status-side">
            <span>
              In sala <b>{guests.length}</b>
            </span>
          </div>
          <button
            type="button"
            className="casa-status-time"
            onClick={() => setOpen("clock")}
          >
            {clockPrefs.showElapsed ? (
              <span>
                Tempo <b>{elapsedNow}</b>
              </span>
            ) : null}
            {clockPrefs.showExact ? (
              <span>
                Ora esatta <b>{exactNow}</b>
              </span>
            ) : null}
            {!clockPrefs.showElapsed && !clockPrefs.showExact ? (
              <span>Tempo</span>
            ) : null}
          </button>
        </div>
      </header>

      <div className="casa-deck-wrap">
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
        <CasaWidgetDeck
          edit={layoutEdit}
          widgets={activeWidgets}
          onChange={(widgets) =>
            commitLayouts(updateActiveWidgets(layouts, widgets))
          }
          onAddRequest={() => setGalleryOpen(true)}
          onWidgetTitleClick={openPanelForWidget}
          renderWidget={renderWidget}
        />
      </div>

      <CasaWidgetGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        present={activeWidgets.map((w) => w.type)}
        onAdd={addWidget}
      />

      {open ? (
        <>
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
                            : open === "msg"
                            ? "Messaggi"
                            : open === "screen"
                              ? "Schermi"
                              : open === "clock"
                                ? "Tempo"
                                : "Audio"}
              </p>
              <button type="button" className="casa-close" onClick={() => setOpen(null)}>
                Chiudi
              </button>
            </div>

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
              <CasaProjector {...projectorProps} enlarge />
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
            {open === "prep" ? <CasaPrep prep={prep} onChange={patchPrep} /> : null}

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
              <>
                <input
                  className="casa-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca nick"
                  autoFocus
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
              </>
            ) : null}

            {open === "audio" ? (
              <>
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
                <MsgRows limit={8} />
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
        </>
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
                <p className="casa-sub">Eliminare {picked.nick} dalla serata?</p>
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
