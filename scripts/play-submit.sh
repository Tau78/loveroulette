#!/usr/bin/env bash
# Submit latest Android AAB to Google Play (internal track by default).
# Love Game monorepo: EAS runs from mobile/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
cd "$MOBILE"

load_env() {
  local f
  for f in \
    "$ROOT/.env.play" \
    "$MOBILE/.env.play" \
    "$HOME/.config/loveroulette/play.env" \
    "$HOME/.config/rewavier/play.env"
  do
    [[ -f "$f" ]] || continue
    set -a
    # shellcheck disable=SC1090
    source "$f"
    set +a
  done
}

load_env

KEY_PATH="${PLAY_SERVICE_ACCOUNT_JSON:-}"
if [[ -z "$KEY_PATH" || ! -f "$KEY_PATH" ]]; then
  cat >&2 <<'EOF'
Manca il service account Google Play.

1. Play Console → Setup → API access → Create service account
2. Concedi permessi Release (almeno internal testing)
3. Scarica JSON e salvalo fuori da git (es. ~/.config/loveroulette/play-service-account.json)
4. Copia .env.play.example → .env.play (root o mobile/) con:
     PLAY_SERVICE_ACCOUNT_JSON=/path/assoluto/al.json
     PLAY_TRACK=internal

Path env cercati (in ordine):
  - <repo>/.env.play
  - <repo>/mobile/.env.play
  - ~/.config/loveroulette/play.env
  - ~/.config/rewavier/play.env  (fallback team)

Poi dalla root: bash scripts/play-submit.sh
EOF
  exit 1
fi

TRACK="${PLAY_TRACK:-internal}"

echo "→ EAS Submit Android (track: $TRACK) [cwd: $MOBILE]"
GOOGLE_SERVICE_ACCOUNT_KEY="$KEY_PATH" npx eas-cli submit \
  --platform android \
  --profile production \
  --non-interactive \
  --track "$TRACK" \
  "$@"
