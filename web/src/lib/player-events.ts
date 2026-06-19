import { REALTIME_EVENTS } from "./types";

export interface CoupleRevealedDetail {
  partnerNick: string;
  yourNick?: string;
}

export const COUPLE_REVEALED_EVENT = REALTIME_EVENTS.COUPLE_REVEALED;

export function dispatchCoupleRevealed(detail: CoupleRevealedDetail) {
  window.dispatchEvent(
    new CustomEvent<CoupleRevealedDetail>(COUPLE_REVEALED_EVENT, { detail }),
  );
}
