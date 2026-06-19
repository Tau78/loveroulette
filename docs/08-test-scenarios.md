# Love Roulette — Scenari Test

> Modulo 08 · QA, edge cases, simulazioni  
> Versione: 2.0 · Giugno 2026

## 1. Scenari E2E principali

### TC-001 — Happy path serata completa

**Precondizioni**: Evento DEMO01, 12 giocatori (6M/6F), domande 27.

| Step | Azione | Risultato atteso |
|------|--------|------------------|
| 1 | 12 pre-reg + join | 12 online in dashboard |
| 2 | Start quiz | Tutti vedono Q1 |
| 3 | Tutti completano quiz | State → MATCHING → 36 coppie |
| 4 | Estrazione random × 6 | 6 coppie mostrate, no duplicate |
| 5 | Eliminazione → top 3 | 3 coppie finaliste, 6 role=finalist |
| 6 | 4 prove + voto ciascuna | 6×4=24 voti audience per prova max |
| 7 | Proclama vincitore | Coppia con max voti totali |

**Priorità**: P0 · **Milestone**: M1

---

### TC-002 — Pre-registrazione e badge

| Step | Azione | Risultato atteso |
|------|--------|------------------|
| 1 | Register con nick "Marco" | Success, email inviata |
| 2 | Register stesso nick | Errore 409 duplicate |
| 3 | Join con QR badge #12 | badge_code=12, nick Marco |
| 4 | Join stesso badge altro device | Errore o takeover (config) |

**Priorità**: P0 · **Milestone**: M1/M2

---

### TC-003 — Modalità estrazione

| Modalità | Input | Expected |
|----------|-------|----------|
| Random | 10 coppie, 5 AVANTI | 5 coppie unique random |
| Classifica | rank 1-10 | Mostra rank 10,9,8... |
| Ibrido | N=3 random | 3 random poi ranked |
| Count limit | limit=4 | Stop dopo 4, skip rest |

**Priorità**: P1 · **Milestone**: M1

---

### TC-004 — Votazione

| Step | Azione | Risultato atteso |
|------|--------|------------------|
| 1 | Finalist tenta voto | 403 Forbidden |
| 2 | Audience vota Coppia 1 | Voto registrato |
| 3 | Stesso audience vota again | 409 Duplicate |
| 4 | Voting closed + voto | 403 |
| 5 | Open voting | UI switch 3 bottoni |

**Priorità**: P0 · **Milestone**: M1

---

### TC-005 — Chat e moderazione

| Step | Azione | Risultato atteso |
|------|--------|------------------|
| 1 | Invio messaggio anonimo | Altri vedono "Anonimo" |
| 2 | Animatore vede autore | Nick visibile admin |
| 3 | Messaggio blocklist | Rifiutato o masked |
| 4 | Highlight | Popup display 10s |
| 5 | Ban player | No more send |

**Priorità**: P1 · **Milestone**: M2

---

### TC-006 — Giuria pesata

**Config**: jury_enabled=true, public=0.7, jury=0.3

| Prova | Voti pubblico C1 | Giuria C1 (1-10) | Score C1 |
|-------|------------------|------------------|----------|
| dance | 8 | 9 | weighted calc |

Verifica formula aggregazione.

**Priorità**: P2 · **Milestone**: M3

---

## 2. Edge cases

### EC-001 — Disparità genere (14M / 16F)

- **Input**: 14 maschi, 16 femmine
- **Expected**: 224 coppie, matching completo, no crash
- **Rischio**: Tempo estrazione lungo → usare count limit
- **Test**: Load con 30 bot

### EC-002 — Minimo giocatori (3M / 3F)

- **Expected**: 9 coppie, top 3 = tutte le coppie possibili se count=9
- **Nota**: Finali funzionano, esperienza degradata

### EC-003 — Giocatore disconnette mid-quiz

- **Expected**: Risposte parziali salvate, può riprendere da ultima domanda
- **Realtime**: Reconnect entro 5 min mantiene sessione

### EC-004 — Giocatore disconnette mid-vote

- **Expected**: M1: voto perso; M3: coda offline sync

### EC-005 — Parità voti finali

- **Expected**: Dashboard mostra spareggio, animatore seleziona vincitore
- **Verify**: Export registra spareggio manuale

### EC-006 — Animatore doppio click AVANTI

- **Expected**: Idempotente, no doppia estrazione stessa coppia
- **Implementation**: Lock 2s o debounce server-side

### EC-007 — Quiz incompleto al timeout

- **Config**: `quiz_timeout_minutes=20`
- **Expected**: Force end, matching solo su risposte date
- **Affinity**: Denominatore = domande risposte per coppia (min comune)

### EC-008 — Branching domanda orphan

- **Input**: Branch a domanda disattivata
- **Expected**: Skip branch, log warning admin

### EC-009 — Event code invalido

- **Input**: `/s/XXXXXX` non esistente
- **Expected**: 404 pagina amichevole

### EC-010 — Concurrent admin sessions

- **Input**: 2 tab admin stesso evento
- **Expected**: Last action wins, no corrupt state (optimistic lock on state)

---

## 3. Test algoritmo affinità (unit)

```typescript
describe('calculateAffinity', () => {
  it('simple: 100% when all answers match', () => {
    expect(calc(m, f, 'simple')).toBe(100);
  });
  it('simple: 0% when no answers match', () => {
    expect(calc(m, f, 'simple')).toBe(0);
  });
  it('weighted: respects question weights', () => { /* ... */ });
  it('category: averages per category', () => { /* ... */ });
  it('handles partial answers', () => {
    // 20/27 answered, 15 match → 15/20 = 75%
  });
});
```

---

## 4. Load test scenari

### LT-001 — 30 connessioni Realtime

- 30 client subscribe `event:{id}`
- Admin broadcast 50 eventi in 5 min
- **Pass**: p95 latency <500ms, 0 disconnect >5s

### LT-002 — Vote burst

- 24 audience votano entro 3 sec
- **Pass**: tutti 24 voti persistiti, <2s response

### LT-003 — Quiz simultaneous submit

- 30 answer submit stessa domanda
- **Pass**: no deadlock, stats corrette

---

## 5. Test accessibilità

- [ ] Display leggibile a 5 metri (proiettore)
- [ ] Bottoni voto ≥48px touch target
- [ ] `prefers-reduced-motion` disabilita confetti
- [ ] Contrasto WCAG AA su tutti e 3 temi

---

## 6. Test sicurezza

| Test | Expected |
|------|----------|
| Player A legge answers Player B | 403 RLS |
| Vote senza JWT | 401 |
| XSS in chat `<script>` | Sanitized/stripped |
| SQL injection event code | Rejected validation |
| Replay vote stesso payload | 409 |

---

## 7. Regression checklist pre-release

- [ ] TC-001 pass
- [ ] TC-004 pass
- [ ] EC-006 pass
- [ ] LT-001 pass (M3)
- [ ] Migration up/down clean
- [ ] Display fullscreen Chrome + Safari iOS

---

## 8. Dati test seed

Evento: `DEMO01`
Players: `marco`, `luca`, `sofia`, `elena`, ... (6M+6F)
Admin PIN: `123456` (staging only)

Script: `npm run seed:demo`

---

## 9. Riferimenti

- Architettura → [03-architecture.md](03-architecture.md)
- Best practices → [05-best-practices.md](05-best-practices.md)
- Runbook → [07-animator-runbook.md](07-animator-runbook.md)
