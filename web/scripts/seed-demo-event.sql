-- Love Roulette — demo event seed (MusicPro Supabase)
--
-- Target project: fvxdghqpavdcohczrvsc (shared MusicPro Eventi)
-- Canonical schema: musicpro-eventi-app/supabase/migrations/20260624160000_love_roulette_module.sql
--
-- Run as service_role / postgres in Supabase SQL Editor or via psql.
-- Do NOT commit Supabase keys or paste them into this file.
--
-- Before running:
--   1. Pick a venue_id from your database (required FK on public.events):
--        SELECT id, name, city FROM public.venues ORDER BY name LIMIT 10;
--   2. Replace the placeholder below OR use Path A to patch an existing event.
--   3. Choose Path A (update) OR Path B (insert) — not both.

begin;

-- ---------------------------------------------------------------------------
-- Config — edit these values
-- ---------------------------------------------------------------------------

-- REQUIRED for Path B (insert). Copy a real UUID from public.venues:
-- Example only — replace before run:
--   :venue_id  →  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

do $$
declare
  v_venue_id uuid := null;  -- SET THIS for Path B, e.g. '...'::uuid
  v_event_id uuid := null;  -- SET THIS for Path A, or leave null to use Path B
  v_join_code text := 'DEMO01';
  v_demo_title text := 'Love Roulette — Demo';
  v_animator_pin text := '123456';
begin
  -- -------------------------------------------------------------------------
  -- Path A — Patch an EXISTING MusicPro event (recommended if you already have one)
  -- -------------------------------------------------------------------------
  -- Uncomment and set v_event_id to a real events.id, then skip Path B block.

  -- v_event_id := '00000000-0000-0000-0000-000000000001'::uuid;

  if v_event_id is not null then
    update public.events
    set
      game_format = 'love_roulette',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'love_roulette_code', v_join_code,
        'love_roulette_title', v_demo_title,
        'animator_pin', v_animator_pin,
        'love_roulette', jsonb_build_object(
          'theme', 'dark_fuchsia',
          'extraction_mode', 'random',
          'challenge_order', jsonb_build_array('dance', 'kiss', 'declaration', 'kamasutra'),
          'stats_visibility', jsonb_build_object(
            'animator_dashboard', true,
            'projector', false,
            'player_feedback', true
          ),
          'chat_enabled', true,
          'chat_anonymous', true,
          'jury_enabled', false,
          'question_mode', 'dynamic'
        )
      ),
      updated_at = now()
    where id = v_event_id;

    if not found then
      raise exception 'Path A: event % not found', v_event_id;
    end if;

    raise notice 'Path A: updated event % with join code %', v_event_id, v_join_code;
  else
    -- -----------------------------------------------------------------------
    -- Path B — Insert a minimal demo event (requires v_venue_id)
    -- -----------------------------------------------------------------------
    if v_venue_id is null then
      raise exception
        'Set v_venue_id in this block (SELECT id FROM venues LIMIT 1) or use Path A with v_event_id';
    end if;

    insert into public.events (
      legacy_event_id,
      event_date,
      event_time,
      venue_id,
      status,
      booking_status,
      game_format,
      is_public,
      is_bookable_online,
      notes_rounds,
      metadata
    ) values (
      'LR-DEMO-' || floor(extract(epoch from now()) * 1000)::text,
      current_date + interval '7 days',
      '21:30'::time,
      v_venue_id,
      'assigned',
      'open',
      'love_roulette',
      false,
      false,
      'Love Roulette demo',
      jsonb_build_object(
        'love_roulette_code', v_join_code,
        'love_roulette_title', v_demo_title,
        'animator_pin', v_animator_pin,
        'love_roulette', jsonb_build_object(
          'theme', 'dark_fuchsia',
          'extraction_mode', 'random',
          'challenge_order', jsonb_build_array('dance', 'kiss', 'declaration', 'kamasutra'),
          'stats_visibility', jsonb_build_object(
            'animator_dashboard', true,
            'projector', false,
            'player_feedback', true
          ),
          'chat_enabled', true,
          'chat_anonymous', true,
          'jury_enabled', false,
          'question_mode', 'dynamic'
        )
      )
    )
    returning id into v_event_id;

    raise notice 'Path B: created event % with join code %', v_event_id, v_join_code;
  end if;

  -- -------------------------------------------------------------------------
  -- Session — lobby state (required for /s/DEMO01 runtime display)
  -- -------------------------------------------------------------------------
  insert into public.love_roulette_sessions (
    event_id,
    session_number,
    label,
    runtime_state,
    is_rehearsal
  ) values (
    v_event_id,
    1,
    'demo',
    'lobby',
    true
  )
  on conflict (event_id, session_number) do update
  set
    runtime_state = 'lobby',
    label = excluded.label,
    ended_at = null;

  -- Mood sliders (optional; also auto-created on first player join)
  insert into public.love_roulette_mood_state (event_id)
  values (v_event_id)
  on conflict (event_id) do nothing;

  raise notice 'Session + mood_state ready for event %', v_event_id;
end $$;

-- ---------------------------------------------------------------------------
-- Optional — sample question pool (first 5 from docs/06-question-bank.md)
-- Global pool rows; safe to re-run (skips existing tags->id).
-- ---------------------------------------------------------------------------

-- Q1 — lifestyle
insert into public.love_roulette_question_pool (body, category, weight, source, tags)
select
  'La serata ideale per te è...',
  'lifestyle',
  1.0,
  'seed',
  '{"id":"q01","locale":"it","pool_version":"pool_v2026_06"}'::jsonb
where not exists (
  select 1 from public.love_roulette_question_pool where tags->>'id' = 'q01'
);

insert into public.love_roulette_question_pool_options (question_pool_id, sort_order, label)
select p.id, o.sort_order, o.label
from public.love_roulette_question_pool p
cross join (values
  (0, 'Discoteca fino all''alba'),
  (1, 'Cena romantica a lume di candela'),
  (2, 'Serata Netflix sul divano'),
  (3, 'Avventura all''aperto')
) as o(sort_order, label)
where p.tags->>'id' = 'q01'
  and not exists (
    select 1 from public.love_roulette_question_pool_options x
    where x.question_pool_id = p.id
  );

-- Q2 — lifestyle
insert into public.love_roulette_question_pool (body, category, weight, source, tags)
select
  'Come ti prepari per uscire?',
  'lifestyle',
  1.0,
  'seed',
  '{"id":"q02","locale":"it","pool_version":"pool_v2026_06"}'::jsonb
where not exists (
  select 1 from public.love_roulette_question_pool where tags->>'id' = 'q02'
);

insert into public.love_roulette_question_pool_options (question_pool_id, sort_order, label)
select p.id, o.sort_order, o.label
from public.love_roulette_question_pool p
cross join (values
  (0, 'Ore davanti allo specchio'),
  (1, 'Dieci minuti e via'),
  (2, 'Chiedo consiglio a un amico'),
  (3, 'Dipende dall''umore')
) as o(sort_order, label)
where p.tags->>'id' = 'q02'
  and not exists (
    select 1 from public.love_roulette_question_pool_options x
    where x.question_pool_id = p.id
  );

-- Q3 — lifestyle
insert into public.love_roulette_question_pool (body, category, weight, source, tags)
select
  'Il tuo piatto preferito per un primo appuntamento è...',
  'lifestyle',
  1.0,
  'seed',
  '{"id":"q03","locale":"it","pool_version":"pool_v2026_06"}'::jsonb
where not exists (
  select 1 from public.love_roulette_question_pool where tags->>'id' = 'q03'
);

insert into public.love_roulette_question_pool_options (question_pool_id, sort_order, label)
select p.id, o.sort_order, o.label
from public.love_roulette_question_pool p
cross join (values
  (0, 'Pizza e birra'),
  (1, 'Sushi elegante'),
  (2, 'Cucina casalinga'),
  (3, 'Tapas da condividere')
) as o(sort_order, label)
where p.tags->>'id' = 'q03'
  and not exists (
    select 1 from public.love_roulette_question_pool_options x
    where x.question_pool_id = p.id
  );

-- Q4 — lifestyle
insert into public.love_roulette_question_pool (body, category, weight, source, tags)
select
  'Domenica mattina tipica?',
  'lifestyle',
  1.0,
  'seed',
  '{"id":"q04","locale":"it","pool_version":"pool_v2026_06"}'::jsonb
where not exists (
  select 1 from public.love_roulette_question_pool where tags->>'id' = 'q04'
);

insert into public.love_roulette_question_pool_options (question_pool_id, sort_order, label)
select p.id, o.sort_order, o.label
from public.love_roulette_question_pool p
cross join (values
  (0, 'Sport o passeggiata'),
  (1, 'Dormire fino a mezzogiorno'),
  (2, 'Brunch con amici'),
  (3, 'Progetti creativi')
) as o(sort_order, label)
where p.tags->>'id' = 'q04'
  and not exists (
    select 1 from public.love_roulette_question_pool_options x
    where x.question_pool_id = p.id
  );

-- Q5 — lifestyle
insert into public.love_roulette_question_pool (body, category, weight, source, tags)
select
  'In vacanza preferisci...',
  'lifestyle',
  1.0,
  'seed',
  '{"id":"q05","locale":"it","pool_version":"pool_v2026_06"}'::jsonb
where not exists (
  select 1 from public.love_roulette_question_pool where tags->>'id' = 'q05'
);

insert into public.love_roulette_question_pool_options (question_pool_id, sort_order, label)
select p.id, o.sort_order, o.label
from public.love_roulette_question_pool p
cross join (values
  (0, 'Mare e relax totale'),
  (1, 'Città d''arte e musei'),
  (2, 'Trekking e natura'),
  (3, 'Feste e nightlife')
) as o(sort_order, label)
where p.tags->>'id' = 'q05'
  and not exists (
    select 1 from public.love_roulette_question_pool_options x
    where x.question_pool_id = p.id
  );

commit;

-- ---------------------------------------------------------------------------
-- Verify (run after commit)
-- ---------------------------------------------------------------------------
-- select e.id, e.game_format, e.event_date, v.name as venue,
--        e.metadata->>'love_roulette_code' as join_code,
--        e.metadata->'love_roulette'->>'theme' as theme
-- from public.events e
-- join public.venues v on v.id = e.venue_id
-- where e.metadata->>'love_roulette_code' = 'DEMO01';
--
-- select s.event_id, s.session_number, s.runtime_state, s.label
-- from public.love_roulette_sessions s
-- join public.events e on e.id = s.event_id
-- where e.metadata->>'love_roulette_code' = 'DEMO01';
--
-- select tags->>'id' as qid, body, category
-- from public.love_roulette_question_pool
-- where tags->>'id' in ('q01','q02','q03','q04','q05')
-- order by tags->>'id';
