"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CasaProjector } from "@/components/admin/casa/CasaProjector";
import { CasaPrep } from "@/components/admin/casa/CasaPrep";
import { CasaQuestions } from "@/components/admin/casa/CasaQuestions";
import { DEFAULT_CASA_PREP, loadPrep, savePrep, type CasaPrep as Prep } from "@/lib/admin/casa-prep";
import {
  CASA_PAD_HITS,
  playCasaPadHit,
  prefetchCasaPadHits,
  type CasaPadHitId,
} from "@/lib/admin/casa-pad-sfx";
import { avantiLabel, stepAvanti } from "@/lib/admin/casa-avanti";
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
  | null;

const HEART_LOGO = "/grafiche/logo-transparent.png";

function CasaFace({ photo, nick }: { photo?: string; nick?: string }) {
  return (
    <span className="casa-face">
      <img src={photo || HEART_LOGO} alt={nick ?? ""} className={photo ? undefined : "casa-face-logo"} />
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

const FADERS = [
  { id: "sigla", label: "Sigla" },
  { id: "bed", label: "Sottofondo" },
  { id: "fx", label: "Effetti sonori" },
] as const;

type BedTrack = { name: string; url: string };

function isAudioFile(file: File) {
  return file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|aac)$/i.test(file.name);
}

function PadHits({
  hit,
  muted,
  volume,
  onHit,
}: {
  hit: string | null;
  muted: boolean;
  volume: number;
  onHit: (id: CasaPadHitId) => void;
}) {
  return (
    <div className="casa-pad">
      {CASA_PAD_HITS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="casa-pad-btn"
          data-on={hit === p.id ? "1" : undefined}
          onClick={() => {
            if (muted) return;
            playCasaPadHit(p.id, volume);
            onHit(p.id);
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
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
  const [open, setOpen] = useState<Panel>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [killAsk, setKillAsk] = useState(false);
  const [vols, setVols] = useState({ sigla: 70, bed: 45, fx: 55 });
  const [hit, setHit] = useState<string | null>(null);
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
  const [clock, setClock] = useState("20:00:00");
  const [mute, setMute] = useState<Record<(typeof FADERS)[number]["id"], boolean>>({
    sigla: false,
    bed: false,
    fx: false,
  });
  const [bedFolder, setBedFolder] = useState<string | null>(null);
  const [bedList, setBedList] = useState<BedTrack[]>([]);
  const [bedIndex, setBedIndex] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [siglaSrc, setSiglaSrc] = useState(SIGLA_SRC);
  const siglaFile = useRef<HTMLInputElement>(null);
  const shotFile = useRef<HTMLInputElement>(null);
  const libFile = useRef<HTMLInputElement>(null);
  const bedAudio = useRef<HTMLAudioElement | null>(null);
  const bedInput = useRef<HTMLInputElement>(null);

  const index = BEATS.findIndex((b) => b.id === beat);
  const current = BEATS[index] ?? BEATS[0];
  const next = BEATS[index + 1];
  const onStage = guests[roll];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? guests.filter((g) => g.nick.toLowerCase().includes(q)) : guests;
  }, [guests, query]);

  useEffect(() => {
    prefetchCasaPadHits();
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        [now.getHours(), now.getMinutes(), now.getSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":"),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setSlides(loadSlides(eventCode));
    setPrep(loadPrep(eventCode));
  }, [eventCode]);

  const flash = msgQueue[0] ?? null;

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => {
      setMsgQueue((q) => q.slice(1));
    }, 10_000);
    return () => window.clearTimeout(id);
  }, [flash]);

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
      return;
    }
    const id = window.setTimeout(() => setCount((n) => (n == null ? n : n - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [beat, count]);

  useEffect(() => {
    const el = bedAudio.current;
    if (!el) return;
    el.volume = mute.bed ? 0 : vols.bed / 100;
  }, [mute.bed, vols.bed]);

  useEffect(() => {
    const el = bedAudio.current;
    const track = bedList[bedIndex];
    if (!el || !track) {
      el?.pause();
      return;
    }
    if (el.src !== track.url) {
      el.src = track.url;
    }
    el.loop = bedList.length === 1;
    void el.play().catch(() => {});
  }, [bedList, bedIndex]);

  function applyBedFiles(name: string, files: File[]) {
    bedList.forEach((t) => URL.revokeObjectURL(t.url));
    const next = files
      .filter(isAudioFile)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setBedFolder(next.length ? name : null);
    setBedList(next);
    setBedIndex(0);
  }

  async function pickBedFolder() {
    const picker = (
      window as Window & {
        showDirectoryPicker?: () => Promise<{
          name: string;
          values: () => AsyncIterableIterator<{
            kind: string;
            getFile: () => Promise<File>;
          }>;
        }>;
      }
    ).showDirectoryPicker;
    if (picker) {
      try {
        const dir = await picker();
        const files: File[] = [];
        for await (const entry of dir.values()) {
          if (entry.kind === "file") files.push(await entry.getFile());
        }
        applyBedFiles(dir.name, files);
        return;
      } catch {
        return;
      }
    }
    bedInput.current?.click();
  }

  function clearBedFolder() {
    bedList.forEach((t) => URL.revokeObjectURL(t.url));
    bedAudio.current?.pause();
    setBedFolder(null);
    setBedList([]);
    setBedIndex(0);
  }

  function go() {
    if (beat === "quiz") {
      setLeft((n) => Math.max(0, n - 1));
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
    if (step.beat === "quiz") setCount(null);
    if (step.beat !== "casa" && open === "prep") setOpen(null);
  }

  const goLabel = avantiLabel({
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
  }

  function patchPrep(patch: Partial<Prep>) {
    setPrep((prev) => {
      const next = { ...prev, ...patch };
      savePrep(eventCode, next);
      return next;
    });
  }

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

  function firePad(id: CasaPadHitId) {
    setHit(id);
    window.setTimeout(() => setHit((cur) => (cur === id ? null : cur)), 220);
  }

  const phaseLive = (
    <div className="casa-phase">
      <p className="casa-phase-kicker">Ora · {current.label}</p>
      {beat === "casa" ? (
        <button
          type="button"
          className="casa-hit"
          data-on={help ? "1" : undefined}
          onClick={() => setHelp((v) => !v)}
        >
          Aiuto entra
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

  const quizDone = manche > 0 ? Math.min(1, Math.max(0, (manche - left) / manche)) : 0;
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

  return (
    <div className="casa">
      <header className="casa-top">
        <p className="casa-title">{prep.venueName || eventCode}</p>
        <div className="casa-status">
          <div className="casa-status-side">
            <span>
              Fase <em className="casa-pill">{current.label}</em>
            </span>
            <span>
              In sala <b>{guests.length}</b>
            </span>
          </div>
          <div
            className="casa-prog"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={manche}
            aria-valuenow={manche - left}
            aria-label="Avanzamento domande"
          >
            <i style={{ width: `${quizDone * 100}%` }} />
          </div>
          <span className="casa-status-time">
            Tempo <b>{clock}</b>
          </span>
        </div>
      </header>

      <div className="casa-cols">
        <div className="casa-col casa-col-left">
          <div className="casa-card casa-setup">
            <div className="casa-setup-main">
              <CasaHead onOpen={() => setOpen("setup")}>Impostazioni</CasaHead>
            </div>
            {phaseLive}
          </div>
          <div className="casa-card casa-people">
            <CasaHead onOpen={() => setOpen("nick")}>Giocatori</CasaHead>
            <div className="casa-roster">
              {guests.length === 0 ? (
                <p className="casa-sub">Nessuno in sala. Entra dal QR.</p>
              ) : null}
              {guests.map((g) => {
                return (
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
                    <CasaFace photo={g.photo} nick={g.nick} />
                    <span className="casa-slot-nick">{g.nick}</span>
                    <span className="casa-slot-meta">
                      {g.score !== 0 ? (
                        <em data-neg={g.score < 0 ? "1" : undefined}>
                          {g.score > 0 ? `+${g.score}` : g.score}
                        </em>
                      ) : null}
                      <span className="casa-slot-mf">{g.gender}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="casa-card casa-msg">
            <div className="casa-msg-head">
              <CasaHead onOpen={() => setOpen("msg")}>Messaggi</CasaHead>
            </div>
            <MsgRows />
          </div>
        </div>

        <div className="casa-col casa-center">
          <div className="casa-card casa-preview">
            <CasaHead onOpen={() => setOpen("preview")}>Proiettore</CasaHead>
            {open === "preview" ? (
              <div className="casa-screen casa-screen-ghost" />
            ) : (
              <CasaProjector
                eventCode={eventCode}
                beat={beat}
                sigla={sigla}
                help={help}
                count={count}
                onStage={onStage}
                showPct={showPct}
                slides={slides}
                siglaSrc={siglaSrc}
                siglaVolume={mute.sigla ? 0 : vols.sigla / 100}
                onSiglaEnded={holdSiglaFrame}
                flash={flash}
              />
            )}
          </div>
        </div>

        <div className="casa-col casa-col-right">
          <div className="casa-card">
            <CasaHead onOpen={() => setOpen("audio")}>Audio</CasaHead>
            {FADERS.map((f) => (
              <div className="casa-mix" key={f.id}>
                <span>{f.label}</span>
                <i className="casa-mix-bar">
                  <b style={{ width: `${mute[f.id] ? 0 : vols[f.id]}%` }} />
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
          <div className="casa-card casa-pad-card">
            <CasaHead onOpen={() => setOpen("pad")}>Pad</CasaHead>
            <PadHits
              hit={hit}
              muted={mute.fx}
              volume={vols.fx / 100}
              onHit={firePad}
            />
          </div>
          <button type="button" className="casa-go" onClick={go}>
            {goLabel}
          </button>
        </div>
      </div>

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
              <CasaProjector
                eventCode={eventCode}
                beat={beat}
                sigla={sigla}
                help={help}
                count={count}
                onStage={onStage}
                showPct={showPct}
                slides={slides}
                siglaSrc={siglaSrc}
                siglaVolume={mute.sigla ? 0 : vols.sigla / 100}
                onSiglaEnded={holdSiglaFrame}
                flash={flash}
                enlarge
              />
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
                      {LINE[beat]}
                      {mustAnswer ? " Chi non risponde prende −1." : ""}
                    </p>
                    {phaseLive}
                  </div>
                </div>
              </>
            ) : null}

            {open === "questions" ? <CasaQuestions eventCode={eventCode} /> : null}
            {open === "prep" ? <CasaPrep prep={prep} onChange={patchPrep} /> : null}

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
                      <CasaFace photo={g.photo} nick={g.nick} />
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
                      : "Colonna del gioco, segue la fase"}
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
                hit={hit}
                muted={mute.fx}
                volume={vols.fx / 100}
                onHit={firePad}
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
                  src={picked.photo || HEART_LOGO}
                  alt=""
                  className={picked.photo ? undefined : "casa-face-logo"}
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
                onClick={() => {
                  setMsgQueue((q) => [
                    ...q,
                    {
                      id: `guest-${picked.id}-${Date.now()}`,
                      ini: picked.nick.slice(0, 1).toUpperCase(),
                      who: picked.gender,
                      text: picked.nick,
                      photo: picked.photo,
                    },
                  ]);
                }}
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
        onEnded={() => {
          if (bedList.length < 2) return;
          setBedIndex((i) => (i + 1) % bedList.length);
        }}
      />
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
    </div>
  );
}
