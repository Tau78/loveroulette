-- Sono / cerco / fascia età.
-- La fascia si salva e non entra nel matching (filtro col check-in).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'love_roulette_gender') THEN
    ALTER TYPE love_roulette_gender ADD VALUE IF NOT EXISTS 'nonbinary';
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    ALTER TYPE gender_enum ADD VALUE IF NOT EXISTS 'nonbinary';
  END IF;
END $$;

ALTER TABLE love_roulette_participants
  ADD COLUMN IF NOT EXISTS seeking text,
  ADD COLUMN IF NOT EXISTS age_band text;

ALTER TABLE love_roulette_participants
  DROP CONSTRAINT IF EXISTS love_roulette_participants_seeking_check;

ALTER TABLE love_roulette_participants
  ADD CONSTRAINT love_roulette_participants_seeking_check
  CHECK (seeking IS NULL OR seeking IN ('male', 'female', 'both'));

ALTER TABLE love_roulette_participants
  DROP CONSTRAINT IF EXISTS love_roulette_participants_age_band_check;

ALTER TABLE love_roulette_participants
  ADD CONSTRAINT love_roulette_participants_age_band_check
  CHECK (
    age_band IS NULL
    OR age_band IN ('18_29', '30_39', '40_49', '50_plus')
  );
