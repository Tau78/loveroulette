#!/usr/bin/env bash
# EAS cloud build for Android (AAB, Play Store) — Love Game monorepo (mobile/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/mobile"
cd "$MOBILE"

NO_WAIT=0
for arg in "$@"; do
  case "$arg" in
    --no-wait) NO_WAIT=1 ;;
  esac
done

if [[ -z "${EXPO_TOKEN:-}" ]] && ! npx eas whoami >/dev/null 2>&1; then
  echo "Serve EXPO_TOKEN o eas login." >&2
  exit 1
fi

args=(build --platform android --profile production --non-interactive)
[[ "$NO_WAIT" == "1" ]] && args+=(--no-wait)

echo "→ EAS Android build (${args[*]}) [cwd: $MOBILE]"
npx eas-cli "${args[@]}"
