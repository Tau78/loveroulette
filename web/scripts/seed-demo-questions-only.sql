-- Love Roulette — demo question pool only (Q1–Q5)
--
-- Idempotent: safe to re-run; skips rows already tagged q01–q05.
-- Run in Supabase SQL Editor (project fvxdghqpavdcohczrvsc).
-- Source text: docs/06-question-bank.md

begin;

-- Q1 — lifestyle
insert into public.love_roulette_question_pool (body, category, weight, source, is_active, tags)
select
  'La serata ideale per te è...',
  'lifestyle',
  1.0,
  'seed',
  true,
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
insert into public.love_roulette_question_pool (body, category, weight, source, is_active, tags)
select
  'Come ti prepari per uscire?',
  'lifestyle',
  1.0,
  'seed',
  true,
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
insert into public.love_roulette_question_pool (body, category, weight, source, is_active, tags)
select
  'Il tuo piatto preferito per un primo appuntamento è...',
  'lifestyle',
  1.0,
  'seed',
  true,
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
insert into public.love_roulette_question_pool (body, category, weight, source, is_active, tags)
select
  'Domenica mattina tipica?',
  'lifestyle',
  1.0,
  'seed',
  true,
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
insert into public.love_roulette_question_pool (body, category, weight, source, is_active, tags)
select
  'In vacanza preferisci...',
  'lifestyle',
  1.0,
  'seed',
  true,
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

-- Verify:
-- select tags->>'id' as qid, body, is_active
-- from public.love_roulette_question_pool
-- where tags->>'id' in ('q01','q02','q03','q04','q05')
-- order by tags->>'id';
