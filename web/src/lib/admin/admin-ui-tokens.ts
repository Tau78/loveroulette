/**
 * Tipografia e controlli fissi per il pannello animatore.
 * Un solo font (Geist/sans), contrasto alto — niente grigi spenti.
 */
export const ADMIN_UI = {
  /** Font unico console animatore */
  font: "font-sans",

  /** Etichetta campo / kicker — 12px */
  label: "text-xs font-semibold uppercase tracking-wide text-white",

  /** Titolo sezione deck — 12px */
  section: "text-xs font-bold uppercase tracking-[0.14em] text-white",

  /** Corpo — 14px */
  body: "text-sm font-medium text-white",

  /** Testo secondario leggibile — 12px bianco 90% */
  caption: "text-xs font-medium text-white/90",

  /** Statistiche / numeri — 14px bold */
  stat: "text-sm font-bold tabular-nums text-white",

  /** Link testuale header */
  link: "text-xs font-semibold text-white hover:text-primary transition-colors",

  /** Messaggi */
  error: "text-xs font-medium text-destructive",
  success: "text-xs font-medium text-primary",

  /** Input e select fissi */
  input:
    "h-9 min-h-9 text-sm font-medium text-white placeholder:text-white/50 border-2 border-white/25 bg-white/10 rounded-lg px-2.5",
  select:
    "h-9 min-h-9 text-sm font-semibold text-white border-2 border-white/30 bg-white/10 rounded-lg px-2",

  /** Codice / URL */
  mono: "font-mono text-xs font-medium text-white/90",

  /** Nav tab inattivo */
  navIdle: "text-white/75 hover:text-white hover:bg-white/10",

  /** Nav tab attivo */
  navActive: "bg-primary/25 text-white ring-2 ring-primary/50",

  /** Pulsante fisso — 36px, 14px bold */
  button:
    "h-9 min-h-9 px-3 text-sm font-bold uppercase tracking-wide",

  /** Azione primaria fase — stessa altezza, più enfasi */
  buttonPrimary:
    "h-9 min-h-9 w-full px-3 text-sm font-bold uppercase tracking-[0.1em] shadow-[0_0_20px_rgba(236,72,153,0.25)]",
} as const;
