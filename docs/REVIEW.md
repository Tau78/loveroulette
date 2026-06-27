# Review Request — Master Spec v2

> **Stato**: ✅ **Review completata** — 2026-06-19. Procedere con Milestone 1 dev.

## Documento reviewato

**Master spec**: [00-master-spec-v2.md](00-master-spec-v2.md)

## Checklist rapida

1. [x] **Flusso gioco** (LOBBY → QUIZ → MATCHING → ESTRAZIONE → ELIMINAZIONE → FINALI → VINCITORE)
2. [x] **Stack** Next.js 15 + Supabase + Vercel
3. [x] **Roadmap** M1 core / M2 social / M3 polish
4. [x] **Tono domande** in [06-question-bank.md](06-question-bank.md) — divertito-ironico, 27 esempi
5. [x] **Open items** risolti in [09-decisions-workshop.md](09-decisions-workshop.md) §15:
   - [x] A) Placeholder **`loveroulette.vercel.app`** fino ad acquisto dominio
   - [x] B) **Solo PIN** animatore v1 (no auth Supabase dashboard)
   - [x] C) **Solo email** pre-reg v1 (telefono/WhatsApp dopo)
   - [x] D) **Solo super-admin** crea eventi v1
   - [x] E) **Nessun export CSV in M1** — integrazione in altro progetto

## Deliverable completati

| Item | Path |
|------|------|
| Master spec v2 | `docs/00-master-spec-v2.md` |
| Moduli 01–09 | `docs/01-*.md` … `docs/09-*.md` |
| Checklist stampabile | `docs/printable/checklist-animatore.pdf` |
| Scaffold M1 | `web/` |

## Decisioni aggiuntive (brainstorming post-review)

Documentate in [09-decisions-workshop.md](09-decisions-workshop.md) §16:

- Motore domande **animator-first**
- Unlock **Spicy L2** con conferma animatore
- **Mobile spectacle max** su smartphone giocatore
- Pool domande **50 → 100+** con bozze AI e approvazione umana

---

*Generato: 2026-06-19 · Review completata: 2026-06-19*
