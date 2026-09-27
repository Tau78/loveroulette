import type { StageGender } from "@/lib/player/identity";

export function playerPresentKey(
  nick: string,
  gender: StageGender,
  photo?: string | null,
) {
  return `${nick.trim().toUpperCase()}|${gender}|${photo?.trim() ?? ""}`;
}
