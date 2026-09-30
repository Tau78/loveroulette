import type { CasaBeat } from "@/lib/admin/casa-avanti";

/**
 * Overlay /display per il toggle QR della plancia.
 * - QR on (`help`) → sticky show_qr
 * - QR off in lobby casa → clear (niente QR “di default” sotto)
 * - Altri beat → null (lascia la sync slide/sigla/presenti)
 */
export function casaQrDisplayCommand(
  help: boolean,
  beat: CasaBeat,
): { type: "show_qr" } | { type: "clear" } | null {
  if (help) return { type: "show_qr" };
  if (beat === "casa") return { type: "clear" };
  return null;
}
