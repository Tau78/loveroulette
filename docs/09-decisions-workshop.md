# Love Roulette — Decisioni Aperte (Workshop)

> Documento di risoluzione gap · Fase brainstorming  
> Versione: 2.0 · Giugno 2026

Questo documento registra le domande residue emerse durante il brainstorming e le **decisioni prese** (con input utente dove disponibile, default documentati altrimenti).

---

## 1. Tono domande quiz

**Domanda**: Esplicito vs ironico vs romantico?

**Decisione**: **Divertito-ironico**, mai volgare. Adatto a 18+ in locale pubblico.  
**Rationale**: Coerente con prove palco (Kamasutra mimato, tono leggero).  
**Owner**: Content team / cliente locale approva set prima serata.  
**Ref**: [06-question-bank.md](06-question-bank.md)

---

## 2. Regole spareggio

**Domanda**: Parità voti finali — animatore, prova extra, o random?

**Decisione utente**: Spareggio **manuale animatore** (default).  
**Alternativa configurabile**: Prova extra sudden death.  
**Singola prova**: Punti divisi ex-aequo.  
**Ref**: [01-game-design.md](01-game-design.md) §5

---

## 3. Retention GDPR

**Domanda**: Quanto tempo conservare dati post-evento?

**Decisione utente**: **GDPR completo** + moderazione.  
**Default retention**:
- Dati personali: 30 giorni → delete
- Chat: 7 giorni → delete  
- Voti aggregati anonimi: 90 giorni  
**Ref**: [05-best-practices.md](05-best-practices.md) §1.3

---

## 4. Stack tecnologico

**Domanda**: Next.js+Supabase vs alternative?

**Decisione**: **Next.js 15 + Supabase + Vercel** (raccomandazione accettata).  
**Rationale**: Realtime nativo, RLS multi-tenant, costo basso, PWA.  
**Ref**: [03-architecture.md](03-architecture.md)

---

## 5. Deploy modello

**Domanda**: Single-tenant vs multi-tenant vs local?

**Decisione utente**: **Per-serata URL** `loveroulette.it/s/{code}`.  
**Implementazione**: Tabella `events` con code univoco; no multi-brand v1.

---

## 6. Chat in v1 vs milestone

**Domanda**: Chat full in v1 o posticipata?

**Decisione utente**: Feature **completa** richiesta; **sviluppo M2** (dopo core game M1).  
**Documentazione**: Spec completa in v2 docs, implementazione phased.

---

## 7. Domande — tutte le modalità

**Domanda**: Quale modello domande?

**Decisione utente**: **Tutte implementate** — fisso, CRUD, branching, realtime override.  
**Priorità dev**: Fisso M1 → CRUD+override M2 → Branching M2.

---

## 8. Giuria opzionale

**Domanda**: Come funziona la giuria?

**Decisione utente**: **Pubblico + giuria opzionale**, pesi configurabili per serata.  
**Default pesi**: 70% pubblico / 30% giuria.  
**Dev**: Milestone M3.

---

## 9. Stats live — visibilità

**Domanda**: Dove mostrare percentuali risposte?

**Decisione utente**: **Tutte configurabili** (dashboard, proiettore, feedback giocatore).  
**Default serata**: dashboard ON, proiettore OFF, player feedback ON.

---

## 10. Badge fisico

**Domanda**: Digitale vs fisico?

**Decisione utente**: **Badge fisico + QR** collegato a profilo.  
**Dev**: Milestone M2. Template stampabile in roadmap.

---

## 11. Connettività

**Domanda**: Online only vs offline?

**Decisione utente**: **Hybrid** — cloud primary + coda voti offline (M3).

---

## 12. Scale target

**Decisione utente**: **Piccola** — fino a 30 smartphone (~15M+15F).  
**Implicazione**: No sharding, Supabase free/pro tier sufficiente.

---

## 13. Lingua

**Decisione utente**: **Solo italiano** v1. Architettura i18n non prioritaria.

---

## 14. Temi UI

**Decisione utente**: 3 temi selezionabili — Dark Fuchsia, Romantic Elegant, Neon Party.

---

## 15. Review utente — risolto (2026-06-19)

| # | Domanda | **Decisione** |
|---|---------|---------------|
| A | Dominio produzione | Placeholder **`loveroulette.vercel.app`** fino ad acquisto dominio `loveroulette.it` |
| B | Accesso dashboard animatore | **Solo PIN** (6 cifre per evento) in v1 — **nessuna auth Supabase** per animatore |
| C | Pre-registrazione | **Solo email** v1; telefono / WhatsApp in milestone successiva |
| D | Creazione eventi | **Solo super-admin** in v1; self-service animatori previsto M3 |
| E | Export CSV | **Nessun export in M1**; integrazione export in altro progetto in seguito |

---

## 16. Brainstorming post-review (2026-06-19)

| Area | Decisione |
|------|-----------|
| Motore domande | **Animator-first** — controllo flusso domande centrato sull'animatore (override, skip, pacing live) |
| Livello piccante | **Spicy L2** sbloccabile con **conferma esplicita** animatore prima di mostrare domande L2 |
| UX mobile | **Mobile spectacle max** — priorità massima a effetti visivi e feedback su smartphone giocatore |
| Question pool | Espansione **50 → 100+** domande; bozze generate con AI, **approvazione umana** prima dell'inclusione nel pool |

---

## 17. Stato workshop

- [x] Tono domande
- [x] Spareggio
- [x] Retention GDPR
- [x] Stack e deploy
- [x] Chat scope
- [x] Modello domande
- [x] Giuria
- [x] Stats visibility
- [x] Badge
- [x] Connectivity
- [x] Domande A–E §15 — **risolte 2026-06-19**
- [x] Brainstorming post-review §16
