export function playerPresentKey(
  nick: string,
  gender: "M" | "F",
  photo?: string | null,
) {
  return `${nick.trim().toUpperCase()}|${gender}|${photo?.trim() ?? ""}`;
}
