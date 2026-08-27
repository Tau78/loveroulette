"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  conductorPrimary,
  createInitialPlanciaState,
  persistPlanciaState,
  pickPendingAnswer,
  planciaReducer,
  readPlanciaBackup,
  type PlanciaAction,
} from "@/lib/admin/plancia-demo";
import { PlanciaConductor } from "@/components/admin/plancia/PlanciaConductor";
import { PlanciaHeader } from "@/components/admin/plancia/PlanciaHeader";
import { PlanciaMediaColumn } from "@/components/admin/plancia/PlanciaMediaColumn";
import { PlanciaTeamsColumn } from "@/components/admin/plancia/PlanciaTeamsColumn";
import { DeckKey } from "@/components/admin/plancia/plancia-ui";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function PlanciaDemo() {
  const [state, dispatch] = useReducer(
    planciaReducer,
    undefined,
    createInitialPlanciaState,
  );
  const stateRef = useRef(state);
  const restoredRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const run = useCallback((action: PlanciaAction) => {
    dispatch(action);
  }, []);

  useEffect(() => {
    if (!restoredRef.current) {
      restoredRef.current = true;
      const backup = readPlanciaBackup();
      if (backup && backup.phase !== "waiting") {
        dispatch({ type: "restore", snapshot: backup });
        return;
      }
    }
    persistPlanciaState(state);
  }, [state]);

  useEffect(() => {
    if (state.phase !== "timer") return;
    const id = window.setInterval(() => {
      dispatch({ type: "tick" });
      const pending = pickPendingAnswer(stateRef.current);
      if (pending && Math.random() > 0.35) {
        dispatch({ type: "simulate_answer", ...pending });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.phase]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("admin-console-root");
    body.classList.add("overflow-hidden");
    return () => {
      html.classList.remove("admin-console-root");
      body.classList.remove("overflow-hidden");
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const current = stateRef.current;

      if (event.key === "F11") {
        event.preventDefault();
        dispatch({ type: "set_panic", key: "blackout" });
        return;
      }
      if (event.key === "F12") {
        event.preventDefault();
        dispatch({ type: "set_mute" });
        return;
      }
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        if (current.phase === "timer") dispatch({ type: "stop_timer" });
        else dispatch({ type: "start_timer" });
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        dispatch({ type: conductorPrimary(current).type });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="plancia-console theme-dark-fuchsia flex h-screen w-screen flex-col overflow-hidden">
      <PlanciaHeader
        state={state}
        onBlackout={() => run({ type: "set_panic", key: "blackout" })}
        onMute={() => run({ type: "set_mute" })}
      />

      {state.restoredAt ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#f5c84b] bg-[#2a2208] px-3 py-2 text-sm font-semibold text-[#f5c84b]">
          <span>Ripresa dal backup delle {state.restoredAt}</span>
          <div className="w-28">
            <DeckKey slot="Z" onClick={() => run({ type: "reset" })} className="h-9">
              Reset
            </DeckKey>
          </div>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden bg-[#0d0d12] p-2.5 lg:grid-cols-[minmax(22rem,1.1fr)_minmax(20rem,0.9fr)]">
        <PlanciaConductor
          state={state}
          onAction={(type) => run({ type })}
        />
        <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
          <PlanciaMediaColumn
            state={state}
            onSkipCue={() => run({ type: "next_question" })}
          />
          <PlanciaTeamsColumn
            state={state}
            onSelect={(id) => run({ type: "select_team", id })}
            onAdjust={(id, delta) => run({ type: "adjust_score", id, delta })}
          />
        </div>
      </div>
    </div>
  );
}
