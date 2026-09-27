"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchParticipants, postSpecialTrialAction } from "@/lib/admin/animator-api";
import { SPECIAL_TRIAL_CHALLENGES } from "@/lib/game/special-trial-challenges";
import type { SpecialTrialChallengeId } from "@/lib/game/special-trial-challenges";
import type { SpecialTrialState } from "@/lib/musicpro/special-trial";
import { cn } from "@/lib/utils";

type Guest = {
  id: string;
  nick: string;
};

interface BoardSpecialTrialPanelProps {
  eventCode: string;
  pin: string | null;
  trial: SpecialTrialState | null;
  disabled?: boolean;
  onUpdate: (payload: {
    specialTrial: SpecialTrialState | null;
    quiz?: import("@/lib/musicpro/quiz-state").QuizSessionState | null;
  }) => void;
  onInvalidPin?: () => void;
}

export function BoardSpecialTrialPanel({
  eventCode,
  pin,
  trial,
  disabled = false,
  onUpdate,
  onInvalidPin,
}: BoardSpecialTrialPanelProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMin, setDurationMin] = useState(
    () => Math.max(1, Math.round((trial?.durationSec ?? 60) / 60)),
  );

  useEffect(() => {
    if (trial?.durationSec) {
      setDurationMin(Math.max(1, Math.round(trial.durationSec / 60)));
    }
  }, [trial?.durationSec]);

  const loadGuests = useCallback(async () => {
    const res = await fetchParticipants(eventCode, pin);
    if (!res.ok) return;
    const data = (await res.json()) as {
      participants?: Array<{ id: string; nickname: string }>;
    };
    setGuests(
      (data.participants ?? []).map((r) => ({
        id: r.id,
        nick: r.nickname,
      })),
    );
  }, [eventCode, pin]);

  useEffect(() => {
    if (trial?.status === "setup" && trial.mode === "scegli") {
      void loadGuests();
    }
  }, [trial?.status, trial?.mode, loadGuests]);

  async function act(
    body: Parameters<typeof postSpecialTrialAction>[1],
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await postSpecialTrialAction(eventCode, body, pin);
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      specialTrial?: SpecialTrialState | null;
      quiz?: import("@/lib/musicpro/quiz-state").QuizSessionState | null;
    } | null;

    setBusy(false);

    if (!res.ok) {
      const msg = data?.error ?? "Errore prova speciale";
      if (res.status === 403) onInvalidPin?.();
      setError(msg);
      return false;
    }

    onUpdate({
      specialTrial: data?.specialTrial ?? null,
      quiz: data?.quiz,
    });
    return true;
  }

  if (!trial || trial.status === "booked") {
    return (
      <div className="casa-board-prove">
        <p className="casa-board-prove-hint">
          {trial?.status === "booked"
            ? "Prenotata — parte al prossimo respiro del quiz (dopo % e classifica)."
            : "Attiva «Prova speciale» dalla plancia per prenotare."}
        </p>
      </div>
    );
  }

  return (
    <div className="casa-board-prove">
      <label className="casa-board-prove-row">
        <span>DURATA</span>
        <input
          type="number"
          min={1}
          max={10}
          value={durationMin}
          disabled={disabled || busy || trial.status !== "setup"}
          onChange={(e) => setDurationMin(Number(e.target.value) || 1)}
          onBlur={() => {
            void act({
              action: "setDuration",
              durationSec: durationMin * 60,
            });
          }}
        />
        <span>min</span>
      </label>

      {!trial.challengeId ? (
        <div className="casa-board-prove-types">
          <p className="casa-board-prove-label">Tipo prova</p>
          <div className="casa-board-prove-grid">
            {SPECIAL_TRIAL_CHALLENGES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="casa-board-prove-type"
                disabled={disabled || busy}
                onClick={() => {
                  void act({
                    action: "pickChallenge",
                    challengeId: c.id as SpecialTrialChallengeId,
                  });
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      ) : !trial.mode ? (
        <div className="casa-board-prove-modes">
          <p className="casa-board-prove-label">
            {SPECIAL_TRIAL_CHALLENGES.find((c) => c.id === trial.challengeId)
              ?.label ?? "Prova"}
          </p>
          <div className="casa-board-prove-grid">
            <button
              type="button"
              className="casa-board-prove-type"
              disabled={disabled || busy}
              onClick={() => void act({ action: "pickMode", mode: "scegli" })}
            >
              SCEGLI
            </button>
            <button
              type="button"
              className="casa-board-prove-type casa-board-prove-type-muted"
              disabled
              title="CHIEDI — in arrivo"
            >
              CHIEDI
            </button>
          </div>
        </div>
      ) : trial.status === "setup" && trial.mode === "scegli" ? (
        <>
          <p className="casa-board-prove-label">Seleziona giocatori</p>
          <div className="casa-board-prove-players">
            {guests.map((g) => {
              const on = selected.has(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  className={cn("casa-board-prove-player", on && "is-on")}
                  disabled={disabled || busy}
                  onClick={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(g.id)) next.delete(g.id);
                      else next.add(g.id);
                      return next;
                    });
                  }}
                >
                  {g.nick}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="casa-board-prove-via"
            disabled={disabled || busy || selected.size === 0}
            onClick={async () => {
              const participants = guests
                .filter((g) => selected.has(g.id))
                .map((g) => ({ id: g.id, nickname: g.nick }));
              const ok = await act({
                action: "setParticipants",
                participants,
              });
              if (ok) await act({ action: "start" });
            }}
          >
            VIA
          </button>
        </>
      ) : null}

      {trial.status === "running" || trial.status === "closing" ? (
        <div className="casa-board-prove-live">
          <p className="casa-board-prove-label">
            {trial.status === "closing" ? "Tempo scaduto" : "Prova in corso"}
          </p>
          <p className="casa-board-prove-names">
            {trial.participants.map((p) => p.nickname).join(" · ")}
          </p>
          {trial.status === "closing" ? (
            <button
              type="button"
              className="casa-board-prove-via"
              disabled={disabled || busy}
              onClick={() => void act({ action: "close" })}
            >
              Chiudi e riprendi quiz
            </button>
          ) : (
            <button
              type="button"
              className="casa-board-mini"
              disabled={disabled || busy}
              onClick={() => void act({ action: "tick" })}
            >
              Aggiorna timer
            </button>
          )}
        </div>
      ) : null}

      {error ? <p className="casa-board-audio-err">{error}</p> : null}
    </div>
  );
}
