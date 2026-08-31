/**
 * Hold pre-sigla sul proiettore (beat sigla / warn).
 * Copy e misura unica per anteprima Casa e overlay /display.
 *
 * Misura: segue `--lr-display-type-scale` (default 1.8 = +50% sul 1.2 precedente).
 */
export const SIGLA_WARN_LINE_1 = "STIAMO PER INIZIARE";
export const SIGLA_WARN_LINE_2 = "PRENDI POSTO";

export const SIGLA_WARN_TEXT_CLASS =
  "text-[calc(1.5rem*var(--lr-display-type-scale,1.8)/1.2)] md:text-[calc(1.875rem*var(--lr-display-type-scale,1.8)/1.2)] font-semibold uppercase leading-[1.2] tracking-[0.12em] text-white";

export const SIGLA_WARN_SLIDE = {
  type: "slide" as const,
  title: SIGLA_WARN_LINE_1,
  body: SIGLA_WARN_LINE_2,
};

export function isSiglaWarnSlide(overlay: {
  type?: string;
  title?: string;
  body?: string;
  kicker?: string;
}): boolean {
  return (
    overlay.type === "slide" &&
    overlay.title === SIGLA_WARN_LINE_1 &&
    overlay.body === SIGLA_WARN_LINE_2
  );
}
