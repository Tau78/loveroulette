# Love Roulette — Best Practices

> Modulo 05 · DevOps, sicurezza, GDPR, qualità  
> Versione: 2.0 · Giugno 2026

## 1. GDPR e privacy

### 1.1 Dati trattati

| Dato | Finalità | Base giuridica |
|------|----------|----------------|
| Email | Pre-registrazione, auth | Consenso |
| Nickname | Identificazione in sala | Esecuzione servizio evento |
| Genere | Algoritmo matching | Esecuzione servizio evento |
| Risposte quiz | Calcolo affinità | Consenso |
| Messaggi chat | Social pre-evento | Consenso |
| Voti | Svolgimento gioco | Esecuzione servizio evento |
| IP / user agent | Sicurezza, rate limit | Legittimo interesse |

### 1.2 Consensi obbligatori (pre-registrazione)

- [ ] Informativa privacy (link testo completo)
- [ ] Consenso trattamento dati per partecipazione al gioco
- [ ] Consenso chat (se abilitata per evento)
- [ ] Consenso marketing locale (opzionale, separato)

### 1.3 Retention (decisione documentata)

| Tipo dato | Retention default | Azione |
|-----------|-------------------|--------|
| Account auth | 30 giorni post-evento | Delete user Supabase Auth |
| Risposte quiz | 30 giorni | Anonymize o delete |
| Chat messages | 7 giorni post-evento | Delete (configurabile) |
| Voti aggregati | 90 giorni | Anonymize (no nick) |
| Export CSV animatore | Responsabilità cliente | Fuori piattaforma |

Job scheduled (Supabase pg_cron o Vercel cron M2): `purge_expired_events()`.

### 1.4 Diritti interessati

- **Accesso/export**: endpoint self-service o email supporto entro 30gg
- **Cancellazione**: disponibile fino a 24h post-evento via link in email
- **Portabilità**: export JSON standard

### 1.5 Minimizzazione

- Email non visibile ad altri giocatori
- Chat anonima: player_id nascosto tra pari
- Display proiettore: solo nickname, mai email

---

## 2. Moderazione chat

### 2.1 Filtri automatici

- Blocklist parole offensive (IT + varianti leet speak)
- Regex link spam
- Max lunghezza messaggio: 280 char

### 2.2 Azioni animatore

| Azione | Effetto |
|--------|---------|
| Hide | Messaggio rimosso da tutti i client |
| Highlight | Popup proiettore 10 sec |
| Ban | Player non può più inviare chat |
| Disable chat | Event-wide off |

### 2.3 Logging moderazione

Audit log: `moderator_id`, `action`, `target_message_id`, `timestamp`.

---

## 3. Sicurezza applicativa

### 3.1 Autenticazione

- Supabase Auth JWT
- Admin routes: middleware verifica `role=animator` OR `event.admin_pin`
- Player routes: JWT + membership evento

### 3.2 Rate limiting

| Endpoint | Limite |
|----------|--------|
| POST /vote | 1 per challenge per player (DB unique) |
| POST /chat | 10/min per player |
| POST /answers | 1 per question per player |
| POST /register | 5/h per IP |

Implementazione: Supabase RLS + edge middleware + optional Upstash Redis M3.

### 3.3 Input validation

- Zod schemas su tutte le API routes
- Sanitize HTML in chat (strip tags)
- Event code: regex `^[A-Z0-9]{6}$`

### 3.4 Anti-frode voti

- Voto accettato solo se: `state=finals`, voting open, player `role=audience`
- Server timestamp authoritative
- Replay protection: idempotency key per vote

---

## 4. Testing strategy

### 4.1 Unit tests

- `calculateAffinity()` — simple, weighted, category
- `selectNextPair()` — random, ranked, hybrid modes
- `aggregateVotes()` — public + jury weights
- Chat filter blocklist

### 4.2 Integration tests

- Supabase RLS: player A non legge risposte player B
- Vote unique constraint
- State machine transitions

### 4.3 E2E tests (Playwright)

Scenario **Serata completa simulata**:
1. 12 bot registrano e joinano
2. Completano quiz
3. Animatore estrae 5 coppie
4. Eliminazione → 3 finaliste
5. 4 prove + voti
6. Vincitore proclamato

### 4.4 Load test

- Tool: k6 o Artillery
- Target: 30 connessioni Realtime simultanee
- Metriche: p95 latency broadcast <500ms, 0 vote loss

---

## 5. CI/CD

### 5.1 Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]
jobs:
  lint: eslint + tsc
  test: vitest unit + integration
  e2e: playwright (main branch only)
  deploy: vercel preview / production
```

### 5.2 Environments

| Env | URL | DB |
|-----|-----|-----|
| local | localhost:3000 | Supabase local |
| staging | staging.loveroulette.it | Supabase staging project |
| production | loveroulette.it | Supabase prod |

### 5.3 Migrations

- Supabase CLI: `supabase db push` in CI staging
- Mai breaking migration senza rollback script
- Seed data: evento demo `DEMO01`

---

## 6. Monitoring

- **Vercel Analytics**: Web Vitals display route
- **Supabase Dashboard**: DB connections, Realtime peaks
- **Sentry** (M2): error tracking client + server
- **Uptime**: Better Stack ping `/api/health`

### Alerting pre-serata

- Health check fallito → SMS/email animatore
- Realtime disconnect rate >10% → warning dashboard

---

## 7. Checklist pre-deploy serata

- [ ] Evento creato con code univoco
- [ ] Domande caricate e verificate (24–27)
- [ ] Tema selezionato e testato su proiettore
- [ ] Display route testata fullscreen
- [ ] 3 dispositivi test: 1 admin, 1 player, 1 display
- [ ] WiFi sala verificato (>10 Mbps)
- [ ] Backup PIN admin annotato
- [ ] Export template CSV funzionante
- [ ] Informativa privacy linkata in registrazione
- [ ] Badge QR stampati e mappati (se M2)

---

## 8. Convenzioni codice

- TypeScript strict mode
- Conventional Commits: `feat:`, `fix:`, `docs:`
- Componenti: PascalCase, hooks: `use` prefix
- API errors: `{ error: string, code: string }` format uniforme
- No secrets in repo; `.env.local` gitignored

---

## 9. Accessibilità e inclusività

- WCAG 2.1 AA target
- Genere binario M/F v1 (requisito format); documentare estensione future
- Tono domande: divertente/ironico, mai discriminatorio (vedi 06-question-bank)
- Opt-out chat sempre disponibile (partecipazione solo quiz)

---

## 10. Riferimenti

- Architettura → [03-architecture.md](03-architecture.md)
- Test scenari → [08-test-scenarios.md](08-test-scenarios.md)
- Runbook → [07-animator-runbook.md](07-animator-runbook.md)
