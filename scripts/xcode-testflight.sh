#!/usr/bin/env bash
# Build Love Roulette (plancia) with Xcode and upload to App Store Connect (TestFlight).
# Team YSU7PL673A. Upload: chiave API ASC in ~/.app-store/asc-api/ (non git).
# Skill: .cursor/skills/apple-release/SKILL.md
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$REPO/mobile"
UPLOAD_ONLY=0
for arg in "$@"; do
  [[ "$arg" == "--upload-only" ]] && UPLOAD_ONLY=1
done
# Expo EXConstants: `bash -l -c $PODS_TARGET_SRCROOT/...` non cita i path.
# Con "Love Game" Xcode risolve il path reale e lo script fallisce.
if [[ "$ROOT" == *" "* ]]; then
  COPY="$HOME/lr-plancia-build"
  if [[ "$UPLOAD_ONLY" == "1" && -d "$COPY/ios/build/LoveRoulette.xcarchive" ]]; then
    echo "→ Upload-only: riuso $COPY (niente ditto)"
  else
    echo "→ Copia APFS senza spazi: $COPY"
    rm -rf "$COPY"
    mkdir -p "$COPY"
    ditto "$ROOT" "$COPY"
  fi
  ROOT="$COPY"
fi
cd "$ROOT"
# Expo 54 vuole Node 20/22. Homebrew node@22 è keg-only: non prendere v25/v26 di default.
NODE_BIN=""
for candidate in /opt/homebrew/opt/node@22/bin/node /opt/homebrew/opt/node@20/bin/node; do
  [[ -x "$candidate" ]] && NODE_BIN="$candidate" && break
done
[[ -n "$NODE_BIN" ]] || NODE_BIN="$(command -v node)"
export PATH="$(dirname "$NODE_BIN"):$PATH"
{
  printf 'export NODE_BINARY=%s\n' "$NODE_BIN"
  printf 'export PROJECT_ROOT=%s\n' "$ROOT"
  printf 'export ENTRY_FILE=%s/index.ts\n' "$ROOT"
} > ios/.xcode.env.local
echo "→ NODE_BINARY=$NODE_BIN ROOT=$ROOT"

UPLOAD=1
SKIP_PREBUILD=1
[[ -d ios ]] || SKIP_PREBUILD=0
for arg in "$@"; do
  case "$arg" in
    --no-upload) UPLOAD=0 ;;
    --prebuild) SKIP_PREBUILD=0 ;;
    --skip-prebuild) SKIP_PREBUILD=1 ;;
    --upload-only) UPLOAD_ONLY=1; SKIP_PREBUILD=1 ;;
    *)
      echo "Uso: bash scripts/xcode-testflight.sh [--no-upload] [--prebuild] [--upload-only]"
      exit 2
      ;;
  esac
done

TEAM_ID="YSU7PL673A"
# Chiave API ASC: una per il team Individual, fuori dal git.
# ~/.app-store/asc-api/key.env  oppure mobile/.env.local
ASC_KEY_ID="${ASC_KEY_ID:-}"
ASC_ISSUER_ID="${ASC_ISSUER_ID:-}"
ASC_KEY_PATH="${ASC_KEY_PATH:-}"
env_get() {
  local file="$1" key="$2" line val
  [[ -f "$file" ]] || return 0
  line="$(grep -E "^${key}=" "$file" | tail -1 || true)"
  [[ -n "$line" ]] || return 0
  val="${line#*=}"
  val="${val#\'}"; val="${val%\'}"
  val="${val#\"}"; val="${val%\"}"
  printf '%s' "$val"
}
for env_file in "$HOME/.app-store/asc-api/key.env" "$ROOT/.env.local" "$ROOT/.env" "$REPO/.env.local" "$REPO/.env"; do
  [[ -f "$env_file" ]] || continue
  val="$(env_get "$env_file" EXPO_APPLE_TEAM_ID)"
  [[ -n "$val" ]] && TEAM_ID="$val"
  val="$(env_get "$env_file" ASC_KEY_ID)"
  [[ -n "$val" ]] && ASC_KEY_ID="$val"
  val="$(env_get "$env_file" ASC_ISSUER_ID)"
  [[ -n "$val" ]] && ASC_ISSUER_ID="$val"
  val="$(env_get "$env_file" ASC_KEY_PATH)"
  [[ -n "$val" ]] && ASC_KEY_PATH="$val"
done
# Se c’è solo il .p8 in ~/.app-store/asc-api/AuthKey_XXX.p8, ricava KEY_ID dal nome.
if [[ -z "$ASC_KEY_PATH" ]]; then
  for p8 in "$HOME/.app-store/asc-api"/AuthKey_*.p8; do
    [[ -f "$p8" ]] || continue
    ASC_KEY_PATH="$p8"
    [[ -z "$ASC_KEY_ID" ]] && ASC_KEY_ID="$(basename "$p8" | sed -E 's/^AuthKey_([^.]+)\.p8$/\1/')"
    break
  done
fi
AUTH_ARGS=()
if [[ -n "$ASC_KEY_ID" && -n "$ASC_ISSUER_ID" && -f "${ASC_KEY_PATH:-}" ]]; then
  echo "→ Upload con chiave API App Store Connect ($ASC_KEY_ID)"
  AUTH_ARGS=(
    -authenticationKeyPath "$ASC_KEY_PATH"
    -authenticationKeyID "$ASC_KEY_ID"
    -authenticationKeyIssuerID "$ASC_ISSUER_ID"
  )
fi

SCHEME="LoveRoulette"
WORKSPACE="ios/LoveRoulette.xcworkspace"
ARCHIVE="$ROOT/ios/build/LoveRoulette.xcarchive"
IPA_DIR="$ROOT/ios/build/ipa"
EXPORT_PLIST="$ROOT/ios/ExportOptions.plist"
BUILD_NUM="$(node -p "require('./app.json').expo.ios.buildNumber")"

if [[ "$UPLOAD_ONLY" == "0" ]]; then
  if [[ "$SKIP_PREBUILD" == "0" ]]; then
    echo "→ Sync native iOS project from app.json"
    npx expo prebuild --platform ios --no-install
  else
    echo "→ Prebuild saltato (usa --prebuild se hai cambiato app.json / plugin Expo)"
  fi
  echo "→ CocoaPods"
  (cd ios && pod install)
fi

mkdir -p "$ROOT/ios/build" "$IPA_DIR"

cat > "$EXPORT_PLIST" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>destination</key>
  <string>upload</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
EOF

if [[ "$UPLOAD_ONLY" == "0" ]]; then
  echo "→ Archive (Release) build $BUILD_NUM (team $TEAM_ID)"
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    -allowProvisioningUpdates \
    "${AUTH_ARGS[@]}" \
    clean archive
fi

if [[ "$UPLOAD" == "0" ]]; then
  echo ""
  echo "Archivio pronto: $ARCHIVE (upload saltato)."
  exit 0
fi

if [[ ! -d "$ARCHIVE" ]]; then
  echo "Manca l'archivio: $ARCHIVE" >&2
  exit 1
fi

if [[ ${#AUTH_ARGS[@]} -eq 0 ]]; then
  echo "Serve la chiave API App Store Connect (Xcode Accounts non basta da questo script)." >&2
  echo "Crea la chiave: https://appstoreconnect.apple.com/access/integrations/api" >&2
  echo "Poi: ~/.app-store/asc-api/AuthKey_XXXXXX.p8 e key.env con ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_PATH" >&2
  exit 1
fi

echo "→ Upload to App Store Connect"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$IPA_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates \
  "${AUTH_ARGS[@]}"

echo ""
echo "Fatto. Tra 5–15 minuti controlla TestFlight (build $BUILD_NUM)."
echo "https://appstoreconnect.apple.com/apps/6805227768/testflight/ios"
