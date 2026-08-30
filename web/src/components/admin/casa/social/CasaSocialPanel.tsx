"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCasaLiveSession } from "@/components/admin/casa/casa-live-session-context";
import type { CasaPrep } from "@/lib/admin/casa-prep";
import type { CasaSlide, CasaSlideId } from "@/lib/admin/casa-slides";
import type { QuestionResults } from "@/lib/musicpro/quiz-results";
import type { PreviewPairRow } from "@/lib/musicpro/matching";
import type { LoveRouletteQuestion } from "@/lib/musicpro/types";
import {
  buildFinalsVotePayload,
  buildPromoVenuePayload,
  buildQuizShockPayload,
  buildTopShipPayload,
  buildWinnerNightPayload,
  demoPayloads,
} from "@/lib/social/assemble";
import {
  captionForFormat,
  promoVenueCaptionsBundle,
} from "@/lib/social/captions";
import {
  SOCIAL_FORMATS,
  type SocialAspect,
  type SocialFormatId,
  type SocialPayload,
} from "@/lib/social/types";
import { FinalsVoteCard } from "./cards/FinalsVoteCard";
import { PromoVenueCard, type PromoFrame } from "./cards/PromoVenueCard";
import { QuizShockCard } from "./cards/QuizShockCard";
import { TopShipCard } from "./cards/TopShipCard";
import { WinnerNightCard } from "./cards/WinnerNightCard";
import { copyText, downloadTextFile, exportNodePng } from "./export-png";

type Props = {
  prep: CasaPrep;
  slides: Record<CasaSlideId, CasaSlide>;
};

const PROMO_FRAMES: { id: PromoFrame; label: string }[] = [
  { id: "invite", label: "Invite" },
  { id: "energia", label: "Energia" },
  { id: "highlight", label: "Highlight" },
];

function scalePreview(aspect: SocialAspect): { w: number; h: number; scale: number } {
  const base = aspect === "1:1" ? 1080 : 1080;
  const h = aspect === "1:1" ? 1080 : 1920;
  const targetW = aspect === "1:1" ? 160 : 120;
  const scale = targetW / base;
  return { w: targetW, h: Math.round(h * scale), scale };
}

export function CasaSocialPanel({ prep, slides }: Props) {
  const {
    eventCode,
    quizState,
    voting,
    finalsShow,
  } = useCasaLiveSession();

  const [questions, setQuestions] = useState<LoveRouletteQuestion[]>([]);
  const [statsByQuestion, setStatsByQuestion] = useState<QuestionResults[]>([]);
  const [ships, setShips] = useState<PreviewPairRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [aspectByFormat, setAspectByFormat] = useState<
    Partial<Record<SocialFormatId, SocialAspect>>
  >({});

  const exportHostRef = useRef<HTMLDivElement>(null);

  const venueName = prep.venueName;
  const demos = useMemo(
    () => demoPayloads(venueName, eventCode),
    [venueName, eventCode],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, rankRes] = await Promise.all([
        fetch(`/api/events/${encodeURIComponent(eventCode)}/questions`),
        fetch(`/api/events/${encodeURIComponent(eventCode)}/quiz/ranking`),
      ]);

      const qData = (await qRes.json().catch(() => null)) as {
        questions?: LoveRouletteQuestion[];
        error?: string;
      } | null;
      if (!qRes.ok) {
        throw new Error(qData?.error ?? "Domande non disponibili.");
      }
      const loadedQuestions = qData?.questions ?? [];
      setQuestions(loadedQuestions);

      const rankData = (await rankRes.json().catch(() => null)) as {
        pairs?: PreviewPairRow[];
        error?: string;
      } | null;
      if (rankRes.ok) {
        setShips(rankData?.pairs ?? []);
      } else {
        setShips([]);
      }

      const ids =
        quizState?.questionIds?.slice(
          0,
          Math.max(1, (quizState.currentIndex ?? 0) + 1),
        ) ??
        loadedQuestions.slice(0, 8).map((q) => q.id);

      const uniqueIds = [...new Set(ids)].slice(0, 12);
      const stats: QuestionResults[] = [];
      await Promise.all(
        uniqueIds.map(async (questionId) => {
          const res = await fetch(
            `/api/events/${encodeURIComponent(eventCode)}/quiz/stats?questionId=${encodeURIComponent(questionId)}`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as QuestionResults;
          if (data?.questionId) stats.push(data);
        }),
      );
      setStatsByQuestion(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento fallito.");
    } finally {
      setLoading(false);
    }
  }, [eventCode, quizState]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const questionBodies = useMemo(() => {
    const map: Record<string, string> = {};
    for (const q of questions) map[q.id] = q.body;
    return map;
  }, [questions]);

  const livePayloads = useMemo(() => {
    const quiz = buildQuizShockPayload({
      results: statsByQuestion,
      questionBodies,
      venueName,
    });
    const top = buildTopShipPayload({
      couples: ships.map((p) => ({
        rank: p.rank,
        maleNickname: p.maleNickname,
        femaleNickname: p.femaleNickname,
        score: p.score,
      })),
      shipTopN: prep.shipTopN,
      venueName,
    });
    const finals = buildFinalsVotePayload({
      voting: voting.current,
      venueName,
    });
    const winner = buildWinnerNightPayload({
      finalsShow,
      winnerPairId: voting.current?.winnerPairId,
      premio: slides.premio,
      venueName,
      eventCode,
    });
    const topLabel =
      top?.couples[0] != null
        ? `${top.couples[0].maleNickname} & ${top.couples[0].femaleNickname}`
        : winner?.coupleLabel ?? null;
    const promo = buildPromoVenuePayload({
      venueName,
      eventCode,
      stasera: slides.stasera,
      premio: slides.premio,
      topCoupleLabel: topLabel,
    });
    return {
      quiz_shock: quiz,
      top_ship: top,
      finals_vote: finals,
      winner_night: winner,
      promo_venue: promo,
    } as const;
  }, [
    statsByQuestion,
    questionBodies,
    venueName,
    ships,
    prep.shipTopN,
    voting.current,
    finalsShow,
    slides.premio,
    slides.stasera,
    eventCode,
  ]);

  function payloadFor(id: SocialFormatId): SocialPayload | null {
    if (useDemo) return demos[id];
    return livePayloads[id] ?? (id === "promo_venue" ? livePayloads.promo_venue : null);
  }

  function aspectFor(id: SocialFormatId, metaAspects: SocialAspect[]): SocialAspect {
    return aspectByFormat[id] ?? metaAspects[0]!;
  }

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusyId(key);
    try {
      await fn();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Export fallito.");
    } finally {
      setBusyId(null);
    }
  }

  async function downloadCard(
    id: SocialFormatId,
    aspect: SocialAspect,
    frame?: PromoFrame,
  ) {
    const host = exportHostRef.current;
    if (!host) return;
    const node = host.querySelector(
      `[data-social-export="${id}${frame ? `-${frame}` : ""}"]`,
    ) as HTMLElement | null;
    if (!node) {
      setToast("Anteprima non pronta.");
      return;
    }
    const code = eventCode.toUpperCase();
    const suffix = frame ? `_${frame}` : "";
    const aspectTag = aspect === "1:1" ? "1x1" : "9x16";
    await exportNodePng(
      node,
      `${code}_${id}${suffix}_${aspectTag}.png`,
      aspect,
    );
    setToast("PNG scaricato.");
  }

  return (
    <div className="casa-social">
      <p className="casa-sub">
        Card PNG + caption IT per Reels/Stories. Solo nickname pubblici già in
        sala — niente email. Se i dati live mancano, usa la demo.
      </p>

      <div className="casa-social-toolbar">
        <button
          type="button"
          className="casa-hit"
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? "Aggiorno…" : "Aggiorna dati"}
        </button>
        <button
          type="button"
          className="casa-hit"
          data-on={useDemo ? "1" : undefined}
          onClick={() => setUseDemo((v) => !v)}
        >
          {useDemo ? "Demo ON" : "Demo"}
        </button>
        {toast ? <span className="casa-social-toast">{toast}</span> : null}
      </div>

      {error ? <p className="casa-sub casa-social-err">{error}</p> : null}

      <ul className="casa-social-list">
        {SOCIAL_FORMATS.map((meta) => {
          const payload = payloadFor(meta.id);
          const aspect = aspectFor(meta.id, meta.aspects);
          const ready = payload != null;
          const caption = ready
            ? captionForFormat(meta.id, payload)
            : "Dati non ancora disponibili per questa card.";
          const preview = scalePreview(aspect);

          return (
            <li key={meta.id} className="casa-social-row">
              <div className="casa-social-row-main">
                <div>
                  <p className="casa-social-title">{meta.title}</p>
                  <p className="casa-sub">{meta.blurb}</p>
                  {!ready && !useDemo ? (
                    <p className="casa-sub casa-social-miss">
                      In attesa di dati live — attiva Demo per anteprima.
                    </p>
                  ) : null}
                </div>

                {meta.aspects.length > 1 ? (
                  <div className="casa-social-aspects">
                    {meta.aspects.map((a) => (
                      <button
                        key={a}
                        type="button"
                        className="casa-hit"
                        data-on={aspect === a ? "1" : undefined}
                        onClick={() =>
                          setAspectByFormat((prev) => ({ ...prev, [meta.id]: a }))
                        }
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="casa-social-aspect-tag">{aspect}</span>
                )}
              </div>

              <div className="casa-social-row-body">
                <div
                  className="casa-social-preview"
                  style={{ width: preview.w, height: preview.h }}
                >
                  {ready ? (
                    <div
                      style={{
                        width: aspect === "1:1" ? 1080 : 1080,
                        height: aspect === "1:1" ? 1080 : 1920,
                        transform: `scale(${preview.scale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <FormatCard
                        id={meta.id}
                        payload={payload}
                        aspect={aspect}
                        frame={meta.id === "promo_venue" ? "invite" : undefined}
                      />
                    </div>
                  ) : (
                    <div className="casa-social-preview-empty">N/D</div>
                  )}
                </div>

                <div className="casa-social-actions">
                  <textarea
                    className="casa-field casa-social-caption"
                    readOnly
                    value={caption}
                    rows={6}
                    aria-label={`Caption ${meta.title}`}
                  />
                  <div className="casa-social-btns">
                    <button
                      type="button"
                      className="casa-hit"
                      disabled={!ready || busyId === `${meta.id}-png`}
                      onClick={() =>
                        void withBusy(`${meta.id}-png`, () =>
                          downloadCard(
                            meta.id,
                            aspect,
                            meta.id === "promo_venue" ? "invite" : undefined,
                          ),
                        )
                      }
                    >
                      Scarica PNG
                    </button>
                    <button
                      type="button"
                      className="casa-hit"
                      disabled={!ready || busyId === `${meta.id}-cap`}
                      onClick={() =>
                        void withBusy(`${meta.id}-cap`, async () => {
                          const ok = await copyText(caption);
                          setToast(ok ? "Caption copiata." : "Copia non riuscita.");
                        })
                      }
                    >
                      Copia caption
                    </button>
                    {meta.id === "promo_venue" && ready ? (
                      <>
                        {PROMO_FRAMES.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            className="casa-hit"
                            disabled={busyId === `promo-${f.id}`}
                            onClick={() =>
                              void withBusy(`promo-${f.id}`, () =>
                                downloadCard("promo_venue", "9:16", f.id),
                              )
                            }
                          >
                            PNG {f.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="casa-hit"
                          onClick={() => {
                            downloadTextFile(
                              `${eventCode.toUpperCase()}_pack_venue_captions.txt`,
                              promoVenueCaptionsBundle(
                                payload as ReturnType<typeof buildPromoVenuePayload>,
                              ),
                            );
                            setToast("Caption pack scaricato.");
                          }}
                        >
                          Caption .txt
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Offscreen full-res cards for html-to-image */}
      <div
        ref={exportHostRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
          opacity: 1,
        }}
      >
        {SOCIAL_FORMATS.map((meta) => {
          const payload = payloadFor(meta.id);
          if (!payload) return null;
          const aspect = aspectFor(meta.id, meta.aspects);
          if (meta.id === "promo_venue") {
            return PROMO_FRAMES.map((f) => (
              <div
                key={`${meta.id}-${f.id}`}
                data-social-export={`${meta.id}-${f.id}`}
              >
                <FormatCard
                  id={meta.id}
                  payload={payload}
                  aspect="9:16"
                  frame={f.id}
                />
              </div>
            ));
          }
          return (
            <div key={meta.id} data-social-export={meta.id}>
              <FormatCard id={meta.id} payload={payload} aspect={aspect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormatCard({
  id,
  payload,
  aspect,
  frame = "invite",
}: {
  id: SocialFormatId;
  payload: SocialPayload;
  aspect: SocialAspect;
  frame?: PromoFrame;
}): ReactNode {
  switch (id) {
    case "quiz_shock":
      return (
        <QuizShockCard
          payload={payload as Extract<SocialPayload, { format: "quiz_shock" }>}
          aspect={aspect}
        />
      );
    case "top_ship":
      return (
        <TopShipCard
          payload={payload as Extract<SocialPayload, { format: "top_ship" }>}
          aspect={aspect}
        />
      );
    case "finals_vote":
      return (
        <FinalsVoteCard
          payload={payload as Extract<SocialPayload, { format: "finals_vote" }>}
          aspect={aspect}
        />
      );
    case "winner_night":
      return (
        <WinnerNightCard
          payload={payload as Extract<SocialPayload, { format: "winner_night" }>}
          aspect={aspect}
        />
      );
    case "promo_venue":
      return (
        <PromoVenueCard
          payload={payload as Extract<SocialPayload, { format: "promo_venue" }>}
          aspect={aspect}
          frame={frame}
        />
      );
  }
}
