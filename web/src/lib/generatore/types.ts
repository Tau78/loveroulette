/**
 * Formato scambio dati con l'Editor / Generatore domande Love Roulette.
 * Il Generatore comanda: importa manche, esporta stato, invia comandi quiz.
 */

export const GENERATORE_FORMAT_ID = "love_roulette_generatore_v1";

export interface GeneratoreQuestionOption {
  id: string;
  label: string;
  sort_order?: number;
}

export interface GeneratoreQuestion {
  id: string;
  body: string;
  category: string;
  weight?: number;
  options: GeneratoreQuestionOption[];
}

export interface GeneratoreManche {
  id: string;
  order: number;
  theme_title: string;
  theme_subtitle?: string;
  questions: GeneratoreQuestion[];
}

export interface GeneratoreExportMeta {
  start_countdown_seconds?: number;
  theme_intro_seconds?: number;
  question_stem_seconds?: number;
  question_timer_seconds?: number;
  results_seconds?: number;
  next_question_seconds?: number;
}

export interface GeneratoreMancheDocument {
  format: typeof GENERATORE_FORMAT_ID;
  version: 1;
  event_code?: string;
  exported_at: string;
  manche: GeneratoreManche[];
  meta?: GeneratoreExportMeta;
}

export type GeneratoreCommand =
  | { action: "import_manche"; document: GeneratoreMancheDocument }
  | { action: "export_manche" }
  | { action: "get_quiz_state" }
  | { action: "start_quiz" }
  | { action: "advance" }
  | { action: "tick" }
  | { action: "skip_phase" }
  | { action: "finish" };

export interface GeneratoreCommandResponse {
  ok: boolean;
  error?: string;
  document?: GeneratoreMancheDocument;
  quiz?: unknown;
  runtimeState?: string;
  imported?: {
    mancheCount: number;
    questionCount: number;
  };
}
