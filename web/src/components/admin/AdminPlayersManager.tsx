"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FastForward,
  Maximize,
  Minimize,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  Users,
  WifiOff,
} from "lucide-react";
import {
  createParticipant,
  deleteParticipant,
  fetchParticipants,
  isInvalidAnimatorPinError,
  playerTerminalTestUrl,
  postSimulatePlayers,
  updateParticipant,
} from "@/lib/admin/animator-api";
import type { AdminParticipantRow } from "@/lib/musicpro/participant-admin";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminPinModal } from "@/components/admin/AdminPinModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAnimatorPin } from "@/hooks/useAnimatorPin";
import { useFullscreen } from "@/hooks/useFullscreen";

interface AdminPlayersManagerProps {
  eventCode: string;
  eventTitle: string;
  pinRequired: boolean;
}

function formatLastSeen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPlayersManager({
  eventCode,
  eventTitle,
  pinRequired,
}: AdminPlayersManagerProps) {
  const [participants, setParticipants] = useState<AdminParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNick, setEditNick] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female">("male");
  const [showAdd, setShowAdd] = useState(false);
  const [newNick, setNewNick] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [newGender, setNewGender] = useState<"male" | "female">("male");
  const [pendingDeletePlayer, setPendingDeletePlayer] = useState<{
    id: string;
    nickname: string;
  } | null>(null);
  const [pendingSimulate, setPendingSimulate] = useState<
    "couples" | "matching" | null
  >(null);
  const [simulateBusy, setSimulateBusy] = useState(false);
  const [simulateMode, setSimulateMode] = useState<"couples" | "matching" | null>(
    null,
  );
  const [simulateSuccess, setSimulateSuccess] = useState<string | null>(null);

  const {
    pin,
    pinReady,
    showPinModal,
    pinError,
    pinVerifying,
    submitPin,
    rejectPin,
  } = useAnimatorPin({ eventCode, pinRequired });

  const disabled = !pinReady || pinVerifying;
  const { containerRef, isFullscreen, supported, toggle } = useFullscreen({
    storageKey: `lr_admin_fullscreen_players_${eventCode}`,
  });

  const load = useCallback(async () => {
    if (!pinReady) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchParticipants(eventCode, pin);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Impossibile caricare i giocatori.");
      }
      const data = (await res.json()) as { participants: AdminParticipantRow[] };
      setParticipants(data.participants ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setLoading(false);
    }
  }, [eventCode, pin, pinReady]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  const onlineCount = useMemo(
    () => participants.filter((p) => p.is_online).length,
    [participants],
  );

  function handleInvalidPin(message: string) {
    rejectPin(message);
  }

  async function handleCreate() {
    if (disabled || !newNick.trim()) return;
    setBusyId("__create__");
    setError(null);
    try {
      const res = await createParticipant(
        eventCode,
        {
          nickname: newNick.trim(),
          gender: newGender,
          badgeCode: newBadge.trim() || null,
        },
        pin,
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        const message = data?.error ?? "Creazione non riuscita.";
        if (res.status === 401 || isInvalidAnimatorPinError(message)) {
          handleInvalidPin("PIN non valido.");
        }
        throw new Error(message);
      }
      setShowAdd(false);
      setNewNick("");
      setNewBadge("");
      setNewGender("male");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(player: AdminParticipantRow) {
    setEditingId(player.id);
    setEditNick(player.nickname);
    setEditBadge(player.badge_code ?? "");
    setEditGender(player.gender);
    setPendingDeletePlayer(null);
  }

  async function saveEdit(playerId: string) {
    if (disabled || !editNick.trim()) return;
    setBusyId(playerId);
    setError(null);
    try {
      const res = await updateParticipant(
        eventCode,
        playerId,
        {
          nickname: editNick.trim(),
          gender: editGender,
          badgeCode: editBadge.trim() || null,
        },
        pin,
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Salvataggio non riuscito.");
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(playerId: string) {
    if (disabled) return;
    setBusyId(playerId);
    setError(null);
    try {
      const res = await deleteParticipant(eventCode, playerId, pin);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Eliminazione non riuscita.");
      }
      setPendingDeletePlayer(null);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusyId(null);
    }
  }

  async function runSimulateCouples(goToMatching: boolean) {
    if (disabled || simulateBusy) return;

    setSimulateBusy(true);
    setSimulateMode(goToMatching ? "matching" : "couples");
    setError(null);
    setSimulateSuccess(null);

    try {
      const res = await postSimulatePlayers(
        eventCode,
        { coupleCount: 10, replace: true, goToMatching },
        pin,
      );
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        answersInserted?: number;
        questionCount?: number;
        pairCount?: number;
      } | null;

      if (!res.ok) {
        const message = data?.error ?? "Simulazione non riuscita.";
        if (res.status === 401 || isInvalidAnimatorPinError(message)) {
          handleInvalidPin("PIN non valido.");
        }
        throw new Error(message);
      }

      setSimulateSuccess(
        goToMatching
          ? `Matching pronto — ${data?.pairCount ?? 0} coppie calcolate (${data?.answersInserted ?? 0} risposte). Torna alla dashboard per l'estrazione.`
          : `10 coppie pronte — ${data?.answersInserted ?? 0} risposte su ${data?.questionCount ?? "?"} domande.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setSimulateBusy(false);
      setSimulateMode(null);
    }
  }

  async function handleForceOffline(playerId: string) {
    if (disabled) return;
    setBusyId(playerId);
    try {
      const res = await updateParticipant(
        eventCode,
        playerId,
        { forceOffline: true },
        pin,
      );
      if (!res.ok) throw new Error("Impossibile segnare offline.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore di rete.");
    } finally {
      setBusyId(null);
    }
  }

  function openTerminal(player: AdminParticipantRow) {
    const url = playerTerminalTestUrl(eventCode, {
      id: player.id,
      nickname: player.nickname,
      gender: player.gender,
      badge_code: player.badge_code,
    });
    window.open(url, `lr-terminal-${player.id.slice(0, 8)}`, "noopener,noreferrer");
  }

  return (
    <>
      <AdminPinModal
        open={showPinModal}
        error={pinError}
        verifying={pinVerifying}
        onSubmit={submitPin}
      />

      <AdminConfirmDialog
        open={pendingDeletePlayer !== null}
        title="Elimina giocatore"
        description={
          pendingDeletePlayer
            ? `Rimuovere ${pendingDeletePlayer.nickname} dalla serata? L'azione non è reversibile.`
            : ""
        }
        confirmLabel="Elimina"
        variant="destructive"
        busy={busyId === pendingDeletePlayer?.id}
        onCancel={() => setPendingDeletePlayer(null)}
        onConfirm={() => {
          if (pendingDeletePlayer) {
            void handleDelete(pendingDeletePlayer.id);
          }
        }}
      />

      <AdminConfirmDialog
        open={pendingSimulate !== null}
        title={
          pendingSimulate === "matching"
            ? "Simula fino al matching"
            : "Simula 10 coppie test"
        }
        description={
          pendingSimulate === "matching"
            ? "Creare 10 coppie test, compilare il quiz e passare subito al matching? I bot precedenti verranno sostituiti."
            : "Creare 10 coppie di test (Bot U01–U10 / Bot D01–D10) con risposte quiz già compilate? I bot precedenti verranno sostituiti."
        }
        confirmLabel="Procedi"
        variant="warning"
        busy={simulateBusy}
        onCancel={() => setPendingSimulate(null)}
        onConfirm={() => {
          if (!pendingSimulate) return;
          const mode = pendingSimulate;
          setPendingSimulate(null);
          void runSimulateCouples(mode === "matching");
        }}
      />

      <div
        ref={containerRef}
        data-admin-fullscreen={isFullscreen || undefined}
        className={cn(
          "min-h-screen flex flex-col theme-dark-fuchsia bg-background",
          isFullscreen && "h-screen overflow-hidden",
        )}
      >
        <header className="shrink-0 border-b border-border/40 bg-card/70 px-3 py-2">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/${eventCode}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold truncate">Giocatori — {eventTitle}</h1>
              {!isFullscreen ? (
                <p className="text-[11px] text-muted-foreground">
                  {participants.length} iscritti · {onlineCount} online
                </p>
              ) : null}
            </div>
            {supported ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="size-8 shrink-0"
                onClick={() => void toggle()}
                title={
                  isFullscreen
                    ? "Esci da schermo intero (Esc)"
                    : "Schermo intero (F)"
                }
                aria-label={
                  isFullscreen ? "Esci da schermo intero" : "Schermo intero"
                }
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="size-3.5" />
                ) : (
                  <Maximize className="size-3.5" />
                )}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={disabled || simulateBusy}
              onClick={() => setPendingSimulate("couples")}
            >
              <Users className="size-3.5" />
              {simulateBusy && simulateMode === "couples"
                ? "Simulo…"
                : "10 coppie test"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-primary/35 text-primary"
              disabled={disabled || simulateBusy}
              onClick={() => setPendingSimulate("matching")}
            >
              <FastForward className="size-3.5" />
              {simulateBusy && simulateMode === "matching"
                ? "Matching…"
                : "→ matching"}
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={disabled}
              onClick={() => {
                setShowAdd((v) => !v);
                setPendingDeletePlayer(null);
              }}
            >
              <Plus className="size-3.5" />
              Aggiungi
            </Button>
          </div>
        </header>

        <main
          className={cn(
            "flex-1 p-3 max-w-5xl mx-auto w-full space-y-3",
            isFullscreen && "min-h-0 overflow-y-auto p-2 max-w-none",
          )}
        >
          {error ? (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              {error}
            </p>
          ) : null}

          {simulateSuccess ? (
            <p className="text-sm text-emerald-400 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
              {simulateSuccess}
            </p>
          ) : null}

          {showAdd ? (
            <section className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nuovo giocatore
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-nick" className="text-xs">
                    Nickname
                  </Label>
                  <Input
                    id="new-nick"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value)}
                    className="h-8 text-sm"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-badge" className="text-xs">
                    Badge
                  </Label>
                  <Input
                    id="new-badge"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Es. 12"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-gender" className="text-xs">
                    Genere
                  </Label>
                  <select
                    id="new-gender"
                    value={newGender}
                    onChange={(e) =>
                      setNewGender(e.target.value as "male" | "female")
                    }
                    className="h-8 w-full rounded-md border border-input bg-input/30 px-2 text-sm"
                  >
                    <option value="male">Uomo</option>
                    <option value="female">Donna</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={disabled || busyId === "__create__" || !newNick.trim()}
                  onClick={() => void handleCreate()}
                >
                  Salva giocatore
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAdd(false)}
                >
                  Annulla
                </Button>
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
            {loading && participants.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Caricamento giocatori…
              </p>
            ) : participants.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Nessun giocatore iscritto. Aggiungine uno o condividi il link
                di join.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30 bg-black/20 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Stato</th>
                      <th className="px-3 py-2 font-medium">Nickname</th>
                      <th className="px-3 py-2 font-medium hidden sm:table-cell">
                        Badge
                      </th>
                      <th className="px-3 py-2 font-medium hidden md:table-cell">
                        Genere
                      </th>
                      <th className="px-3 py-2 font-medium hidden lg:table-cell">
                        Ultimo accesso
                      </th>
                      <th className="px-3 py-2 font-medium text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((player) => {
                      const isEditing = editingId === player.id;
                      const isBusy = busyId === player.id;

                      return (
                        <tr
                          key={player.id}
                          className="border-b border-border/20 hover:bg-muted/10"
                        >
                          <td className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] h-5",
                                player.is_online
                                  ? "border-emerald-500/40 text-emerald-400"
                                  : "text-muted-foreground",
                              )}
                            >
                              {player.is_online ? "Online" : "Offline"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {isEditing ? (
                              <Input
                                value={editNick}
                                onChange={(e) => setEditNick(e.target.value)}
                                className="h-7 text-sm max-w-[180px]"
                                maxLength={40}
                              />
                            ) : (
                              <span className="font-medium">{player.nickname}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 hidden sm:table-cell">
                            {isEditing ? (
                              <Input
                                value={editBadge}
                                onChange={(e) => setEditBadge(e.target.value)}
                                className="h-7 text-sm max-w-[80px]"
                                maxLength={20}
                              />
                            ) : (
                              player.badge_code ?? "—"
                            )}
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell">
                            {isEditing ? (
                              <select
                                value={editGender}
                                onChange={(e) =>
                                  setEditGender(
                                    e.target.value as "male" | "female",
                                  )
                                }
                                className="h-7 rounded-md border border-input bg-input/30 px-2 text-xs"
                              >
                                <option value="male">Uomo</option>
                                <option value="female">Donna</option>
                              </select>
                            ) : player.gender === "female" ? (
                              "Donna"
                            ) : (
                              "Uomo"
                            )}
                          </td>
                          <td className="px-3 py-2 hidden lg:table-cell text-xs text-muted-foreground">
                            {formatLastSeen(player.last_seen_at)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={disabled || isBusy}
                                title="Apri terminale giocatore"
                                onClick={() => openTerminal(player)}
                              >
                                <Smartphone className="size-3" />
                                <span className="hidden sm:inline">Test</span>
                              </Button>

                              {isEditing ? (
                                <>
                                  <Button
                                    type="button"
                                    size="xs"
                                    disabled={disabled || isBusy}
                                    onClick={() => void saveEdit(player.id)}
                                  >
                                    Salva
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Annulla
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  disabled={disabled || isBusy}
                                  onClick={() => startEdit(player)}
                                >
                                  <Pencil className="size-3" />
                                </Button>
                              )}

                              {player.is_online ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  disabled={disabled || isBusy}
                                  title="Segna offline"
                                  onClick={() => void handleForceOffline(player.id)}
                                >
                                  <WifiOff className="size-3" />
                                </Button>
                              ) : null}

                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                disabled={disabled || isBusy}
                                onClick={() => {
                                  setPendingDeletePlayer({
                                    id: player.id,
                                    nickname: player.nickname,
                                  });
                                  setEditingId(null);
                                }}
                              >
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>10 coppie test</strong> crea 20 giocatori bot, li segna online
            e compila le risposte del quiz.
            <strong className="font-semibold text-foreground/80">
              {" "}
              → matching
            </strong>{" "}
            fa lo stesso e passa subito alla fase matching (100 coppie
            calcolate) — torna alla dashboard per l&apos;estrazione.
            <br />
            <strong>Test terminale</strong> apre la vista giocatore in una nuova
            finestra con lo stesso profilo (utile per simulare più dispositivi).
            <ExternalLink className="inline size-3 ml-1 opacity-60" />
          </p>
        </main>
      </div>
    </>
  );
}
