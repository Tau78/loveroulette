# Love Roulette — Schema DB Motore Domande Adattivo

> Modulo 11 · Estensione schema Supabase per question engine adattivo  
> Versione: 1.0 · Giugno 2026  
> Base schema: [`web/supabase/migrations/20260619000000_initial_schema.sql`](../web/supabase/migrations/20260619000000_initial_schema.sql)

---

## 1. Obiettivo

Estendere lo schema M1 (domande **per evento** in `questions`) con un **pool globale** taggabile, sessioni ordinate, stato mood della serata, slide intercalate, bozze AI e profilo emergente opzionale del giocatore.

**Principi di design:**

| Principio | Scelta |
|-----------|--------|
| Pool domande | Globale (`question_pool`), non copiato per ogni evento |
| Tag | Tabella normalizzata `question_pool_tags` + `tags` JSONB per metadati liberi |
| Compatibilità M1 | `questions` resta attiva; migrazione graduale via `event_session_slots` |
| Multi-tenant | RLS per `event_id` su tutte le tabelle runtime evento |
| Contenuto globale | Pool, template slide, tag: lettura staff; scrittura service role / super-admin |

---

## 2. Nuovi ENUM

```sql
CREATE TYPE question_source AS ENUM (
  'seed',           -- import iniziale banca domande
  'manual',         -- CRUD animatore/super-admin
  'ai_draft',       -- generato da AI, promosso da ai_question_drafts
  'event_override'  -- one-off per evento (legacy questions)
);

CREATE TYPE slot_status AS ENUM (
  'planned',        -- suggerito dal motore, non ancora mostrato
  'shown',          -- proiettato ai giocatori
  'skipped',        -- saltato (override animatore)
  'replaced'        -- sostituito da altra domanda
);

CREATE TYPE slot_origin AS ENUM (
  'engine',         -- scoring adattivo
  'animator',       -- inserimento/skip manuale
  'branch',         -- branching da risposta precedente
  'fallback'        -- riempimento quando pool esaurito
);

CREATE TYPE draft_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'promoted'        -- copiato in question_pool
);

CREATE TYPE slide_trigger_type AS ENUM (
  'mood_threshold',     -- slider supera soglia
  'event_state',        -- transizione state machine
  'slot_milestone',     -- es. ogni 5 domande
  'answer_consensus',   -- % risposta su domanda precedente
  'manual',             -- animatore
  'spicy_unlock'        -- spicy_l2_unlocked passa a true
);

CREATE TYPE spicy_level AS ENUM ('none', 'l1', 'l2');
```

---

## 3. Diagramma ER (estensione)

```mermaid
erDiagram
    events ||--o| event_mood_state : has
    events ||--o{ event_sessions : has
    event_sessions ||--o{ event_session_slots : contains
    question_pool ||--o{ question_pool_options : has
    question_pool ||--o{ question_pool_tag_map : tagged
    question_tags ||--o{ question_pool_tag_map : used_in
    question_pool ||--o{ event_session_slots : shown_as
    questions ||--o{ event_session_slots : legacy_ref
    slide_templates ||--o{ slide_triggers : fires
    slide_templates ||--o{ slide_displays : logged
    slide_triggers ||--o{ slide_displays : caused_by
    events ||--o{ slide_displays : shows
    ai_question_drafts ||--o| question_pool : promotes_to
    players ||--o| player_emergent_profile : optional
    players ||--o{ answers : submits

    question_pool {
        uuid id PK
        text body
        text category
        float weight
        jsonb tags
        spicy_level spicy_level
        question_source source
        boolean is_active
    }

    question_tags {
        uuid id PK
        text slug UK
        text label
    }

    question_pool_tag_map {
        uuid question_pool_id FK
        uuid tag_id FK
    }

    event_sessions {
        uuid id PK
        uuid event_id FK
        int session_number
        timestamptz started_at
        timestamptz ended_at
    }

    event_session_slots {
        uuid id PK
        uuid session_id FK
        int slot_order
        uuid question_pool_id FK
        slot_status status
        slot_origin origin
        timestamptz shown_at
    }

    event_mood_state {
        uuid event_id PK_FK
        jsonb sliders
        boolean spicy_l2_unlocked
        timestamptz updated_at
    }

    slide_templates {
        uuid id PK
        text slug UK
        text title
        jsonb payload
        int default_duration_ms
    }

    slide_triggers {
        uuid id PK
        uuid slide_template_id FK
        slide_trigger_type trigger_type
        jsonb condition
        int priority
    }

    slide_displays {
        uuid id PK
        uuid event_id FK
        uuid slide_template_id FK
        uuid trigger_id FK
        jsonb context
        timestamptz displayed_at
    }

    ai_question_drafts {
        uuid id PK
        text body
        jsonb options
        draft_status status
        uuid promoted_pool_id FK
    }

    player_emergent_profile {
        uuid player_id PK_FK
        jsonb traits
        text archetype
        float confidence
    }
```

---

## 4. CREATE TABLE — Pool globale domande

### 4.1 `question_pool`

Pool centralizzato: una riga = una domanda riusabile su più eventi.

```sql
CREATE TABLE question_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lifestyle'
    CHECK (category IN (
      'lifestyle', 'romantic', 'adventure',
      'values', 'fun', 'intimacy'
    )),
  weight FLOAT NOT NULL DEFAULT 1.0 CHECK (weight > 0),
  spicy_level spicy_level NOT NULL DEFAULT 'none',
  source question_source NOT NULL DEFAULT 'seed',
  -- Metadati liberi: es. {"locale":"it","tone":"ironic","min_players":10}
  tags JSONB NOT NULL DEFAULT '{}'::jsonb,
  branch_parent_id UUID REFERENCES question_pool(id) ON DELETE SET NULL,
  branch_trigger_option INT CHECK (branch_trigger_option BETWEEN 0 AND 3),
  min_mood JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- es. {"romantic":0.3,"spicy":0.0} — soglie minime slider evento
  max_uses_per_event INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_pool_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_pool_id UUID NOT NULL REFERENCES question_pool(id) ON DELETE CASCADE,
  sort_order INT NOT NULL CHECK (sort_order BETWEEN 0 AND 3),
  label TEXT NOT NULL,
  -- Tag opzionale per profilo emergente: es. "introvert", "night_owl"
  trait_hints JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (question_pool_id, sort_order)
);

CREATE INDEX idx_question_pool_category ON question_pool(category) WHERE is_active;
CREATE INDEX idx_question_pool_spicy ON question_pool(spicy_level) WHERE is_active;
CREATE INDEX idx_question_pool_tags ON question_pool USING GIN (tags);
CREATE INDEX idx_question_pool_branch ON question_pool(branch_parent_id)
  WHERE branch_parent_id IS NOT NULL;
```

### 4.2 Tag normalizzati (consigliato) + JSONB

**Approccio scelto:** tabella `question_tags` + mappa N:N. La colonna `question_pool.tags` JSONB resta per attributi non indicizzati (es. note editoriali).

```sql
CREATE TABLE question_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  -- es. 'topic', 'audience', 'mood_hint', 'exclude_if'
  tag_group TEXT NOT NULL DEFAULT 'topic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_pool_tag_map (
  question_pool_id UUID NOT NULL REFERENCES question_pool(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES question_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (question_pool_id, tag_id)
);

CREATE INDEX idx_pool_tag_map_tag ON question_pool_tag_map(tag_id);
```

**Alternative JSONB-only** (non raccomandata per filtri frequenti):

```sql
-- Solo se volume basso e nessun catalogo tag condiviso:
-- ALTER TABLE question_pool ADD COLUMN tag_slugs TEXT[] DEFAULT '{}';
-- CREATE INDEX idx_question_pool_tag_slugs ON question_pool USING GIN (tag_slugs);
```

---

## 5. CREATE TABLE — Sessioni e slot evento

### 5.1 `event_sessions`

Traccia una «run» quiz all'interno dell'evento (es. rehearsal vs live, o ripresa dopo pausa).

```sql
CREATE TABLE event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_number INT NOT NULL DEFAULT 1,
  label TEXT,
  is_rehearsal BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  UNIQUE (event_id, session_number)
);

CREATE INDEX idx_event_sessions_event ON event_sessions(event_id);
```

### 5.2 `event_session_slots`

Coda ordinata di domande per la sessione: cosa il motore ha pianificato e cosa è stato effettivamente mostrato.

```sql
CREATE TABLE event_session_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES event_sessions(id) ON DELETE CASCADE,
  slot_order INT NOT NULL,
  -- Pool (nuovo) o legacy per-event (M1)
  question_pool_id UUID REFERENCES question_pool(id) ON DELETE SET NULL,
  legacy_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  status slot_status NOT NULL DEFAULT 'planned',
  origin slot_origin NOT NULL DEFAULT 'engine',
  engine_score FLOAT,
  -- Snapshot motivazione ranking al momento del suggerimento
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  shown_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  replaced_by_slot_id UUID REFERENCES event_session_slots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, slot_order),
  CHECK (
    question_pool_id IS NOT NULL OR legacy_question_id IS NOT NULL
  )
);

CREATE INDEX idx_session_slots_session ON event_session_slots(session_id, slot_order);
CREATE INDEX idx_session_slots_pool ON event_session_slots(question_pool_id)
  WHERE question_pool_id IS NOT NULL;
CREATE INDEX idx_session_slots_status ON event_session_slots(session_id, status);
```

**Nota:** `answers.question_id` resta legato a `questions` in M1. Fase 2: aggiungere `question_pool_id` nullable su `answers` o tabella ponte `answer_pool_responses`.

---

## 6. CREATE TABLE — Stato mood evento

```sql
CREATE TABLE event_mood_state (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  -- Slider 0.0–1.0; chiavi allineate a events.config.adaptive.mood_axes
  sliders JSONB NOT NULL DEFAULT '{
    "romantic": 0.5,
    "fun": 0.5,
    "intimacy": 0.3,
    "adventure": 0.4,
    "spicy": 0.0
  }'::jsonb,
  spicy_l2_unlocked BOOLEAN NOT NULL DEFAULT false,
  -- Contatore domande spicy L1 mostrate (per unlock L2)
  spicy_l1_shown_count INT NOT NULL DEFAULT 0,
  last_slide_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES players(id) ON DELETE SET NULL
);

CREATE INDEX idx_event_mood_spicy ON event_mood_state(event_id)
  WHERE spicy_l2_unlocked = true;
```

Aggiornamento tipico: RPC `update_event_mood(event_id, delta JSONB)` chiamata dopo ogni domanda o slide, con broadcast Realtime su `event:{id}`.

---

## 7. CREATE TABLE — Slide template e trigger

### 7.1 `slide_templates`

Contenuto riusabile per intermezzi proiettore (non domande quiz).

```sql
CREATE TABLE slide_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  -- layout: full_bleed, split, quote, countdown, custom_component
  layout TEXT NOT NULL DEFAULT 'full_bleed',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- es. {"headline":"...", "subline":"...", "image_url":"...", "theme_variant":"romantic"}
  default_duration_ms INT NOT NULL DEFAULT 8000 CHECK (default_duration_ms > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.2 `slide_triggers`

Regole che abbinano condizioni → template.

```sql
CREATE TABLE slide_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_template_id UUID NOT NULL REFERENCES slide_templates(id) ON DELETE CASCADE,
  trigger_type slide_trigger_type NOT NULL,
  -- Schema dipende da trigger_type; vedi §7.3
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INT NOT NULL DEFAULT 100,
  cooldown_slots INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_slide_triggers_type ON slide_triggers(trigger_type)
  WHERE is_active;
```

**Esempi `condition`:**

| `trigger_type` | Esempio `condition` |
|----------------|---------------------|
| `mood_threshold` | `{"axis":"romantic","gte":0.7}` |
| `event_state` | `{"state":"quiz"}` |
| `slot_milestone` | `{"every_n":5}` |
| `answer_consensus` | `{"min_pct":0.6,"option_index":0}` |
| `spicy_unlock` | `{}` |
| `manual` | `{"animator_only":true}` |

### 7.3 `slide_displays`

Log append-only di slide mostrate (analytics + anti-spam cooldown).

```sql
CREATE TABLE slide_displays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL,
  slide_template_id UUID NOT NULL REFERENCES slide_templates(id) ON DELETE RESTRICT,
  trigger_id UUID REFERENCES slide_triggers(id) ON DELETE SET NULL,
  slot_id UUID REFERENCES event_session_slots(id) ON DELETE SET NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  displayed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_slide_displays_event ON slide_displays(event_id, displayed_at DESC);
CREATE INDEX idx_slide_displays_template ON slide_displays(slide_template_id);
```

---

## 8. CREATE TABLE — Bozze AI e profilo emergente

### 8.1 `ai_question_drafts`

Domande generate da LLM in attesa di approvazione umana prima dell'ingresso nel pool.

```sql
CREATE TABLE ai_question_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lifestyle',
  options JSONB NOT NULL,
  -- [{"sort_order":0,"label":"..."}, ...] — max 4
  suggested_tags TEXT[] NOT NULL DEFAULT '{}',
  spicy_level spicy_level NOT NULL DEFAULT 'none',
  prompt_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_id TEXT,
  status draft_status NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  promoted_pool_id UUID REFERENCES question_pool(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (jsonb_array_length(options) BETWEEN 2 AND 4)
);

CREATE INDEX idx_ai_drafts_status ON ai_question_drafts(status, created_at DESC);
```

**Promozione:** RPC `approve_ai_draft(draft_id)` → INSERT in `question_pool` + `question_pool_options` + tag map → UPDATE draft `status = 'promoted'`.

### 8.2 `player_emergent_profile` (opzionale)

Profilo derivato dalle risposte e dal mood medio evento; **non** sostituisce le risposte raw in `answers`.

```sql
CREATE TABLE player_emergent_profile (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  archetype TEXT,
  -- es. "romantic_adventurer", "party_animal", "slow_burn"
  traits JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- es. {"romantic":0.82,"fun":0.45,"night_owl":true}
  confidence FLOAT NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  source_answer_count INT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_emergent_archetype ON player_emergent_profile(archetype)
  WHERE archetype IS NOT NULL;
```

---

## 9. Row Level Security (RLS)

Abilitare RLS su tutte le nuove tabelle. Pattern coerente con M1 (`events_public_read` + API service role per scritture admin).

### 9.1 Contenuto globale (pool, slide, tag, draft)

| Tabella | SELECT | INSERT/UPDATE/DELETE |
|---------|--------|----------------------|
| `question_pool` | Authenticated (animatori via API) | Service role / super-admin |
| `question_pool_options` | Idem | Service role |
| `question_tags` | Public read | Service role |
| `question_pool_tag_map` | Authenticated | Service role |
| `slide_templates` | Authenticated | Service role |
| `slide_triggers` | Authenticated | Service role |
| `ai_question_drafts` | Staff only (API) | Service role + RPC review |

```sql
ALTER TABLE question_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "question_pool_read" ON question_pool
  FOR SELECT TO authenticated USING (is_active = true);

ALTER TABLE event_mood_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mood_read_event" ON event_mood_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.event_id = event_mood_state.event_id
        AND p.auth_user_id = auth.uid()
    )
  );
-- UPDATE mood: solo animatore (role) o service role via RPC SECURITY DEFINER
```

### 9.2 Dati runtime per evento

| Tabella | Giocatore | Animatore | Display |
|---------|-----------|-----------|---------|
| `event_sessions` | SELECT proprio evento | CRUD | SELECT |
| `event_session_slots` | SELECT slot `shown` | CRUD | SELECT |
| `slide_displays` | — | INSERT/SELECT | SELECT |
| `player_emergent_profile` | SELECT propria riga | SELECT evento | — (opt. aggregate anonimi) |

```sql
ALTER TABLE event_session_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots_player_read_shown" ON event_session_slots
  FOR SELECT USING (
    status = 'shown'
    AND EXISTS (
      SELECT 1 FROM event_sessions es
      JOIN players p ON p.event_id = es.event_id
      WHERE es.id = event_session_slots.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

ALTER TABLE player_emergent_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergent_own_read" ON player_emergent_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players p
      WHERE p.id = player_emergent_profile.player_id
        AND p.auth_user_id = auth.uid()
    )
  );
```

**Raccomandazione:** scoring adattivo e promozione draft via **RPC `SECURITY DEFINER`** (`suggest_next_questions`, `log_slide_display`) invocate da Next.js con service role, non esposte direttamente al client giocatore.

---

## 10. Strategia di migrazione dallo schema attuale

### Fase 0 — Preparazione (migration `20260620000000_adaptive_schema.sql`)

1. Creare ENUM e tutte le tabelle §4–§8.
2. Seed `question_tags` (slug: `romantic`, `icebreaker`, `spicy_l1`, `values`, …).
3. Seed `slide_templates` + `slide_triggers` minimi (welcome, milestone ogni 5, spicy_unlock).
4. Creare `event_sessions` retroattivamente: una sessione `session_number=1` per ogni evento esistente.

### Fase 1 — Import pool da domande evento demo

```sql
-- Esempio: copia domande seed evento demo nel pool globale (idempotente per body)
INSERT INTO question_pool (body, category, weight, source, tags)
SELECT DISTINCT ON (q.body)
  q.body, q.category, q.weight, 'seed'::question_source,
  jsonb_build_object('migrated_from_event', q.event_id::text)
FROM questions q
WHERE q.is_active
ORDER BY q.body, q.created_at;

INSERT INTO question_pool_options (question_pool_id, sort_order, label)
SELECT qp.id, qo.sort_order, qo.label
FROM questions q
JOIN question_pool qp ON qp.body = q.body
JOIN question_options qo ON qo.question_id = q.id;
```

`questions` **non** viene droppata: resta per eventi M1 e override one-off (`source = 'event_override'`).

### Fase 2 — Ponte risposte

Opzione A (minima): mantenere `answers.question_id`; al momento dello `show`, creare/agganciare riga `questions` shadow per evento che punta al pool (`events.config.pool_question_map`).

Opzione B (pulita, M3):

```sql
ALTER TABLE answers ADD COLUMN question_pool_id UUID REFERENCES question_pool(id);
ALTER TABLE answers ADD CONSTRAINT answers_one_question_ref CHECK (
  (question_id IS NOT NULL AND question_pool_id IS NULL)
  OR (question_id IS NULL AND question_pool_id IS NOT NULL)
);
```

### Fase 3 — Attivazione motore adattivo

1. `events.config.adaptive.enabled = true` per serata pilota.
2. All'avvio QUIZ: INSERT `event_mood_state` default + popolamento primi N slot via `suggest_next_questions`.
3. Dashboard animatore: mostra suggerimenti da `event_session_slots` con `status = 'planned'`.
4. Disabilitare sort_order fisso su `questions` per eventi con adaptive on.

### Fase 4 — Rollback

- Flag `events.config.adaptive.enabled = false` → flusso M1 invariato.
- Nessuna DROP fino a deprecazione completa di `questions` (post-M3).

---

## 11. Query di esempio

### 11.1 Prossime 3 domande suggerite (non ancora mostrate)

Ipotesi: sessione attiva = max `session_number` non chiusa; esclude domande già in slot `shown`/`skipped` della sessione e rispetta mood + spicy.

```sql
WITH active_session AS (
  SELECT es.id AS session_id, es.event_id
  FROM event_sessions es
  WHERE es.event_id = :event_id
    AND es.ended_at IS NULL
  ORDER BY es.session_number DESC
  LIMIT 1
),
used_pool AS (
  SELECT ess.question_pool_id
  FROM event_session_slots ess
  JOIN active_session s ON s.session_id = ess.session_id
  WHERE ess.question_pool_id IS NOT NULL
    AND ess.status IN ('shown', 'skipped', 'planned')
),
mood AS (
  SELECT ems.sliders, ems.spicy_l2_unlocked
  FROM event_mood_state ems
  WHERE ems.event_id = :event_id
)
SELECT
  qp.id,
  qp.body,
  qp.category,
  qp.weight,
  qp.spicy_level,
  (
    qp.weight
    + COALESCE((mood.sliders->>qp.category)::float, 0) * 0.5
    + CASE WHEN qp.spicy_level = 'l2' AND NOT mood.spicy_l2_unlocked THEN -999 ELSE 0 END
  ) AS engine_score
FROM question_pool qp
CROSS JOIN mood
WHERE qp.is_active
  AND qp.id NOT IN (SELECT question_pool_id FROM used_pool WHERE question_pool_id IS NOT NULL)
  AND (
    qp.spicy_level = 'none'
    OR (qp.spicy_level = 'l1')
    OR (qp.spicy_level = 'l2' AND mood.spicy_l2_unlocked)
  )
  AND (
    qp.min_mood = '{}'::jsonb
    OR NOT EXISTS (
      SELECT 1
      FROM jsonb_each_text(qp.min_mood) AS req(axis, min_val)
      WHERE COALESCE((mood.sliders->>req.axis)::float, 0) < req.min_val::float
    )
  )
ORDER BY engine_score DESC, random()
LIMIT 3;
```

**Persistenza suggerimenti** (RPC lato server):

```sql
INSERT INTO event_session_slots (
  session_id, slot_order, question_pool_id, status, origin, engine_score
)
SELECT
  :session_id,
  COALESCE((SELECT MAX(slot_order) FROM event_session_slots WHERE session_id = :session_id), 0)
    + row_number() OVER (),
  id,
  'planned',
  'engine',
  engine_score
FROM ( /* subquery sopra */ ) suggested;
```

### 11.2 Log slide display

```sql
INSERT INTO slide_displays (
  event_id,
  session_id,
  slide_template_id,
  trigger_id,
  slot_id,
  context
)
VALUES (
  :event_id,
  :session_id,
  :slide_template_id,
  :trigger_id,
  :current_slot_id,
  jsonb_build_object(
    'mood_snapshot', (SELECT sliders FROM event_mood_state WHERE event_id = :event_id),
    'animator_id', :animator_player_id
  )
)
RETURNING id, displayed_at;

-- Aggiorna timestamp mood (per cooldown slide)
UPDATE event_mood_state
SET last_slide_at = now(), updated_at = now()
WHERE event_id = :event_id;
```

**Selezione trigger candidato** (semplificata):

```sql
SELECT st.id AS template_id, tr.id AS trigger_id, tr.priority
FROM slide_triggers tr
JOIN slide_templates st ON st.id = tr.slide_template_id
JOIN event_mood_state ems ON ems.event_id = :event_id
WHERE tr.is_active AND st.is_active
  AND tr.trigger_type = 'mood_threshold'
  AND (ems.sliders->>(tr.condition->>'axis'))::float
      >= (tr.condition->>'gte')::float
  AND NOT EXISTS (
    SELECT 1 FROM slide_displays sd
    WHERE sd.event_id = :event_id
      AND sd.trigger_id = tr.id
      AND sd.displayed_at > now() - (tr.cooldown_slots || ' minutes')::interval
  )
ORDER BY tr.priority ASC
LIMIT 1;
```

---

## 12. Config evento consigliata (`events.config`)

```json
{
  "adaptive": {
    "enabled": true,
    "target_question_count": 27,
    "prefetch_slots": 5,
    "mood_axes": ["romantic", "fun", "intimacy", "adventure", "spicy"],
    "spicy_l2_after_l1_count": 3,
    "allow_ai_drafts": false
  },
  "stats_visibility": { "display": true, "players": false }
}
```

---

## 13. Riepilogo tabelle nuove

| # | Tabella | Scopo |
|---|---------|--------|
| 1 | `question_pool` | Pool globale domande adattive |
| 2 | `question_pool_options` | 4 opzioni per domanda pool |
| 3 | `question_tags` | Catalogo tag normalizzati |
| 4 | `question_pool_tag_map` | N:N pool ↔ tag |
| 5 | `event_sessions` | Sessioni quiz per evento |
| 6 | `event_session_slots` | Slot ordinati + stato show/skip |
| 7 | `event_mood_state` | Slider mood + `spicy_l2_unlocked` |
| 8 | `slide_templates` | Template slide proiettore |
| 9 | `slide_triggers` | Regole di attivazione slide |
| 10 | `slide_displays` | Log slide mostrate |
| 11 | `ai_question_drafts` | Bozze AI in approvazione |
| 12 | `player_emergent_profile` | Profilo emergente opzionale |

**ENUM nuovi:** `question_source`, `slot_status`, `slot_origin`, `draft_status`, `slide_trigger_type`, `spicy_level`.

---

## 14. Riferimenti

- Schema base M1 → [`03-architecture.md`](03-architecture.md) §3
- Categorie domande → [`06-question-bank.md`](06-question-bank.md) §2
- Feature adaptive (roadmap) → [`04-features.md`](04-features.md) §2
- Migration SQL target → `web/supabase/migrations/20260620000000_adaptive_schema.sql` (da creare)

---

*Documento generato: 2026-06-19 · Milestone adaptive engine (post-M2)*
