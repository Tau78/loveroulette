/**
 * Cue rapidi header plancia → overlay proiettore (/display).
 * QR = comando nativo; gli altri sono slide sticky finché non arrivano i MP4.
 *
 * Video opzionali (quando presenti, la plancia può anche metterli in anteprima locale):
 *   /grafiche/video/cues/sponsor.mp4
 *   /grafiche/video/cues/pausa.mp4
 *   /grafiche/video/cues/tra-5-minuti.mp4
 */

export type BoardDisplayCueId = "qr" | "sponsor" | "pausa" | "tra5";

export type BoardDisplayCue =
  | {
      id: BoardDisplayCueId;
      label: string;
      title: string;
      command: { type: "show_qr" };
      videoPath?: undefined;
    }
  | {
      id: BoardDisplayCueId;
      label: string;
      title: string;
      command: { type: "slide"; title: string; body?: string; kicker?: string };
      videoPath: string;
    };

export const BOARD_DISPLAY_CUES: readonly BoardDisplayCue[] = [
  {
    id: "qr",
    label: "QR code",
    title: "QR inviato",
    command: { type: "show_qr" },
  },
  {
    id: "sponsor",
    label: "Sponsor",
    title: "Sponsor in onda",
    command: {
      type: "slide",
      kicker: "Love Roulette",
      title: "SPONSOR",
      body: "Un grazie a chi rende possibile la serata",
    },
    videoPath: "/grafiche/video/cues/sponsor.mp4",
  },
  {
    id: "pausa",
    label: "Pausa",
    title: "Pausa in onda",
    command: {
      type: "slide",
      kicker: "Break",
      title: "PAUSA",
      body: "Torniamo subito",
    },
    videoPath: "/grafiche/video/cues/pausa.mp4",
  },
  {
    id: "tra5",
    label: "Tra 5′",
    title: "Tra 5 minuti in onda",
    command: {
      type: "slide",
      kicker: "Pre-show",
      title: "TRA 5 MINUTI",
      body: "Inizia lo show — prendete posto",
    },
    videoPath: "/grafiche/video/cues/tra-5-minuti.mp4",
  },
] as const;
