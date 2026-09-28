-- Profilo ingresso: nome, cognome, telefono, email, foto, nick facoltativo.
-- Il nome in sala può ripetersi (due «Marco» senza nick).

ALTER TABLE love_roulette_participants
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS nick text,
  ADD COLUMN IF NOT EXISTS public_name_mode text;

ALTER TABLE love_roulette_participants
  DROP CONSTRAINT IF EXISTS love_roulette_participants_public_name_mode_check;

ALTER TABLE love_roulette_participants
  ADD CONSTRAINT love_roulette_participants_public_name_mode_check
  CHECK (
    public_name_mode IS NULL
    OR public_name_mode IN ('nick', 'first', 'full')
  );

DO $$
DECLARE
  cons name;
BEGIN
  FOR cons IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'love_roulette_participants'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) ILIKE '%nickname%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%badge%'
  LOOP
    EXECUTE format(
      'ALTER TABLE love_roulette_participants DROP CONSTRAINT %I',
      cons
    );
  END LOOP;
END $$;
