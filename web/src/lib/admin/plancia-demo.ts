export const PLANCIA_BACKUP_KEY = "lr_plancia_demo_backup";

export type QuizFlowPhase =
  | "waiting"
  | "on_air"
  | "timer"
  | "closed"
  | "revealed"
  | "stats"
  | "leaderboard";

export type GameMode = "timed" | "pyramid" | "open" | "auction";
export type TransitionMode = "take" | "cut" | "fade";
export type OutputId = "proj1" | "stage" | "stream";
export type OutputSource = "program" | "preview" | "sponsor" | "standings";
export type TeamFilter = "all" | "missing" | "wrong" | "answered_b";
export type LeaderboardMode = "absolute" | "climb" | "tables" | "podium";
export type OpenVerdict = "pending" | "accepted" | "rejected";

export const PHASE_LABELS: Record<QuizFlowPhase, string> = {
  waiting: "In Attesa",
  on_air: "In Onda",
  timer: "In Onda",
  closed: "Chiusa",
  revealed: "Chiusa",
  stats: "Chiusa",
  leaderboard: "Chiusa",
};

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  timed: "A Tempo",
  pyramid: "La Piramide",
  open: "Risposta Aperta",
  auction: "Asta / Scommessa",
};

export interface DemoQuestion {
  id: string;
  body: string;
  options: [string, string, string, string];
  correctIndex: number;
  mediaLabel: string;
  mediaKind: "image" | "video" | "none";
  durationSec: number;
  stageNote: string;
}

export interface DemoTeam {
  id: string;
  name: string;
  padId: number;
  score: number;
  table: string;
  muted: boolean;
  answerIndex: number | null;
  answerMs: number | null;
  openAnswer: string | null;
  openVerdict: OpenVerdict;
}

export interface DemoLogEntry {
  id: string;
  at: string;
  message: string;
  tone: "info" | "warn" | "ok";
}

export interface DemoOutputs {
  proj1: boolean;
  stage: boolean;
  stream: boolean;
}

export interface DemoRouting {
  proj1: OutputSource;
  stage: OutputSource;
  pub: OutputSource;
}

export interface DemoAudio {
  quiz: number;
  sfx: number;
  media: number;
  master: number;
  ducking: boolean;
  muted: boolean;
}

export interface DemoPanic {
  blackout: boolean;
  freeze: boolean;
  logo: boolean;
}

export interface PlanciaDemoState {
  rundown: string;
  questionIndex: number;
  totalQuestions: number;
  phase: QuizFlowPhase;
  remaining: number;
  pointsBase: number;
  speedBonus: boolean;
  doublePoints: boolean;
  gameMode: GameMode;
  transition: TransitionMode;
  tBar: number;
  outputs: DemoOutputs;
  routing: DemoRouting;
  audio: DemoAudio;
  panic: DemoPanic;
  teams: DemoTeam[];
  filter: TeamFilter;
  selectedTeamId: string | null;
  leaderboardMode: LeaderboardMode;
  lastJingle: string | null;
  logs: DemoLogEntry[];
  restoredAt: string | null;
  latencyMs: number[];
  questionEdits: Record<string, { body: string; correctIndex: number }>;
}

export const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: "q14",
    body: "Quale città italiana è soprannominata la Dolce Vita?",
    options: ["Milano", "Roma", "Firenze", "Napoli"],
    correctIndex: 1,
    mediaLabel: "skyline-roma.jpg",
    mediaKind: "image",
    durationSec: 15,
    stageNote: "Risposta esatta: B · Battuta: Roma, non è solo una città",
  },
  {
    id: "q15",
    body: "In che anno è uscito il primo album dei Queen?",
    options: ["1971", "1973", "1975", "1977"],
    correctIndex: 1,
    mediaLabel: "queen-bohemian.mp4",
    mediaKind: "video",
    durationSec: 12,
    stageNote: "Risposta esatta: B · Consiglio: fischia Bohemian Rhapsody",
  },
  {
    id: "q16",
    body: "Quale di questi cocktail NON contiene gin?",
    options: ["Negroni", "Martini", "Old Fashioned", "Gin Tonic"],
    correctIndex: 2,
    mediaLabel: "nessuno",
    mediaKind: "none",
    durationSec: 15,
    stageNote: "Risposta esatta: C · Old Fashioned è bourbon, zucchero, bitter",
  },
];

const TEAM_SEED: Array<Pick<DemoTeam, "id" | "name" | "padId" | "score" | "table">> =
  [
    { id: "t1", name: "Gli Scienziati", padId: 12, score: 1840, table: "A3" },
    { id: "t2", name: "Cuori Spezzati", padId: 4, score: 1760, table: "B1" },
    { id: "t3", name: "Quizaholics", padId: 18, score: 1690, table: "A1" },
    { id: "t4", name: "Tavolo 7", padId: 7, score: 1610, table: "C2" },
    { id: "t5", name: "Le Volpi", padId: 21, score: 1540, table: "B4" },
    { id: "t6", name: "Amore & Bytes", padId: 9, score: 1490, table: "A2" },
    { id: "t7", name: "I Soliti Ignoti", padId: 31, score: 1420, table: "C1" },
    { id: "t8", name: "Pink Noise", padId: 2, score: 1380, table: "D2" },
    { id: "t9", name: "Bar Sport", padId: 27, score: 1310, table: "D1" },
    { id: "t10", name: "Le Muse", padId: 15, score: 1280, table: "B2" },
    { id: "t11", name: "Fuori Tempo", padId: 33, score: 1190, table: "C3" },
    { id: "t12", name: "Caffè Corto", padId: 6, score: 1120, table: "A4" },
    { id: "t13", name: "Last Minute", padId: 40, score: 980, table: "D3" },
    { id: "t14", name: "I Romantici", padId: 11, score: 910, table: "B3" },
    { id: "t15", name: "Nonna Wiki", padId: 24, score: 840, table: "C4" },
    { id: "t16", name: "Flash Mob", padId: 38, score: 720, table: "D4" },
  ];

export type HealthTone = "ok" | "warn" | "off";

export interface RoomHealth {
  sala: { online: number; total: number; tone: HealthTone };
  display: { on: boolean; tone: HealthTone };
  sync: { ms: number; tone: HealthTone };
}

export type SfxTone = "danger" | "warn" | "ok" | "primary";

export interface PlanciaSfxPad {
  id: string;
  label: string;
  trackId: string;
  tone: SfxTone;
}

/** Pad colorati agganciati agli stinger del manifest — niente laugh/boing finti. */
export const PLANCIA_SFX_PADS: PlanciaSfxPad[] = [
  { id: "gong", label: "Gong", trackId: "LR_Quiz_Question_Gong", tone: "warn" },
  { id: "drum", label: "Tamburi", trackId: "LR_06_Extraction_Drumroll", tone: "primary" },
  { id: "reveal", label: "Reveal", trackId: "LR_07_Extraction_Reveal", tone: "ok" },
  { id: "win", label: "Vittoria", trackId: "LR_16_Winner_Stinger", tone: "danger" },
];

function clockNow(): string {
  return new Date().toLocaleTimeString("it-IT", { hour12: false });
}

function log(
  message: string,
  tone: DemoLogEntry["tone"] = "info",
  stable?: { id: string; at: string },
): DemoLogEntry {
  return {
    id: stable?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: stable?.at ?? clockNow(),
    message,
    tone,
  };
}

function freshTeams(): DemoTeam[] {
  return TEAM_SEED.map((team) => ({
    ...team,
    muted: false,
    answerIndex: null,
    answerMs: null,
    openAnswer: null,
    openVerdict: "pending",
  }));
}

function questionAt(state: PlanciaDemoState, index: number): DemoQuestion {
  const base = DEMO_QUESTIONS[index % DEMO_QUESTIONS.length]!;
  const edit = state.questionEdits[base.id];
  if (!edit) return base;
  return { ...base, body: edit.body, correctIndex: edit.correctIndex };
}

export function currentQuestion(state: PlanciaDemoState): DemoQuestion {
  return questionAt(state, state.questionIndex);
}

export function nextQuestionPreview(state: PlanciaDemoState): DemoQuestion {
  return questionAt(state, state.questionIndex + 1);
}

export function createInitialPlanciaState(): PlanciaDemoState {
  return {
    rundown: "Serata Pub Quiz — Fase 2 (A Tempo)",
    questionIndex: 13,
    totalQuestions: 25,
    phase: "waiting",
    remaining: DEMO_QUESTIONS[0]!.durationSec,
    pointsBase: 100,
    speedBonus: true,
    doublePoints: false,
    gameMode: "timed",
    transition: "take",
    tBar: 0,
    outputs: { proj1: true, stage: true, stream: true },
    routing: { proj1: "program", stage: "program", pub: "sponsor" },
    audio: {
      quiz: 72,
      sfx: 88,
      media: 54,
      master: 80,
      ducking: true,
      muted: false,
    },
    panic: { blackout: false, freeze: false, logo: false },
    teams: freshTeams(),
    filter: "all",
    selectedTeamId: "t1",
    leaderboardMode: "absolute",
    lastJingle: null,
    logs: [
      log("Sala 16/16 · display online", "ok", {
        id: "seed-1",
        at: "21:00:00",
      }),
      log("Backup locale attivo — crash recovery armato", "ok", {
        id: "seed-2",
        at: "21:00:00",
      }),
    ],
    restoredAt: null,
    latencyMs: [18, 21, 19, 24, 22, 20, 17, 23, 19, 21, 18, 26],
    questionEdits: {},
  };
}

export type PlanciaAction =
  | { type: "toggle_output"; id: OutputId }
  | { type: "set_routing"; id: keyof DemoRouting; source: OutputSource }
  | { type: "set_panic"; key: keyof DemoPanic }
  | { type: "set_mute" }
  | { type: "set_fader"; channel: keyof Omit<DemoAudio, "ducking" | "muted">; value: number }
  | { type: "toggle_ducking" }
  | { type: "set_transition"; mode: TransitionMode }
  | { type: "set_tbar"; value: number }
  | { type: "take" }
  | { type: "launch" }
  | { type: "start_timer" }
  | { type: "stop_timer" }
  | { type: "tick" }
  | { type: "reveal" }
  | { type: "show_stats" }
  | { type: "show_leaderboard" }
  | { type: "next_question" }
  | { type: "set_points"; value: number }
  | { type: "toggle_speed_bonus" }
  | { type: "toggle_double" }
  | { type: "set_game_mode"; mode: GameMode }
  | { type: "set_filter"; filter: TeamFilter }
  | { type: "select_team"; id: string }
  | { type: "adjust_score"; id: string; delta: number }
  | { type: "reassign_pad"; id: string; padId: number }
  | { type: "toggle_mute_team"; id: string }
  | { type: "set_leaderboard_mode"; mode: LeaderboardMode }
  | { type: "fire_jingle"; name: string }
  | { type: "simulate_answer"; teamId: string; option: number; ms: number }
  | { type: "set_open_answer"; teamId: string; text: string }
  | { type: "judge_open"; teamId: string; verdict: Exclude<OpenVerdict, "pending"> }
  | { type: "edit_question"; body: string; correctIndex: number }
  | { type: "push_log"; message: string; tone?: DemoLogEntry["tone"] }
  | { type: "restore"; snapshot: PlanciaDemoState }
  | { type: "reset" }
  | { type: "sample_latency" };

function appendLog(
  state: PlanciaDemoState,
  message: string,
  tone: DemoLogEntry["tone"] = "info",
): DemoLogEntry[] {
  return [log(message, tone), ...state.logs].slice(0, 24);
}

function resetAnswers(teams: DemoTeam[]): DemoTeam[] {
  return teams.map((team) => ({
    ...team,
    answerIndex: null,
    answerMs: null,
    openAnswer: null,
    openVerdict: "pending",
  }));
}

function applyScores(state: PlanciaDemoState): DemoTeam[] {
  const question = currentQuestion(state);
  const multiplier = state.doublePoints ? 2 : 1;
  return state.teams.map((team) => {
    if (team.muted || team.answerIndex == null) return team;
    const correct = team.answerIndex === question.correctIndex;
    if (!correct) return team;
    let pts = state.pointsBase * multiplier;
    if (state.speedBonus && team.answerMs != null) {
      pts += Math.max(0, 40 - Math.round(team.answerMs / 80));
    }
    return { ...team, score: team.score + pts };
  });
}

export function planciaReducer(
  state: PlanciaDemoState,
  action: PlanciaAction,
): PlanciaDemoState {
  switch (action.type) {
    case "toggle_output":
      return {
        ...state,
        outputs: {
          ...state.outputs,
          [action.id]: !state.outputs[action.id],
        },
        logs: appendLog(
          state,
          `${action.id.toUpperCase()} ${state.outputs[action.id] ? "OFF" : "ONLINE"}`,
          state.outputs[action.id] ? "warn" : "ok",
        ),
      };
    case "set_routing":
      return {
        ...state,
        routing: { ...state.routing, [action.id]: action.source },
        logs: appendLog(
          state,
          `Routing ${action.id} → ${action.source}`,
        ),
      };
    case "set_panic": {
      const next = !state.panic[action.key];
      const panic = {
        ...state.panic,
        [action.key]: next,
        ...(action.key !== "freeze" && next ? { freeze: false } : {}),
        ...(action.key !== "logo" && next ? { logo: false } : {}),
        ...(action.key !== "blackout" && next ? { blackout: false } : {}),
      };
      return {
        ...state,
        panic,
        logs: appendLog(
          state,
          `${action.key.toUpperCase()} ${next ? "ON" : "off"}`,
          next ? "warn" : "ok",
        ),
      };
    }
    case "set_mute":
      return {
        ...state,
        audio: { ...state.audio, muted: !state.audio.muted },
        logs: appendLog(
          state,
          state.audio.muted ? "Audio ripristinato" : "AUDIO MUTE",
          state.audio.muted ? "ok" : "warn",
        ),
      };
    case "set_fader":
      return {
        ...state,
        audio: { ...state.audio, [action.channel]: action.value },
      };
    case "toggle_ducking":
      return {
        ...state,
        audio: { ...state.audio, ducking: !state.audio.ducking },
      };
    case "set_transition":
      return { ...state, transition: action.mode };
    case "set_tbar":
      return { ...state, tBar: action.value };
    case "take":
      return {
        ...state,
        tBar: 0,
        logs: appendLog(state, `${state.transition.toUpperCase()} — preview → program`),
      };
    case "launch":
      if (state.phase !== "waiting") return state;
      return {
        ...state,
        phase: "on_air",
        panic: { blackout: false, freeze: false, logo: false },
        logs: appendLog(state, `Domanda ${state.questionIndex + 1} in onda`, "ok"),
      };
    case "start_timer":
      if (state.phase !== "on_air" && state.phase !== "waiting") return state;
      return {
        ...state,
        phase: "timer",
        remaining: currentQuestion(state).durationSec,
        panic: { blackout: false, freeze: false, logo: false },
        logs: appendLog(state, "Timer avviato · pulsantiere abilitate", "ok"),
      };
    case "stop_timer":
      if (state.phase !== "timer") return state;
      return {
        ...state,
        phase: "closed",
        remaining: 0,
        logs: appendLog(state, "Stop — invii chiusi", "warn"),
      };
    case "tick": {
      if (state.phase !== "timer") return state;
      const next = state.remaining - 1;
      if (next <= 0) {
        return {
          ...state,
          remaining: 0,
          phase: "closed",
          logs: appendLog(state, "Tempo scaduto — invii chiusi", "warn"),
        };
      }
      return { ...state, remaining: next };
    }
    case "reveal":
      if (
        state.phase !== "closed" &&
        state.phase !== "on_air" &&
        state.phase !== "timer"
      ) {
        return state;
      }
      return {
        ...state,
        phase: "revealed",
        remaining: 0,
        teams: applyScores({ ...state, phase: "revealed" }),
        logs: appendLog(
          state,
          `Risposta ${optionLetter(currentQuestion(state).correctIndex)} rivelata`,
          "ok",
        ),
      };
    case "show_stats":
      if (state.phase !== "revealed" && state.phase !== "leaderboard") {
        return state;
      }
      return {
        ...state,
        phase: "stats",
        logs: appendLog(state, "Statistiche in onda"),
      };
    case "show_leaderboard":
      return {
        ...state,
        phase: "leaderboard",
        logs: appendLog(state, `Classifica ${state.leaderboardMode} in onda`),
      };
    case "next_question": {
      const nextIndex = state.questionIndex + 1;
      if (nextIndex >= state.totalQuestions) return state;
      return {
        ...state,
        questionIndex: nextIndex,
        phase: "waiting",
        remaining:
          DEMO_QUESTIONS[nextIndex % DEMO_QUESTIONS.length]!.durationSec,
        teams: resetAnswers(state.teams),
        logs: appendLog(state, `Caricata domanda ${nextIndex + 1} in anteprima`),
      };
    }
    case "set_points":
      return { ...state, pointsBase: Math.max(10, Math.min(500, action.value)) };
    case "toggle_speed_bonus":
      return { ...state, speedBonus: !state.speedBonus };
    case "toggle_double":
      return { ...state, doublePoints: !state.doublePoints };
    case "set_game_mode":
      return {
        ...state,
        gameMode: action.mode,
        logs: appendLog(state, `Modulo: ${GAME_MODE_LABELS[action.mode]}`),
      };
    case "set_filter":
      return { ...state, filter: action.filter };
    case "select_team":
      return { ...state, selectedTeamId: action.id };
    case "adjust_score":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.id
            ? { ...team, score: Math.max(0, team.score + action.delta) }
            : team,
        ),
        logs: appendLog(
          state,
          `${teamName(state, action.id)} ${action.delta > 0 ? "+" : ""}${action.delta} pt`,
        ),
      };
    case "reassign_pad":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.id ? { ...team, padId: action.padId } : team,
        ),
        logs: appendLog(
          state,
          `${teamName(state, action.id)} → pulsantiera ${action.padId}`,
          "warn",
        ),
      };
    case "toggle_mute_team":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.id ? { ...team, muted: !team.muted } : team,
        ),
        logs: appendLog(
          state,
          `${teamName(state, action.id)} ${
            state.teams.find((team) => team.id === action.id)?.muted
              ? "riabilitata"
              : "squalificata / mute"
          }`,
          "warn",
        ),
      };
    case "set_leaderboard_mode":
      return { ...state, leaderboardMode: action.mode };
    case "fire_jingle": {
      const pad = PLANCIA_SFX_PADS.find((item) => item.id === action.name);
      return {
        ...state,
        lastJingle: action.name,
        logs: appendLog(state, `Stinger: ${pad?.label ?? action.name}`),
      };
    }
    case "simulate_answer":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.teamId && team.answerIndex == null && !team.muted
            ? {
                ...team,
                answerIndex: action.option,
                answerMs: action.ms,
              }
            : team,
        ),
        logs: appendLog(
          state,
          `${teamName(state, action.teamId)} risposto in ${(action.ms / 1000).toFixed(2)}s`,
        ),
      };
    case "set_open_answer":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.teamId
            ? { ...team, openAnswer: action.text, openVerdict: "pending" }
            : team,
        ),
      };
    case "judge_open":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.teamId
            ? { ...team, openVerdict: action.verdict }
            : team,
        ),
        logs: appendLog(
          state,
          `${teamName(state, action.teamId)} ${
            action.verdict === "accepted" ? "accettata" : "rifiutata"
          }`,
        ),
      };
    case "edit_question": {
      const id = currentQuestion(state).id;
      return {
        ...state,
        questionEdits: {
          ...state.questionEdits,
          [id]: { body: action.body, correctIndex: action.correctIndex },
        },
        logs: appendLog(state, "Domanda corretta in-game", "warn"),
      };
    }
    case "push_log":
      return {
        ...state,
        logs: appendLog(state, action.message, action.tone ?? "info"),
      };
    case "restore":
      return { ...action.snapshot, restoredAt: clockNow() };
    case "reset":
      return createInitialPlanciaState();
    case "sample_latency": {
      const next = 16 + Math.round(Math.random() * 14);
      return {
        ...state,
        latencyMs: [...state.latencyMs.slice(-15), next],
      };
    }
    default:
      return state;
  }
}

function teamName(state: PlanciaDemoState, id: string): string {
  return state.teams.find((team) => team.id === id)?.name ?? id;
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export const CONDUCTOR_PHASE: Record<QuizFlowPhase, string> = {
  waiting: "Pronta",
  on_air: "In sala",
  timer: "Tempo",
  closed: "Chiusa",
  revealed: "Risposta",
  stats: "Dati",
  leaderboard: "Classifica",
};

export type ConductorPrimary = {
  type:
    | "launch"
    | "start_timer"
    | "stop_timer"
    | "reveal"
    | "show_leaderboard"
    | "next_question";
  label: string;
};

/** Il tasto che l’animatore deve premere adesso. */
export function conductorPrimary(state: PlanciaDemoState): ConductorPrimary {
  switch (state.phase) {
    case "waiting":
      return { type: "launch", label: "Lancia in sala" };
    case "on_air":
      return { type: "start_timer", label: "Parte il tempo" };
    case "timer":
      return { type: "stop_timer", label: "Chiudi" };
    case "closed":
      return { type: "reveal", label: "Rivela" };
    case "revealed":
    case "stats":
      return { type: "show_leaderboard", label: "Classifica" };
    case "leaderboard":
      return { type: "next_question", label: "Prossima" };
  }
}

export function formatCountdown(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function visibleCountdown(state: PlanciaDemoState): number {
  if (
    state.phase === "waiting" ||
    state.phase === "on_air" ||
    state.phase === "timer"
  ) {
    return state.remaining;
  }
  return 0;
}

export function teamInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]![0] ?? "";
    const second = parts[1]![0] ?? "";
    return `${first}${second}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function roomHealth(state: PlanciaDemoState): RoomHealth {
  const total = state.teams.length;
  const online = state.teams.filter((team) => !team.muted).length;
  const lastMs = state.latencyMs[state.latencyMs.length - 1] ?? 0;
  const salaTone: HealthTone =
    total === 0 || online === 0
      ? "off"
      : online / total < 0.85
        ? "warn"
        : "ok";
  return {
    sala: { online, total, tone: salaTone },
    display: {
      on: state.outputs.proj1,
      tone: state.outputs.proj1 ? "ok" : "off",
    },
    sync: {
      ms: lastMs,
      tone: lastMs > 40 ? "warn" : "ok",
    },
  };
}

export function answerStats(state: PlanciaDemoState): number[] {
  const counts = [0, 0, 0, 0];
  for (const team of state.teams) {
    if (team.answerIndex != null) counts[team.answerIndex] += 1;
  }
  return counts;
}

export function answeredCount(state: PlanciaDemoState): number {
  return state.teams.filter((team) => team.answerIndex != null || team.openAnswer).length;
}

export function rankedTeams(state: PlanciaDemoState): DemoTeam[] {
  return [...state.teams].sort((a, b) => b.score - a.score);
}

export function filteredTeams(state: PlanciaDemoState): DemoTeam[] {
  const question = currentQuestion(state);
  return state.teams.filter((team) => {
    if (state.filter === "missing") return team.answerIndex == null && !team.openAnswer;
    if (state.filter === "wrong") {
      if (state.phase !== "revealed" && state.phase !== "stats" && state.phase !== "leaderboard") {
        return false;
      }
      return team.answerIndex != null && team.answerIndex !== question.correctIndex;
    }
    if (state.filter === "answered_b") return team.answerIndex === 1;
    return true;
  });
}

export function teamCellTone(
  team: DemoTeam,
  phase: QuizFlowPhase,
  correctIndex: number,
): "idle" | "answered" | "correct" | "wrong" | "muted" {
  if (team.muted) return "muted";
  const graded =
    phase === "revealed" || phase === "stats" || phase === "leaderboard";
  if (graded && team.answerIndex != null) {
    return team.answerIndex === correctIndex ? "correct" : "wrong";
  }
  if (team.answerIndex != null || team.openAnswer) return "answered";
  return "idle";
}

export function persistPlanciaState(state: PlanciaDemoState): void {
  if (typeof window === "undefined") return;
  try {
    const snapshot = { ...state, restoredAt: null };
    sessionStorage.setItem(PLANCIA_BACKUP_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota
  }
}

export function readPlanciaBackup(): PlanciaDemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PLANCIA_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanciaDemoState;
    if (!parsed || !Array.isArray(parsed.teams) || !parsed.phase) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function pickPendingAnswer(
  state: PlanciaDemoState,
): { teamId: string; option: number; ms: number } | null {
  const pending = state.teams.filter(
    (team) => !team.muted && team.answerIndex == null && !team.openAnswer,
  );
  if (pending.length === 0) return null;
  const team = pending[Math.floor(Math.random() * Math.min(3, pending.length))]!;
  const elapsed = (currentQuestion(state).durationSec - state.remaining) * 1000;
  return {
    teamId: team.id,
    option: Math.floor(Math.random() * 4),
    ms: Math.max(180, elapsed + 220 + Math.round(Math.random() * 900)),
  };
}
