/** Evento browser: AdminPlayersManager → riquadro Messaggi sulla board. */
export const CASA_SIM_DEMO_CHAT_EVENT = "casa-sim-demo-chat";

export type CasaDemoChatMessage = {
  id: string;
  who: string;
  text: string;
};

const DEMO_CHAT_LINES = [
  "si parte o no?",
  "dov’è il Wi‑Fi?",
  "che energia stasera 🔥",
  "io voto a caso ahah",
  "in bocca al lupo a tutti",
  "la foto del maxi è enorme",
  "qualcuno mi passa il PIN?",
  "pronti per le domande",
  "che bella sala",
  "ho già una crush",
  "non guardate il telefonooo",
  "facciamo un brindisi",
  "chi è in prima fila?",
  "spero di matchare bene",
  "l’animatore è fortissimo",
  "musica al massimo",
  "ci sono i confetti?",
  "sto tremando dalle emozioni",
  "prossima domanda più facile please",
  "andiamoooo",
] as const;

function pickIndex(max: number, salt: number): number {
  if (max <= 0) return 0;
  const x = Math.sin(salt * 12.9898) * 43758.5453;
  return Math.floor((x - Math.floor(x)) * max);
}

/** Messaggi random firmati coi nick dei bot demo (stabili a parità di roster). */
export function buildSimDemoChatMessages(
  whoNames: string[],
  count = 8,
): CasaDemoChatMessage[] {
  const names = whoNames.map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) return [];

  const n = Math.min(Math.max(count, 1), DEMO_CHAT_LINES.length, names.length * 2);
  const usedLines = new Set<number>();
  const out: CasaDemoChatMessage[] = [];

  for (let i = 0; i < n; i += 1) {
    let lineIdx = pickIndex(DEMO_CHAT_LINES.length, names.length * 17 + i * 31);
    let guard = 0;
    while (usedLines.has(lineIdx) && guard < DEMO_CHAT_LINES.length) {
      lineIdx = (lineIdx + 1) % DEMO_CHAT_LINES.length;
      guard += 1;
    }
    usedLines.add(lineIdx);
    const who = names[pickIndex(names.length, i * 97 + 3)]!;
    out.push({
      id: `demo-chat-${i + 1}`,
      who,
      text: DEMO_CHAT_LINES[lineIdx]!,
    });
  }

  return out;
}

/** Badge bot demo TS01… / legacy TU/TD/TN. */
export function isDemoChatSimBadge(badgeCode: string | null | undefined): boolean {
  return /^T(?:S|[UDN])\d{2}$/i.test(String(badgeCode ?? "").trim());
}

export type CasaSimDemoChatDetail = {
  messages: CasaDemoChatMessage[];
};

export function dispatchSimDemoChat(messages: CasaDemoChatMessage[]) {
  if (typeof window === "undefined" || messages.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<CasaSimDemoChatDetail>(CASA_SIM_DEMO_CHAT_EVENT, {
      detail: { messages },
    }),
  );
}
