import {
  GENERATORE_FORMAT_ID,
  type GeneratoreMancheDocument,
} from "@/lib/generatore/types";

export type CasaQuestion = {
  id: string;
  text: string;
  options: [string, string, string, string];
};

export const DEFAULT_CASA_QUESTIONS: CasaQuestion[] = [
  {
    id: "q1",
    text: "In vacanza dove andate?",
    options: ["Mare", "Montagna", "Città", "Casa"],
  },
  {
    id: "q2",
    text: "La prima cosa che noti?",
    options: ["Sorriso", "Occhi", "Voce", "Stile"],
  },
  {
    id: "q3",
    text: "Sabato sera ideale?",
    options: ["Disco", "Cena", "Divano", "Viaggio"],
  },
];

const storageKey = (eventCode: string) =>
  `lr_casa_questions_${eventCode.toUpperCase()}`;

function fourOptions(raw: unknown): [string, string, string, string] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const labels = raw.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && "label" in item) {
      return String((item as { label: unknown }).label ?? "");
    }
    return "";
  });
  if (labels.some((label) => !label.trim())) return null;
  return [labels[0], labels[1], labels[2], labels[3]];
}

export function questionsFromDocument(
  document: GeneratoreMancheDocument,
): CasaQuestion[] {
  if (document.format !== GENERATORE_FORMAT_ID) {
    throw new Error(`Formato non supportato: ${String(document.format)}`);
  }
  if (document.version !== 1) {
    throw new Error(`Versione non supportata: ${String(document.version)}`);
  }
  if (!Array.isArray(document.manche) || document.manche.length === 0) {
    throw new Error("Nessuna manche nel documento.");
  }
  return document.manche
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((manche) =>
      manche.questions.map((question) => {
        const options = fourOptions(question.options);
        if (!options) {
          throw new Error(`Domanda ${question.id}: servono 4 opzioni.`);
        }
        return {
          id: question.id || `q-${crypto.randomUUID()}`,
          text: question.body.trim(),
          options,
        };
      }),
    );
}

export function documentFromQuestions(
  eventCode: string,
  questions: CasaQuestion[],
): GeneratoreMancheDocument {
  return {
    format: GENERATORE_FORMAT_ID,
    version: 1,
    event_code: eventCode.toUpperCase(),
    exported_at: new Date().toISOString(),
    manche: [
      {
        id: "casa-1",
        order: 1,
        theme_title: "Love Roulette",
        questions: questions.map((question, index) => ({
          id: question.id,
          body: question.text.trim(),
          category: "lifestyle",
          options: question.options.map((label, i) => ({
            id: `${question.id}-${i}`,
            label,
            sort_order: i,
          })),
        })),
      },
    ],
  };
}

export function parseQuestionsFile(text: string): CasaQuestion[] {
  const parsed = JSON.parse(text) as unknown;
  if (
    parsed &&
    typeof parsed === "object" &&
    "format" in parsed &&
    (parsed as GeneratoreMancheDocument).format === GENERATORE_FORMAT_ID
  ) {
    return questionsFromDocument(parsed as GeneratoreMancheDocument);
  }
  if (Array.isArray(parsed)) {
    const next = parsed.map((row, index): CasaQuestion => {
      const rec = row as { id?: string; text?: string; body?: string; options?: unknown };
      const options = fourOptions(rec.options);
      const textValue = (rec.text ?? rec.body ?? "").trim();
      if (!textValue || !options) {
        throw new Error(`Riga ${index + 1}: testo e 4 opzioni obbligatori.`);
      }
      return { id: rec.id || `q-${index + 1}`, text: textValue, options };
    });
    if (!next.length) throw new Error("Nessuna domanda nel file.");
    return next;
  }
  throw new Error("Formato non riconosciuto.");
}

export function loadQuestions(eventCode: string): CasaQuestion[] {
  if (typeof window === "undefined") return DEFAULT_CASA_QUESTIONS;
  try {
    const raw = localStorage.getItem(storageKey(eventCode));
    if (!raw) return DEFAULT_CASA_QUESTIONS;
    return parseQuestionsFile(raw);
  } catch {
    return DEFAULT_CASA_QUESTIONS;
  }
}

export function saveQuestions(eventCode: string, questions: CasaQuestion[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    storageKey(eventCode),
    JSON.stringify(documentFromQuestions(eventCode, questions)),
  );
}

export function blankQuestion(): CasaQuestion {
  return {
    id: `q-${Date.now()}`,
    text: "",
    options: ["", "", "", ""],
  };
}
