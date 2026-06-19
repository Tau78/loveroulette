const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const JOIN_CODE_RE = /^[A-Z0-9]{6}$/;

export function isEventUuid(slug: string): boolean {
  return UUID_RE.test(slug);
}

export function isJoinCode(slug: string): boolean {
  return JOIN_CODE_RE.test(slug.toUpperCase());
}

export function isValidEventSlug(slug: string): boolean {
  return isEventUuid(slug) || isJoinCode(slug);
}

export function normalizeEventSlug(slug: string): string {
  if (isEventUuid(slug)) return slug.toLowerCase();
  return slug.toUpperCase();
}
