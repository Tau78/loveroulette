/**
 * Hold pre-sigla sul proiettore (beat sigla / warn).
 * Copy e misura unica per anteprima Casa e overlay /display.
 *
 * Misura: kicker DisplayPhaseHero era `text-base` / `md:text-xl` (16 / 20px).
 * +50% → 24 / 30px.
 */
export const SIGLA_WARN_LINE_1 = "STIAMO PER INIZIARE";
export const SIGLA_WARN_LINE_2 = "PRENDI POSTO";

export const SIGLA_WARN_TEXT_CLASS =
  "text-[1.5rem] md:text-[1.875rem] font-semibold uppercase leading-[1.2] tracking-[0.12em] text-white";

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
