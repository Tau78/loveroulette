/**
 * Segnalazione domanda dalla plancia → email all’agenzia.
 * Destinatario: AGENCY_REPORT_EMAIL (fallback LOVE_ROULETTE_AGENCY_EMAIL).
 */

export const DEFAULT_AGENCY_REPORT_EMAIL = "andreoni.mauro@gmail.com";

export function agencyReportEmail(): string {
  const fromEnv =
    process.env.AGENCY_REPORT_EMAIL?.trim() ||
    process.env.LOVE_ROULETTE_AGENCY_EMAIL?.trim();
  return fromEnv || DEFAULT_AGENCY_REPORT_EMAIL;
}

export type QuestionReportPayload = {
  eventCode: string;
  venueName?: string | null;
  questionId?: string | null;
  category: string;
  body: string;
  options: string[];
  cueIndex?: number | null;
};

export function formatQuestionReportText(p: QuestionReportPayload): string {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const opts = p.options
    .map((label, i) => `${letters[i] ?? i + 1}) ${label}`)
    .join("\n");
  const lines = [
    "Segnalazione domanda — Love Roulette",
    "",
    `Evento: ${p.eventCode}`,
    p.venueName ? `Locale: ${p.venueName}` : null,
    p.cueIndex != null ? `Posizione scaletta: Q${p.cueIndex + 1}` : null,
    p.questionId ? `ID: ${p.questionId}` : null,
    `Categoria: ${p.category || "—"}`,
    "",
    "Domanda:",
    p.body,
    "",
    "Risposte:",
    opts || "(nessuna)",
    "",
    `Inviata: ${new Date().toISOString()}`,
  ];
  return lines.filter((l) => l != null).join("\n");
}

export function buildQuestionReportMailto(p: QuestionReportPayload): string {
  const to = agencyReportEmail();
  const subject = `Love Roulette · Segnala domanda · ${p.eventCode}`;
  const body = formatQuestionReportText(p);
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Resend HTTP (opzionale). Ritorna true se inviata. */
export async function sendQuestionReportEmail(
  p: QuestionReportPayload,
): Promise<{ sent: boolean; via: "resend" | "none"; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, via: "none" };
  }

  const to = agencyReportEmail();
  const from =
    process.env.AGENCY_REPORT_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Love Roulette <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Love Roulette · Segnala domanda · ${p.eventCode}`,
        text: formatQuestionReportText(p),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        sent: false,
        via: "resend",
        error: detail || `Resend HTTP ${res.status}`,
      };
    }
    return { sent: true, via: "resend" };
  } catch (err) {
    return {
      sent: false,
      via: "resend",
      error: err instanceof Error ? err.message : "Invio email fallito",
    };
  }
}
