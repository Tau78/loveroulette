# Love Roulette — Test event setup (DEMO01)

> Modulo 15 · Seed demo event on shared MusicPro Supabase  
> Join URL: `/s/DEMO01`

Use this guide to stand up a local Love Game web app against the **shared MusicPro Supabase** project and verify the player join flow.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Love Roulette migration applied | `20260624160000_love_roulette_module.sql` in `musicpro-eventi-app/supabase/migrations/` |
| Supabase project access | Project `fvxdghqpavdcohczrvsc` (MusicPro Eventi Pro) |
| At least one venue | `public.events.venue_id` is **NOT NULL** — you must pick a real venue |
| Node.js 20+ | For the Next.js app in `web/` |

---

## 1. Environment variables

From the repo root:

```bash
cd web
cp .env.example .env.local
```

Edit `web/.env.local` with credentials from the Supabase dashboard (**Settings → API**). Use the **anon** and **service_role** keys for project `fvxdghqpavdcohczrvsc`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fvxdghqpavdcohczrvsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security:** never commit `.env.local` or paste keys into SQL files, docs, or chat logs.

The app resolves events with:

- `events.game_format = 'love_roulette'`
- `events.metadata->>'love_roulette_code'` (6-char slug, e.g. `DEMO01`)
- Runtime state from `love_roulette_sessions.runtime_state`

---

## 2. Pick a `venue_id`

In **Supabase → SQL Editor**, run:

```sql
SELECT id, name, city FROM public.venues ORDER BY name LIMIT 10;
```

Copy one `id` UUID — you will need it for the seed script (Path B) or to confirm the venue on an existing event (Path A).

---

## 3. Run the seed script

**File:** [`web/scripts/seed-demo-event.sql`](../web/scripts/seed-demo-event.sql)

### Option A — Patch an existing event (recommended)

1. Open the SQL file and, inside the `DO $$` block, set:

   ```sql
   v_event_id := '<your-existing-events-id>'::uuid;
   ```

2. Leave `v_venue_id` as `null`.

3. Run the full script in Supabase SQL Editor (or via `psql` with a DB connection string from **Settings → Database**).

The script sets:

- `game_format = 'love_roulette'`
- `metadata.love_roulette_code = 'DEMO01'`
- `metadata.love_roulette` with `theme: dark_fuchsia` and default game config
- `metadata.animator_pin = '123456'` (animator dashboard demo)
- `love_roulette_sessions` row with `runtime_state = 'lobby'`
- Optional: 5 sample rows in `love_roulette_question_pool` (Q1–Q5 from [06-question-bank.md](06-question-bank.md))

### Option B — Insert a new minimal event

1. Set `v_venue_id` to the UUID from step 2.
2. Leave `v_event_id` as `null`.
3. Run the script.

### Verify

```sql
SELECT e.id, e.game_format, e.metadata->>'love_roulette_code' AS join_code,
       e.metadata->'love_roulette'->>'theme' AS theme,
       s.runtime_state
FROM public.events e
LEFT JOIN public.love_roulette_sessions s ON s.event_id = e.id AND s.session_number = 1
WHERE e.metadata->>'love_roulette_code' = 'DEMO01';
```

Expected: one row, `join_code = DEMO01`, `theme = dark_fuchsia`, `runtime_state = lobby`.

**Verify questions (pool Q1–Q5):**

If `GET /api/events/DEMO01/questions` returns `"questions":[]`, the global pool was never seeded. Run [`web/scripts/seed-demo-questions-only.sql`](../web/scripts/seed-demo-questions-only.sql) in Supabase SQL Editor (idempotent), or the pool block at the end of [`seed-demo-event.sql`](../web/scripts/seed-demo-event.sql).

```sql
SELECT tags->>'id' AS qid, body, is_active
FROM public.love_roulette_question_pool
WHERE tags->>'id' IN ('q01','q02','q03','q04','q05')
ORDER BY tags->>'id';
```

Expected: 5 rows, all `is_active = true`.

With the dev server running (`npm run dev` or `npm run dev:lan` on port 3001):

```bash
curl -s http://localhost:3001/api/events/DEMO01/questions | jq '{source, count: (.questions | length), first: .questions[0].body}'
```

Expected after pool seed: `"source":"pool"`, `"count":5`, first body *La serata ideale per te è...*.  
In local development only, if the pool is still empty the API falls back to 5 inline demo questions (same text as Q1–Q5).

---

## 4. Start the web app

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000/s/DEMO01](http://localhost:3000/s/DEMO01).

You should see the Love Roulette landing page with event title, code **DEMO01**, and state **lobby**.

---

## 5. Join flow (manual test)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/s/DEMO01` | Landing with “Pre-registrati” and “Entra in sala” |
| 2 | Click **Entra in sala** → `/s/DEMO01/play` | Join form (nickname, gender, optional badge) |
| 3 | Enter nickname + gender, submit | POST `/api/events/DEMO01/join` → success |
| 4 | After join | “Ciao, {nickname}!” lobby screen, state **Lobby** |
| 5 | (Optional) Open `/admin/DEMO01` | Animator dashboard (PIN `123456` if seeded) |
| 6 | (Optional) Open `/s/DEMO01/display` | Projector display route |

Join creates a row in `love_roulette_participants`. If no session existed, the API would create one; the seed script pre-creates session `1` in `lobby`.

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| “Evento non trovato” on `/s/DEMO01` | Missing/wrong metadata or `game_format` | Re-run seed Path A/B; verify query in §3 |
| SQL error “Set v_venue_id…” | Path B without venue | Set `v_venue_id` or switch to Path A |
| SQL FK error on `venue_id` | Invalid venue UUID | Re-run venue query in §2 |
| Join returns 503 | Missing `SUPABASE_SERVICE_ROLE_KEY` or RLS | Check `.env.local`; restart dev server |
| Join 409 “Nickname già in uso” | Duplicate nickname on same event | Use another nickname or delete test participant |
| Wrong theme | Config not in metadata | Ensure `metadata.love_roulette.theme` is `dark_fuchsia` |

---

## 7. Cleanup (optional)

```sql
-- Replace with your demo event id
DELETE FROM public.events WHERE metadata->>'love_roulette_code' = 'DEMO01';
-- Cascades: love_roulette_sessions, participants, etc.

-- Pool rows are global; remove only if you want a clean pool:
-- DELETE FROM public.love_roulette_question_pool WHERE tags->>'id' IN ('q01','q02','q03','q04','q05');
```

---

## Related docs

- [13-platform-convergence-handoff.md](13-platform-convergence-handoff.md) — shared Supabase model
- [06-question-bank.md](06-question-bank.md) — full question pool source
- [web/.env.example](../web/.env.example) — env template (no secrets)
