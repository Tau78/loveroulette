-- MusicPro — cleanup locali di test ([TEST] …) e eventi collegati
--
-- Target: fvxdghqpavdcohczrvsc (MusicPro Eventi Pro)
-- Run in Supabase SQL Editor as postgres / service_role.
--
-- Il delete da admin (RPC admin_delete_venue) blocca se esistono eventi passati
-- collegati al locale. Questo script elimina prima gli eventi (admin_purge_event)
-- poi i locali.
--
-- Prima di eseguire: lasciare v_dry_run = true e verificare l'output.
-- Poi impostare v_dry_run = false per applicare.

begin;

do $$
declare
  v_dry_run boolean := true;  -- ← mettere false per eliminare davvero
  v_venue record;
  v_event record;
  v_purge jsonb;
  v_delete jsonb;
  v_venue_count int := 0;
  v_event_count int := 0;
begin
  raise notice '=== Preview locali [TEST] ===';

  for v_venue in
    select v.id, v.name, v.city,
           count(e.id) filter (where e.event_date < current_date) as past_events,
           count(e.id) filter (where e.event_date >= current_date) as future_events,
           count(e.id) as total_events
    from public.venues v
    left join public.events e on e.venue_id = v.id
    where v.name ilike '[TEST]%'
    group by v.id, v.name, v.city
    order by v.name
  loop
    v_venue_count := v_venue_count + 1;
    raise notice 'Locale: % (%) — eventi: % totali (% passati, % futuri)',
      v_venue.name, v_venue.city, v_venue.total_events, v_venue.past_events, v_venue.future_events;
  end loop;

  if v_venue_count = 0 then
    raise notice 'Nessun locale [TEST] trovato.';
    return;
  end if;

  if v_dry_run then
    raise notice 'DRY RUN — impostare v_dry_run := false per procedere.';
    return;
  end if;

  raise notice '=== Purge eventi collegati ===';

  for v_event in
    select e.id, e.event_date, e.status, v.name as venue_name
    from public.events e
    join public.venues v on v.id = e.venue_id
    where v.name ilike '[TEST]%'
    order by e.event_date, v.name
  loop
    select public.admin_purge_event(v_event.id) into v_purge;
    v_event_count := v_event_count + 1;

    if coalesce((v_purge->>'success')::boolean, false) then
      raise notice 'Purge OK: % @ % (%)', v_event.venue_name, v_event.event_date, v_event.id;
    else
      raise warning 'Purge FAIL: % @ % — %', v_event.venue_name, v_event.event_date, v_purge->>'message';
    end if;
  end loop;

  raise notice '=== Delete locali [TEST] ===';

  for v_venue in
    select id, name
    from public.venues
    where name ilike '[TEST]%'
    order by name
  loop
    select public.admin_delete_venue(v_venue.id) into v_delete;

    if coalesce((v_delete->>'success')::boolean, false) then
      raise notice 'Locale eliminato: %', v_venue.name;
    else
      raise warning 'Eliminazione fallita: % — %', v_venue.name, v_delete->>'message';
    end if;
  end loop;

  raise notice 'Fatto — % eventi purgati, % locali processati.', v_event_count, v_venue_count;
end $$;

-- Verifica post-cleanup (dopo commit con v_dry_run = false)
-- select id, name, city from public.venues where name ilike '[TEST]%' order by name;

commit;
