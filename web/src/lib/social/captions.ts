import { CHALLENGE_LABELS } from "@/lib/types";
import type {
  FinalsVotePayload,
  PromoVenuePayload,
  QuizShockPayload,
  SocialFormatId,
  TopShipPayload,
  WinnerNightPayload,
} from "./types";

function venueLine(venueName: string): string {
  const v = venueName.trim();
  return v ? ` @ ${v}` : "";
}

function hashtags(venueName: string): string {
  const base = ["#LoveRoulette", "#SerataSingle", "#GameShow"];
  const v = venueName.trim().replace(/\s+/g, "");
  if (v) base.push(`#${v}`);
  return base.join(" ");
}

export function captionQuizShock(p: QuizShockPayload): string {
  const top = [...p.options].sort((a, b) => b.percent - a.percent)[0];
  const answer = top ? `${top.percent}% · ${top.label}` : "Risultati in sala";
  return [
    `Quiz shock${venueLine(p.venueName)} 💘`,
    ``,
    `"${p.questionBody}"`,
    ``,
    answer,
    `${p.totalAnswers} risposte in sala.`,
    ``,
    hashtags(p.venueName),
  ].join("\n");
}

export function captionTopShip(p: TopShipPayload): string {
  const lines = p.couples.map(
    (c) =>
      `${c.rank}. ${c.maleNickname} & ${c.femaleNickname}` +
      (c.score != null ? ` · ${Math.round(c.score)}%` : ""),
  );
  return [
    `Top ship della serata${venueLine(p.venueName)} 🔥`,
    ``,
    ...lines,
    ``,
    `Chi shippi di più?`,
    ``,
    hashtags(p.venueName),
  ].join("\n");
}

export function captionFinalsVote(p: FinalsVotePayload): string {
  const label =
    p.challengeLabel ||
    (p.challengeId ? CHALLENGE_LABELS[p.challengeId] : "La prova");
  const leader = [...p.couples].sort((a, b) => b.votes - a.votes)[0];
  return [
    `Finale live · ${label}${venueLine(p.venueName)} 🎤`,
    ``,
    leader
      ? `In testa: ${leader.maleNick} & ${leader.femaleNick} (${leader.votes} voti)`
      : "Voto in corso…",
    ``,
    `Il pubblico decide.`,
    ``,
    hashtags(p.venueName),
  ].join("\n");
}

export function captionWinnerNight(p: WinnerNightPayload): string {
  const prize =
    [p.prizeHeadline, p.prizeSub].map((s) => s.trim()).filter(Boolean).join(" — ") ||
    "Il premio della serata";
  return [
    `Vincitori della night${venueLine(p.venueName)} 🏆`,
    ``,
    p.coupleLabel,
    prize,
    ``,
    `Complimenti — e grazie a tutti i single in sala.`,
    ``,
    hashtags(p.venueName),
  ].join("\n");
}

export function captionPromoVenue(p: PromoVenuePayload): string {
  const where = p.venueName.trim() || "il tuo locale";
  return [
    `Love Roulette stasera da ${where} 💘`,
    ``,
    p.staseraHeadline.trim() || "STASERA",
    p.staseraSub.trim() || "Quiz, match, finale sul palco.",
    p.topCoupleLabel ? `Highlight: ${p.topCoupleLabel}` : "",
    p.prizeHeadline.trim() ? `In palio: ${p.prizeHeadline.trim()}` : "",
    ``,
    `Prenota il tuo posto. Porta il telefono. Gioca.`,
    ``,
    hashtags(p.venueName),
  ]
    .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
    .join("\n");
}

export function captionForFormat(
  id: SocialFormatId,
  payload:
    | QuizShockPayload
    | TopShipPayload
    | FinalsVotePayload
    | WinnerNightPayload
    | PromoVenuePayload,
): string {
  switch (id) {
    case "quiz_shock":
      return captionQuizShock(payload as QuizShockPayload);
    case "top_ship":
      return captionTopShip(payload as TopShipPayload);
    case "finals_vote":
      return captionFinalsVote(payload as FinalsVotePayload);
    case "winner_night":
      return captionWinnerNight(payload as WinnerNightPayload);
    case "promo_venue":
      return captionPromoVenue(payload as PromoVenuePayload);
  }
}

/** Bundle captions for venue pack (.txt download). */
export function promoVenueCaptionsBundle(p: PromoVenuePayload): string {
  return [
    "=== Love Roulette · Pack venue ===",
    "",
    "— Story 1 · Invite —",
    captionPromoVenue(p),
    "",
    "— Story 2 · Energia —",
    [
      `Serata live${venueLine(p.venueName)} ✨`,
      ``,
      `Quiz · Match · Finale sul palco`,
      p.prizeHeadline.trim() ? `Premio: ${p.prizeHeadline.trim()}` : "",
      ``,
      hashtags(p.venueName),
    ]
      .filter(Boolean)
      .join("\n"),
    "",
    "— Reel highlight —",
    [
      `Cosa è successo a ${p.venueName.trim() || "Love Roulette"} 💘`,
      p.topCoupleLabel ? `Ship della night: ${p.topCoupleLabel}` : "Match, voti, vincitori.",
      ``,
      `Salva · Condividi · Torna la prossima.`,
      ``,
      hashtags(p.venueName),
    ].join("\n"),
    "",
  ].join("\n");
}
