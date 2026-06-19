/** Formato data/ora serata per UI giocatore mobile. */
export function formatPlayerEventDateTime(
  eventDate: string,
  eventTime: string | null,
): string {
  try {
    const iso = eventTime
      ? `${eventDate}T${eventTime.length === 5 ? `${eventTime}:00` : eventTime}`
      : eventDate;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
      return eventDate;
    }

    const datePart = new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsed);

    if (!eventTime) return datePart;

    const timePart = new Intl.DateTimeFormat("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);

    return `${datePart} · ${timePart}`;
  } catch {
    return eventDate;
  }
}

export const PLAYER_GAME_NAME = "Love Roulette";
