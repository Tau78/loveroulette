-- Love Roulette — Initial Schema (M1)

CREATE TYPE event_state AS ENUM (
  'lobby', 'quiz', 'matching', 'extraction',
  'elimination', 'finals', 'winner', 'closed'
);

CREATE TYPE gender_enum AS ENUM ('male', 'female');

CREATE TYPE player_role AS ENUM (
  'player', 'finalist', 'audience', 'jury', 'animator'
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Love Roulette',
  theme TEXT NOT NULL DEFAULT 'dark_fuchsia',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  state event_state NOT NULL DEFAULT 'lobby',
  admin_pin TEXT,
  starts_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  auth_user_id UUID,
  nickname TEXT NOT NULL,
  gender gender_enum NOT NULL,
  badge_code TEXT,
  role player_role NOT NULL DEFAULT 'player',
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, nickname),
  UNIQUE (event_id, badge_code)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'lifestyle',
  weight FLOAT NOT NULL DEFAULT 1.0,
  branch_parent_id UUID REFERENCES questions(id),
  branch_trigger_option INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, question_id)
);

CREATE TABLE pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_male_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_female_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  affinity_score FLOAT NOT NULL,
  rank INT NOT NULL,
  is_finalist BOOLEAN NOT NULL DEFAULT false,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  was_shown BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_male_id, player_female_id)
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (voter_id, challenge_id)
);

CREATE TABLE jury_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  jury_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 1 AND score <= 10),
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (jury_player_id, challenge_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_event ON players(event_id);
CREATE INDEX idx_questions_event ON questions(event_id);
CREATE INDEX idx_pairs_event_rank ON pairs(event_id, rank);
CREATE INDEX idx_votes_event ON votes(event_id);
CREATE INDEX idx_chat_event ON chat_messages(event_id, created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jury_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Public read events by code (via service role in API for M1)
CREATE POLICY "events_public_read" ON events FOR SELECT USING (true);
