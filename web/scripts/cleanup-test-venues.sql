-- MusicPro — rimuove locali di test e gli eventi collegati
--
-- Target: progetto condiviso fvxdghqpavdcohczrvsc
-- Esegui in Supabase SQL Editor (o: npm run cleanup:test-venues -- --apply)
--
-- 1) Imposta v_dry_run := true per solo anteprima (default)
-- 2) Verifica l'elenco in NOTICE / SELECT finale
-- 3) Imposta v_dry_run := false per eliminare

begin;

do $$
declare
  v_dry_run boolean := true;
  v_demo_venue_id uuid := null; -- opzionale: esclude il venue usato da DEMO01
  v_venue record;
  v_event record;
  v_participant_ids uuid[];
  v_venue_count int := 0;
  v_event_count int := 0;
begin
  for v_venue in
    select v.id, v.name, v.city
    from public.venues v
    where (
      v.name ilike '%test%'
      or v.name ilike '%demo%'
      or v.name ilike '%prova%'
      or v.name ilike '%temp%'
      or v.name ilike '%sandbox%'
      or v.city ilike '%test%'
    )
    and (v_demo_venue_id is null or v.id <> v_demo_venue_id)
    order by v.name
  loop
    v_venue_count := v_venue_count + 1;
    raise notice 'Locale test: % (%, %)', v_venue.name, v_venue.city, v_venue.id;

    for v_event in
      select e.id, e.event_date, e.game_format, e.metadata->>'love_roulette_code' as lr_code
      from public.events e
      where e.venue_id = v_venue.id
      order by e.event_date desc
    loop
      v_event_count := v_event_count + 1;
      raise notice '  Evento: % | % | %', v_event.event_date, v_event.game_format, coalesce(v_event.lr_code, '—');

      if v_dry_run then
        continue;
      end if;

      -- Love Roulette — dati runtime
      select coalesce(array_agg(p.id), '{}') into v_participant_ids
      from public.love_roulette_participants p
      where p.event_id = v_event.id;

      if array_length(v_participant_ids, 1) > 0 then
        delete from public.love_roulette_answers
        where participant_id = any(v_participant_ids);
      end if;

      delete from public.love_roulette_pairs where event_id = v_event.id;
      delete from public.love_roulette_participants where event_id = v_event.id;
      delete from public.love_roulette_sessions where event_id = v_event.id;
      delete from public.love_roulette_mood_state where event_id = v_event.id;
      delete from public.love_roulette_questions where event_id = v_event.id;

      -- Evento (FK verso venue) — altre dipendenze Cervellone/booking possono bloccare:
      -- in quel caso cancella manualmente le righe figlie indicate dall'errore Postgres.
      delete from public.events where id = v_event.id;
    end loop;

    if not v_dry_run then
      delete from public.venues where id = v_venue.id;
      raise notice 'Eliminato locale %', v_venue.name;
    end if;
  end loop;

  if v_dry_run then
    raise notice 'DRY RUN — % locali test, % eventi collegati. Imposta v_dry_run := false per eliminare.', v_venue_count, v_event_count;
  else
    raise notice 'Pulizia completata — % locali, % eventi.', v_venue_count, v_event_count;
  end if;
end $$;

commit;

-- Verifica residui:
-- select v.id, v.name, v.city, count(e.id) as eventi
-- from public.venues v
-- left join public.events e on e.venue_id = v.id
-- where v.name ilike any(array['%test%','%demo%','%prova%','%temp%','%sandbox%'])
-- group by v.id, v.name, v.city
-- order by v.name;
