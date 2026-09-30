const TECHNICAL_EVENT_PREFIX = /^\s*\[sandbox\]\s*/i;

export function playerEventLabel(value: string | null | undefined): string | null {
  const label = value?.replace(TECHNICAL_EVENT_PREFIX, "").trim();
  return label || null;
}
