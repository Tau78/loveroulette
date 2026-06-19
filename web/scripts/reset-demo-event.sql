-- Love Roulette — reset demo event (lobby + clean game data)
--
-- Equivalent to admin «Nuova partita» (without clearing participants).
-- Run in Supabase SQL Editor for project fvxdghqpavdcohczrvsc.
--
-- Options:
--   v_join_code     — event slug, default DEMO01
--   v_clear_players — true = delete participants too

begin;

do $$
declare
  v_join_code text := 'DEMO01';
  v_clear_players boolean := false;
  v_event_id uuid;
  v_participant_ids uuid[];
  v_question_ids uuid[];
begin
  select e.id into v_event_id
  from public.events e
  where e.metadata->>'love_roulette_code' = v_join_code
  order by e.event_date desc
  limit 1;

  if v_event_id is null then
    raise exception 'Evento % non trovato', v_join_code;
  end if;

  select coalesce(array_agg(id), '{}') into v_participant_ids
  from public.love_roulette_participants
  where event_id = v_event_id;

  if array_length(v_participant_ids, 1) > 0 then
    delete from public.love_roulette_answers
    where participant_id = any(v_participant_ids);
  end if;

  delete from public.love_roulette_pairs
  where event_id = v_event_id;

  select coalesce(array_agg(id), '{}') into v_question_ids
  from public.love_roulette_questions
  where event_id = v_event_id;

  if array_length(v_question_ids, 1) > 0 then
    delete from public.love_roulette_question_options
    where question_id = any(v_question_ids);

    delete from public.love_roulette_questions
    where event_id = v_event_id;
  end if;

  if v_clear_players then
    delete from public.love_roulette_participants
    where event_id = v_event_id;
  else
    update public.love_roulette_participants
    set is_online = false
    where event_id = v_event_id;
  end if;

  update public.love_roulette_sessions
  set runtime_state = 'lobby', ended_at = null
  where event_id = v_event_id;

  update public.events
  set metadata = metadata
    - 'love_roulette_quiz'
    - 'love_roulette_display'
    - 'love_roulette_last_reveal'
  where id = v_event_id;

  raise notice 'Reset complete for % (event_id=%)', v_join_code, v_event_id;
end $$;

commit;

-- Verify:
-- select s.runtime_state from love_roulette_sessions s
-- join events e on e.id = s.event_id
-- where e.metadata->>'love_roulette_code' = 'DEMO01';
