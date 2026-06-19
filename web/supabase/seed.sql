-- Seed demo event DEMO01
INSERT INTO events (code, name, theme, config, state, admin_pin)
VALUES (
  'DEMO01',
  'Love Roulette — Demo',
  'dark_fuchsia',
  '{
    "extraction_mode": "random",
    "challenge_order": ["dance", "kiss", "declaration", "kamasutra"],
    "stats_visibility": {"animator_dashboard": true, "projector": false, "player_feedback": true},
    "chat_enabled": true,
    "jury_enabled": false,
    "theme": "dark_fuchsia"
  }'::jsonb,
  'lobby',
  '123456'
) ON CONFLICT (code) DO NOTHING;
