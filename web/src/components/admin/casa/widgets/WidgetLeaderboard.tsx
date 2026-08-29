"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import {
  fetchParticipants,
  isInvalidAnimatorPinError,
} from "@/lib/admin/animator-api";
import type { AdminParticipantRow } from "@/lib/musicpro/participant-admin";
import { participantAppearsOnline } from "@/lib/musicpro/presence";
import type { VotingFinalist } from "@/lib/musicpro/voting";

export type WidgetLeaderboardProps = {
  /** Max rows to show (default 12). */
  limit?: number;
  className?: string;
};

type BoardRow = {
  id: string;
  label: string;
  score: number | null;
  meta?: string;
  online?: boolean;
};

function sortFinalists(
  finalists: VotingFinalist[],
  scores: Record<string, number>,
): BoardRow[] {
  return [...finalists]
    .map((f) => ({
      id: f.pairId,
      label: `${f.maleNick} & ${f.femaleNick}`,
      score: scores[f.pairId] ?? 0,
      meta: `#${f.rank}`,
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Live classifica — finals/voting scores when available, else real participants.
 * Never uses CasaPad SEED guests.
 */
export function WidgetLeaderboard({
  limit = 12,
  className,
}: WidgetLeaderboardProps) {
  const {
    eventCode,
    pin,
    pinReady,
    openPinModal,
    rejectPin,
    finalsShow,
    voting,
    lastReveal,
    stats,
    runtimeState,
  } = useCasaLiveSession();

  const [participants, setParticipants] = useState<AdminParticipantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParticipants = useCallback(async () => {
    if (!pinReady) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchParticipants(eventCode, pin);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = data?.error ?? "Impossibile caricare i giocatori.";
        if (res.status === 401 || isInvalidAnimatorPinError(message)) {
          rejectPin("PIN non valido.");
          openPinModal();
        }
        throw new Error(message);
      }
      const data = (await res.json()) as { participants: AdminParticipantRow[] };
      setParticipants(data.participants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }, [eventCode, openPinModal, pin, pinReady, rejectPin]);

  useEffect(() => {
    void loadParticipants();
    const interval = window.setInterval(() => void loadParticipants(), 8000);
    return () => window.clearInterval(interval);
  }, [loadParticipants]);

  const boardRows = useMemo((): BoardRow[] => {
    const session = voting.current;
    if (session?.finalists?.length) {
      return sortFinalists(session.finalists, session.counts).slice(0, limit);
    }
    if (finalsShow?.finalists?.length) {
      return sortFinalists(
        finalsShow.finalists,
        finalsShow.cumulativeScores ?? {},
      ).slice(0, limit);
    }

    return [...participants]
      .sort((a, b) => {
        const onlineDelta =
          Number(participantAppearsOnline(b)) -
          Number(participantAppearsOnline(a));
        if (onlineDelta !== 0) return onlineDelta;
        return a.nickname.localeCompare(b.nickname, "it");
      })
      .slice(0, limit)
      .map((p, index) => ({
        id: p.id,
        label: p.nickname,
        score: null,
        meta: `${index + 1} · ${p.gender === "female" ? "F" : "M"}`,
        online: participantAppearsOnline(p),
      }));
  }, [finalsShow, limit, participants, voting.current]);

  const progress = stats.pairProgress;
  const hasPairScores = Boolean(
    voting.current?.finalists?.length || finalsShow?.finalists?.length,
  );

  return (
    <div className={["casa-live-widget", className].filter(Boolean).join(" ")}>
      <div className="casa-board-head">
        <span>
          {hasPairScores
            ? runtimeState === "finals" || runtimeState === "winner"
              ? "Finaliste"
              : "Voti"
            : "In sala"}
        </span>
        <span className="casa-live-meta tabular-nums">
          {stats.onlineCount}/{stats.participantCount} online
          {progress
            ? ` · ${progress.shownCount}/${progress.maxExtractions} estr.`
            : ""}
        </span>
      </div>

      {lastReveal ? (
        <p className="casa-board-reveal">
          Ultima · {lastReveal.maleNick} & {lastReveal.femaleNick}
          {typeof lastReveal.affinityScore === "number"
            ? ` · ${Math.round(lastReveal.affinityScore)}%`
            : ""}
        </p>
      ) : null}

      {error ? <p className="casa-live-error">{error}</p> : null}
      {loading && boardRows.length === 0 ? (
        <p className="casa-live-meta">Caricamento…</p>
      ) : null}
      {!loading && boardRows.length === 0 ? (
        <p className="casa-live-meta">Nessun giocatore. Entra dal QR.</p>
      ) : null}

      <ol className="casa-board-list">
        {boardRows.map((row, index) => (
          <li key={row.id} className="casa-board-row">
            <span className="casa-board-rank tabular-nums">{index + 1}</span>
            <span className="casa-board-label" data-off={row.online === false ? "1" : undefined}>
              {row.label}
            </span>
            {row.score != null ? (
              <strong className="casa-board-score tabular-nums">{row.score}</strong>
            ) : row.meta ? (
              <span className="casa-live-meta">{row.meta}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
