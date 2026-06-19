ALTER TABLE love_roulette_participants
  ADD COLUMN IF NOT EXISTS data_visibility text NOT NULL DEFAULT 'matched'
  CHECK (data_visibility IN ('everyone', 'matched', 'none'));
