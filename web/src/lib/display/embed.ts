/** Anteprima dashboard: grafica sola, nessun audio dal proiettore embedded. */
export function displayPath(eventCode: string, embed = false): string {
  const base = `/s/${eventCode}/display`;
  return embed ? `${base}?embed=1` : base;
}

export function displayUrl(
  eventCode: string,
  options: { embed?: boolean; origin?: string } = {},
): string {
  const path = displayPath(eventCode, options.embed);
  if (options.origin) return `${options.origin}${path}`;
  return path;
}

export function isDisplayEmbedMode(
  params: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  return params?.get("embed") === "1";
}
