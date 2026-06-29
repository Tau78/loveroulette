-- Cervellone event deduplication + anti-duplicate constraint
--
-- Target: MusicPro Supabase Pro (fvxdghqpavdcohczrvsc)
-- Apply via: musicpro-eventi-app/supabase/migrations/ (canonical) OR SQL Editor (one-off cleanup)
--
-- Run order:
--   1. DIAGNOSTIC queries (read-only) — review output before mutating
--   2. CLEANUP block — merges duplicate rows (keeps best candidate)
--   3. CONSTRAINT block — prevents future duplicates
--
-- Requires: service_role or postgres. Review in staging first if available.

-- =============================================================================
-- 1. DIAGNOSTIC — duplicate cervellone events (same venue + date)
-- =============================================================================

-- Pairs/groups with more than one active row
select
  e.venue_id,
  v.name as venue_name,
  e.event_date,
  count(*) as row_count,
  array_agg(e.id order by e.updated_at desc nulls last) as event_ids,
  array_agg(e.status order by e.updated_at desc nulls last) as statuses,
  array_agg(coalesce(e.metadata->>'google_calendar_event_id', '') order by e.updated_at desc nulls last) as gcal_ids
from public.events e
join public.venues v on v.id = e.venue_id
where e.game_format = 'cervellone'
  and e.status not in ('cancelled', 'deleted', 'draft')
group by e.venue_id, v.name, e.event_date
having count(*) > 1
order by e.event_date desc, v.name;

-- Rows that would be KEPT vs DELETED by cleanup (dry-run)
with ranked as (
  select
    e.id,
    e.venue_id,
    e.event_date,
    e.status,
    e.updated_at,
    e.metadata->>'google_calendar_event_id' as gcal_id,
    row_number() over (
      partition by e.venue_id, e.event_date
      order by
        (e.metadata->>'google_calendar_event_id' is not null and e.metadata->>'google_calendar_event_id' <> '') desc,
        e.updated_at desc nulls last,
        e.id desc
    ) as rn
  from public.events e
  where e.game_format = 'cervellone'
    and e.status not in ('cancelled', 'deleted', 'draft')
)
select
  r.venue_id,
  r.event_date,
  r.id,
  r.status,
  r.gcal_id,
  case when r.rn = 1 then 'KEEP' else 'DELETE' end as action
from ranked r
where (r.venue_id, r.event_date) in (
  select venue_id, event_date
  from ranked
  group by venue_id, event_date
  having count(*) > 1
)
order by r.event_date desc, r.venue_id, r.rn;

-- =============================================================================
-- 2. CLEANUP — cancel duplicate rows (soft delete; adjust if hard delete preferred)
-- =============================================================================
-- Uncomment and run ONLY after reviewing diagnostic output.

/*
begin;

with ranked as (
  select
    e.id,
    row_number() over (
      partition by e.venue_id, e.event_date
      order by
        (e.metadata->>'google_calendar_event_id' is not null and e.metadata->>'google_calendar_event_id' <> '') desc,
        e.updated_at desc nulls last,
        e.id desc
    ) as rn
  from public.events e
  where e.game_format = 'cervellone'
    and e.status not in ('cancelled', 'deleted', 'draft')
),
dupes as (
  select id
  from ranked
  where rn > 1
)
update public.events e
set
  status = 'cancelled',
  metadata = coalesce(e.metadata, '{}'::jsonb) || jsonb_build_object(
    'dedup_cancelled_at', now(),
    'dedup_reason', 'duplicate venue_id+event_date cervellone cleanup 2026-06-29'
  ),
  updated_at = now()
from dupes d
where e.id = d.id;

-- Report
select count(*) as cancelled_duplicates
from public.events
where metadata->>'dedup_reason' = 'duplicate venue_id+event_date cervellone cleanup 2026-06-29';

commit;
*/

-- =============================================================================
-- 3. CONSTRAINT — block future duplicate active cervellone events per venue+date
-- =============================================================================
-- Add to musicpro-eventi-app migration (not one-off in production without review).

/*
-- Optional dedicated column (preferred over metadata-only for GCal id)
alter table public.events
  add column if not exists google_calendar_event_id text;

create unique index if not exists events_google_calendar_event_id_uidx
  on public.events (google_calendar_event_id)
  where google_calendar_event_id is not null;

-- One active cervellone event per venue per calendar day
create unique index if not exists events_cervellone_venue_date_active_uidx
  on public.events (venue_id, event_date)
  where game_format = 'cervellone'
    and status not in ('cancelled', 'deleted', 'draft');
*/

-- =============================================================================
-- 4. POST-CLEANUP verify
-- =============================================================================

-- Should return zero rows after cleanup + before new duplicates are introduced
select
  e.venue_id,
  v.name,
  e.event_date,
  count(*) as cnt
from public.events e
join public.venues v on v.id = e.venue_id
where e.game_format = 'cervellone'
  and e.status not in ('cancelled', 'deleted', 'draft')
group by e.venue_id, v.name, e.event_date
having count(*) > 1;
