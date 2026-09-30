import {
  ageBandLabel,
  explicitSeeking,
  parseLoveRouletteAgeBand,
  seekingChoiceLabel,
  stageLetter,
  stageSexLabel,
  type LoveRouletteAgeBand,
  type LoveRouletteSeeking,
  type StageGender,
} from "@/lib/player/identity";

export type BoardPlayer = {
  id: string;
  nick: string;
  gender: StageGender;
  photo?: string;
  score: number;
  firstName?: string;
  lastName?: string;
  realName?: string;
  seeking?: LoveRouletteSeeking | null;
  ageBand?: LoveRouletteAgeBand | null;
};

export type PlayerScreenField =
  | "card"
  | "nick"
  | "name"
  | "gender"
  | "seeking"
  | "age"
  | "score"
  | "photo";

export type PlayerScreenDetail = {
  field: PlayerScreenField;
  label: string;
  value: string;
};

const AVATAR_M = "/grafiche/avatar-m.png";
const AVATAR_F = "/grafiche/avatar-f.png";

/** Riga API admin — senza email/telefono (non vanno a schermo). */
export type BoardPlayerRow = {
  id: string;
  nickname: string;
  gender: string;
  photo_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  real_name?: string | null;
  seeking?: string | null;
  age_band?: string | null;
};

export function boardPlayerFromRow(row: BoardPlayerRow): BoardPlayer {
  return {
    id: row.id,
    nick: row.nickname,
    gender: stageLetter(row.gender),
    photo: row.photo_url?.trim() || undefined,
    score: 0,
    firstName: row.first_name?.trim() || undefined,
    lastName: row.last_name?.trim() || undefined,
    realName: row.real_name?.trim() || undefined,
    seeking: explicitSeeking(row.seeking),
    ageBand: parseLoveRouletteAgeBand(row.age_band),
  };
}

export function playerScreenPhoto(player: BoardPlayer): string {
  const photo = player.photo?.trim() ?? "";
  if (photo && !photo.startsWith("blob:") && !photo.startsWith("file:")) {
    return photo;
  }
  return player.gender === "F" ? AVATAR_F : AVATAR_M;
}

export function playerFullName(player: BoardPlayer): string {
  const joined = [player.firstName, player.lastName]
    .map((p) => p?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
  return joined || player.realName?.trim() || "";
}

export function playerCardDisplayCommand(
  player: BoardPlayer,
): Record<string, string> {
  return {
    type: "slide",
    title: player.nick.toUpperCase(),
    kicker: player.gender,
    body: stageSexLabel(player.gender),
    imageUrl: playerScreenPhoto(player),
  };
}

/** Beat «presenti» / apertura: nick + sesso (+ cerca) sul proiettore. */
export function playerPresentiDisplayCommand(player: {
  nick: string;
  gender: StageGender;
  photo?: string;
  seeking?: LoveRouletteSeeking | null;
}): Record<string, string> {
  const sex = stageSexLabel(player.gender);
  const seek = player.seeking
    ? `Cerco ${seekingChoiceLabel(player.seeking)}`
    : "";
  return {
    type: "slide",
    title: player.nick.toUpperCase(),
    kicker: player.gender,
    body: [sex, seek].filter(Boolean).join(" · "),
    imageUrl: playerScreenPhoto(player),
  };
}

export function playerDetailDisplayCommand(
  player: BoardPlayer,
  field: PlayerScreenField,
): Record<string, string> {
  if (field === "card" || field === "photo" || field === "nick") {
    return playerCardDisplayCommand(player);
  }

  const detail = playerScreenDetails(player).find((d) => d.field === field);
  const value = (detail?.value || player.nick).trim();
  const owner = player.nick.trim();
  const title = (
    value.toLowerCase() === owner.toLowerCase()
      ? owner
      : `${owner} · ${value}`
  ).toUpperCase();
  return {
    type: "slide",
    kicker: detail?.label || owner,
    title,
    body: owner,
    imageUrl: playerScreenPhoto(player),
  };
}

export function playerScreenDetails(player: BoardPlayer): PlayerScreenDetail[] {
  const name = playerFullName(player);
  const rows: PlayerScreenDetail[] = [
    { field: "card", label: "Scheda", value: player.nick },
    { field: "nick", label: "Nick", value: player.nick },
  ];
  if (name) {
    rows.push({ field: "name", label: "Nome", value: name });
  }
  rows.push({
    field: "gender",
    label: "Chi è",
    value: stageSexLabel(player.gender),
  });
  if (player.seeking) {
    rows.push({
      field: "seeking",
      label: "Cerca",
      value: seekingChoiceLabel(player.seeking),
    });
  }
  if (player.ageBand) {
    rows.push({
      field: "age",
      label: "Età",
      value: ageBandLabel(player.ageBand),
    });
  }
  if (Number.isFinite(player.score) && player.score !== 0) {
    rows.push({
      field: "score",
      label: "Punti",
      value: player.score > 0 ? `+${player.score}` : String(player.score),
    });
  }
  if (player.photo) {
    rows.push({ field: "photo", label: "Foto", value: player.nick });
  }
  return rows;
}
