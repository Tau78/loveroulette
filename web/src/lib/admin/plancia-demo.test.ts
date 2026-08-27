import { describe, expect, it } from "vitest";
import { STINGER_IDS } from "@/lib/audio/stingers";
import {
  PLANCIA_SFX_PADS,
  conductorPrimary,
  createInitialPlanciaState,
  currentQuestion,
  formatCountdown,
  optionLetter,
  planciaReducer,
  roomHealth,
  teamCellTone,
  teamInitials,
  visibleCountdown,
} from "./plancia-demo";

describe("planciaReducer", () => {
  it("seeds deterministic log stamps so the first paint is stable", () => {
    const a = createInitialPlanciaState();
    const b = createInitialPlanciaState();
    expect(a.logs.map((entry) => ({ id: entry.id, at: entry.at }))).toEqual([
      { id: "seed-1", at: "21:00:00" },
      { id: "seed-2", at: "21:00:00" },
    ]);
    expect(a.logs).toEqual(b.logs);
  });

  it("launches, times, closes, reveals and scores the fastest correct pad", () => {
    let state = createInitialPlanciaState();
    expect(state.phase).toBe("waiting");

    state = planciaReducer(state, { type: "launch" });
    expect(state.phase).toBe("on_air");

    state = planciaReducer(state, { type: "start_timer" });
    expect(state.phase).toBe("timer");
    expect(state.remaining).toBe(currentQuestion(state).durationSec);

    const correct = currentQuestion(state).correctIndex;
    const before = state.teams.find((team) => team.id === "t1")!.score;

    state = planciaReducer(state, {
      type: "simulate_answer",
      teamId: "t1",
      option: correct,
      ms: 420,
    });
    state = planciaReducer(state, {
      type: "simulate_answer",
      teamId: "t2",
      option: (correct + 1) % 4,
      ms: 800,
    });

    state = planciaReducer(state, { type: "stop_timer" });
    expect(state.phase).toBe("closed");

    state = planciaReducer(state, { type: "reveal" });
    expect(state.phase).toBe("revealed");
    expect(optionLetter(correct)).toBe("B");

    const after = state.teams.find((team) => team.id === "t1")!;
    const wrong = state.teams.find((team) => team.id === "t2")!;
    expect(after.score).toBeGreaterThan(before);
    expect(wrong.score).toBe(1760);
    expect(teamCellTone(after, state.phase, correct)).toBe("correct");
    expect(teamCellTone(wrong, state.phase, correct)).toBe("wrong");
  });

  it("closes automatically when the timer ticks to zero", () => {
    let state = createInitialPlanciaState();
    state = planciaReducer(state, { type: "start_timer" });
    state = { ...state, remaining: 1 };
    state = planciaReducer(state, { type: "tick" });
    expect(state.phase).toBe("closed");
    expect(state.remaining).toBe(0);
  });

  it("advances preview after next_question and clears pad answers", () => {
    let state = createInitialPlanciaState();
    state = planciaReducer(state, {
      type: "simulate_answer",
      teamId: "t3",
      option: 0,
      ms: 300,
    });
    state = planciaReducer(state, { type: "next_question" });
    expect(state.questionIndex).toBe(14);
    expect(state.phase).toBe("waiting");
    expect(state.teams.every((team) => team.answerIndex == null)).toBe(true);
  });

  it("panic keys are exclusive and mute is independent", () => {
    let state = createInitialPlanciaState();
    state = planciaReducer(state, { type: "set_panic", key: "blackout" });
    expect(state.panic.blackout).toBe(true);
    state = planciaReducer(state, { type: "set_panic", key: "logo" });
    expect(state.panic.logo).toBe(true);
    expect(state.panic.blackout).toBe(false);
    state = planciaReducer(state, { type: "set_mute" });
    expect(state.audio.muted).toBe(true);
    expect(state.panic.logo).toBe(true);
  });

  it("does not relaunch while already on air", () => {
    let state = createInitialPlanciaState();
    state = planciaReducer(state, { type: "launch" });
    const again = planciaReducer(state, { type: "launch" });
    expect(again).toBe(state);
  });

  it("edits the current question without mutating other slots", () => {
    let state = createInitialPlanciaState();
    const originalId = currentQuestion(state).id;
    state = planciaReducer(state, {
      type: "edit_question",
      body: "Quale città è la capitale?",
      correctIndex: 1,
    });
    expect(currentQuestion(state).body).toBe("Quale città è la capitale?");
    expect(currentQuestion(state).id).toBe(originalId);
    state = planciaReducer(state, { type: "next_question" });
    expect(currentQuestion(state).body).not.toBe("Quale città è la capitale?");
  });

  it("formats the conductor countdown and room health", () => {
    expect(formatCountdown(10)).toBe("00:10");
    expect(formatCountdown(75)).toBe("01:15");
    expect(teamInitials("Gli Scienziati")).toBe("GS");
    expect(teamInitials("Tavolo 7")).toBe("T7");

    let state = createInitialPlanciaState();
    expect(visibleCountdown(state)).toBe(state.remaining);
    expect(formatCountdown(visibleCountdown(state))).toBe("00:15");
    expect(roomHealth(state).sala).toEqual({
      online: 16,
      total: 16,
      tone: "ok",
    });
    expect(roomHealth(state).display.on).toBe(true);

    state = planciaReducer(state, { type: "toggle_output", id: "proj1" });
    expect(roomHealth(state).display.tone).toBe("off");

    state = planciaReducer(state, { type: "toggle_mute_team", id: "t1" });
    state = planciaReducer(state, { type: "toggle_mute_team", id: "t2" });
    state = planciaReducer(state, { type: "toggle_mute_team", id: "t3" });
    expect(roomHealth(state).sala.tone).toBe("warn");
    expect(roomHealth(state).sala.online).toBe(13);
  });

  it("points the conductor at one live action at a time", () => {
    let state = createInitialPlanciaState();
    expect(conductorPrimary(state)).toEqual({
      type: "launch",
      label: "Lancia in sala",
    });
    state = planciaReducer(state, { type: "launch" });
    expect(conductorPrimary(state).type).toBe("start_timer");
    state = planciaReducer(state, { type: "start_timer" });
    expect(conductorPrimary(state).type).toBe("stop_timer");
    state = planciaReducer(state, { type: "stop_timer" });
    expect(conductorPrimary(state).type).toBe("reveal");
    state = planciaReducer(state, { type: "reveal" });
    expect(conductorPrimary(state).type).toBe("show_leaderboard");
    state = planciaReducer(state, { type: "show_leaderboard" });
    expect(conductorPrimary(state).type).toBe("next_question");
  });

  it("maps the soundboard to real stinger ids", () => {
    const ids = PLANCIA_SFX_PADS.map((pad) => pad.trackId);
    expect(ids).toEqual([
      STINGER_IDS.quizQuestionGong,
      STINGER_IDS.extractionDrumroll,
      STINGER_IDS.extractionReveal,
      STINGER_IDS.winnerStinger,
    ]);
  });
});
