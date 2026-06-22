export const CHALLENGE_REGIA_BED_CHANNEL_PREFIX =
  "love-roulette-challenge-regia-bed";

export type ChallengeRegiaBedMessage = {
  type: "bed_active";
  eventCode: string;
  active: boolean;
};

export function challengeRegiaBedChannel(eventCode: string): string {
  return `${CHALLENGE_REGIA_BED_CHANNEL_PREFIX}:${eventCode}`;
}

/** Segnala che l'animatore ha avviato/fermato audio o video di prova. */
export function setChallengeRegiaBedActive(
  eventCode: string,
  active: boolean,
): void {
  if (typeof window === "undefined") return;
  const channel = new BroadcastChannel(challengeRegiaBedChannel(eventCode));
  channel.postMessage({
    type: "bed_active",
    eventCode,
    active,
  } satisfies ChallengeRegiaBedMessage);
  channel.close();
}

export function subscribeChallengeRegiaBed(
  eventCode: string,
  onActive: (active: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const channel = new BroadcastChannel(challengeRegiaBedChannel(eventCode));
  channel.onmessage = (event: MessageEvent<ChallengeRegiaBedMessage>) => {
    const msg = event.data;
    if (msg?.type === "bed_active" && msg.eventCode === eventCode) {
      onActive(msg.active);
    }
  };
  return () => channel.close();
}
