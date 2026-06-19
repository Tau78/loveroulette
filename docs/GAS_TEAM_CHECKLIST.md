# GAS team — checklist Love Roulette

> Per la sessione Cursor su **musicpro-eventi-app**  
> Love Game web è già adattato al schema condiviso; questi task restano lato GAS/admin.

---

## Stato attuale

| Area | GAS | Love Game web |
|------|-----|---------------|
| Migration `20260624160000` | ✅ cloud | — |
| RPC `game_format` | ✅ | ✅ consumer |
| Join + session API | — | ✅ |
| Quiz API (questions/answers) | — | ✅ (pool; vedi blocker) |
| Realtime session | RLS anon da valutare | ✅ polling fallback |
| Admin dropdown `game_format` | ⏳ task 5 | — |
| Temi `graphic_themes` | ⏳ task 6 | metadata fallback |

---

## Task 5 — Dropdown `game_format` in AdminEventModal

**File:** `apps/admin/src/components/admin/AdminEventModal.tsx`  
**Tipo:** `packages/shared/src/types/admin-event.ts` → `game_format?: 'cervellone' | 'love_roulette'` (già presente)

### Cosa fare

1. **State** — aggiungere `gameFormat` (default `'cervellone'`), caricarlo da `get_animator_event_detail` / payload evento esistente (`d.game_format`).
2. **UI** — `<Select>` o radio accanto a template/tematica:
   - `cervellone` — Il Cervellone (default)
   - `love_roulette` — Love Roulette
3. **Payload** — in `buildPayload()`:
   ```ts
   payload.game_format = gameFormat;
   ```
4. **Update parziale** — su evento esistente inviare `game_format` solo se l’utente ha cambiato il campo (RPC già gestisce chiave opzionale in update).
5. **Condizionale UI** — se `game_format === 'love_roulette'`:
   - mostrare campo **Join code** → scrive `metadata.love_roulette_code` (6 char, uppercase)
   - opzionale: link preview `https://love-roulette.vercel.app/s/{code}` (placeholder dominio)
   - nascondere o disabilitare controlli Cervellone-only (`publish_cervellone`, enigma, ecc.) se non applicabili

### Verifica

- Crea evento LR dall’admin → Supabase: `game_format = love_roulette`, `metadata->>'love_roulette_code'` valorizzato
- `./scripts/run-smoke-tests.sh` — nessuna regressione admin

---

## Task 6 — Temi grafici (`graphic_themes`)

Love Game usa **3 temi UI** interni (`metadata.love_roulette.theme`):

| Love Game `ThemeId` | Uso |
|---------------------|-----|
| `dark_fuchsia` | Default serata club |
| `romantic_elegant` | Locale elegante |
| `neon_party` | Festa / neon |

MusicPro ha già `public.graphic_themes` (`slug`, `public_name`, `color_theme jsonb`, `metadata jsonb`) e `events.theme_id`.

### Opzione A — Consigliata per M1

**Doppia sorgente, priorità metadata:**

1. Seed migration GAS — 3 righe in `graphic_themes`:
   ```sql
   INSERT INTO graphic_themes (slug, public_name, metadata) VALUES
     ('love-roulette-dark-fuchsia', 'Love Roulette — Dark Fuchsia', '{"love_roulette_theme":"dark_fuchsia"}'),
     ('love-roulette-romantic', 'Love Roulette — Romantic', '{"love_roulette_theme":"romantic_elegant"}'),
     ('love-roulette-neon', 'Love Roulette — Neon Party', '{"love_roulette_theme":"neon_party"}')
   ON CONFLICT (slug) DO NOTHING;
   ```
2. In admin, quando `game_format = love_roulette`, filtrare dropdown tematiche su `slug LIKE 'love-roulette-%'` (o flag `metadata->>'module' = 'love_roulette'`).
3. Love Game web: se `events.theme_id` è valorizzato, risolvere `graphic_themes.metadata.love_roulette_theme` → CSS theme; altrimenti fallback `metadata.love_roulette.theme`.

### Opzione B — Solo metadata (zero migration temi)

Admin scrive direttamente `metadata.love_roulette.theme` nel form LR. Nessun legame a `theme_id`. Più veloce, meno integrazione grafiche MusicPro.

### Opzione C — `color_theme` condiviso

Popolare `graphic_themes.color_theme` con token CSS Love Roulette; Love Game legge token da API. Richiede endpoint o join lato web — post-M1.

**Raccomandazione:** **A** per allineamento admin esistente; **B** se serve ship entro ore.

---

## Task 7 — Evento demo DEMO01 (operativo)

Love Game ha già [`web/scripts/seed-demo-event.sql`](../web/scripts/seed-demo-event.sql) e guida [`15-test-event-setup.md`](15-test-event-setup.md).

**Azione GAS (alternativa al SQL manuale):**

Dopo task 5, creare evento test dall’admin:

- `game_format`: love_roulette  
- `love_roulette_code`: DEMO01  
- Venue reale  
- Tematica LR (opzione A) o metadata theme `dark_fuchsia`

Poi verificare join su `http://localhost:3000/s/DEMO01` (Love Game dev).

---

## Task 8 — Smoke test regressioni

```bash
cd musicpro-eventi-app
./scripts/run-smoke-tests.sh
```

Eseguire dopo task 5 e dopo eventuale migration temi.

---

## Task 9 — Blocker schema (coordinamento)

Love Game quiz API legge domande dal **pool globale**, ma `love_roulette_answers` oggi FK solo su `love_roulette_questions` (per-evento).

**Serve migration GAS (priorità media):**

```sql
-- Esempio: permettere risposte al pool
ALTER TABLE love_roulette_answers
  ADD COLUMN question_pool_id uuid REFERENCES love_roulette_question_pool(id),
  ALTER COLUMN question_id DROP NOT NULL;
-- + constraint XOR question_id / question_pool_id
```

Fino ad allora: seed domande per-evento su evento DEMO01 **oppure** migration sopra.

---

## Task 10 — Realtime anon (opzionale)

`love_roulette_sessions` ha RLS senza policy anon. Love Game usa **polling 5s** via API.

Per Realtime nativo su mobile/display:

```sql
CREATE POLICY love_roulette_sessions_public_read ON love_roulette_sessions
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
        AND e.game_format = 'love_roulette'
        AND e.is_public = true
    )
  );
```

Valutare sicurezza con product owner prima del deploy.

---

## Cosa Love Game chiede al team GAS

| Richiesta | Perché |
|-----------|--------|
| Conferma `.env` / chiavi anon + service role | Dev locale web |
| 1 evento `love_roulette` con code DEMO01 | Test join end-to-end |
| Task 5 dropdown | Creazione eventi senza SQL |
| Decisione temi A vs B | Allineamento UI |
| Migration answers↔pool (task 9) | Quiz funzionante con pool |

---

## Prompt da incollare in Cursor GAS

```
Integrazione Love Roulette — fase admin UI.

Leggi:
- docs/LOVE_ROULETTE_INTEGRATION.md
- Love Game/docs/GAS_TEAM_CHECKLIST.md (questo file)
- packages/shared/src/types/admin-event.ts (game_format già tipizzato)

Task:
1. AdminEventModal: dropdown game_format (cervellone | love_roulette), load/save via admin_upsert_event
2. Se love_roulette: campo join code → metadata.love_roulette_code (6 char)
3. (Opzionale) Migration 3 graphic_themes Love Roulette + filtro tematiche in modal
4. Creare evento test DEMO01 dall’admin
5. ./scripts/run-smoke-tests.sh

Non toccare Love Game/web — repo separato.
```

---

## Riferimenti

- Handoff: [13-platform-convergence-handoff.md](13-platform-convergence-handoff.md)
- Test setup: [15-test-event-setup.md](15-test-event-setup.md)
- Schema: `musicpro-eventi-app/docs/SCHEMA_SOURCE_OF_TRUTH.md` § Modulo Love Roulette
