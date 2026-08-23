/**
 * Tipografia pannello animatore — Geist (stack Cursor), leggibile, contrasto alto.
 */
export const ADMIN_UI = {
  /** Geist via font-sans (collegato a --font-geist-sans in globals.css) */
  font: "font-sans antialiased",

  /** Etichetta campo — 13px, case naturale */
  label: "text-[0.8125rem] font-medium leading-snug text-white/95",

  /** Titolo sezione deck — 13px semibold */
  section: "text-[0.8125rem] font-semibold leading-snug text-white",

  /** Corpo — 14px regular */
  body: "text-sm font-normal leading-snug text-white",

  /** Testo secondario — 13px */
  caption: "text-[0.8125rem] font-normal leading-snug text-white/90",

  /** Statistiche / numeri — 14px semibold */
  stat: "text-sm font-semibold tabular-nums leading-none text-white",

  /** Link testuale header */
  link: "text-[0.8125rem] font-medium text-white hover:text-primary transition-colors",

  /** Messaggi */
  error: "text-[0.8125rem] font-medium text-destructive",
  success: "text-[0.8125rem] font-medium text-primary",

  /** Input e select fissi */
  input:
    "h-9 min-h-9 text-sm font-normal text-white placeholder:text-white/45 border-2 border-white/25 bg-white/10 rounded-lg px-2.5 leading-snug",
  select:
    "h-9 min-h-9 text-sm font-medium text-white border-2 border-white/30 bg-white/10 rounded-lg px-2 leading-snug",

  /** Codice / URL — sans tabular (no mono stretto) */
  mono: "text-[0.8125rem] font-medium tabular-nums text-white/90",

  /** Nav tab inattivo */
  navIdle: "text-white/80 hover:text-white hover:bg-white/10",

  /** Nav tab attivo */
  navActive: "bg-primary/25 text-white ring-2 ring-primary/50",

  /** Pulsante fisso — 36px, 14px semibold */
  button: "h-9 min-h-9 px-3 text-sm font-semibold leading-none",

  /** Azione primaria fase */
  buttonPrimary:
    "h-9 min-h-9 w-full px-3 text-sm font-semibold leading-none shadow-[0_0_20px_rgba(236,72,153,0.25)]",
} as const;
