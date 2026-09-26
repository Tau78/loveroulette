#!/usr/bin/env bash
# Build, sign (Developer ID), notarize, and staple a macOS .dmg for CasaPad (Tauri 2).
# Team default YSU7PL673A (stesso di mobile / AGENTS.md). Credenziali solo da env / file locali.
# Docs: desktop/docs/DISTRIBUTION.md
# Stile allineato a scripts/xcode-testflight.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="$REPO/desktop"
TEAM_ID="${APPLE_TEAM_ID:-YSU7PL673A}"
SKIP_INSTALL=0
SKIP_STAPLE_WAIT=0
BUNDLES="app,dmg"

usage() {
  cat <<'EOF'
Uso: bash scripts/desktop-notarize-dmg.sh [--skip-install] [--skip-stapling] [--bundles app,dmg]

Prerequisiti: Rust (rustc/cargo), Xcode CLT, Node, certificato "Developer ID Application".

Credenziali (env o desktop/.env / ~/.app-store/asc-api/key.env):
  APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD (mappato a APPLE_PASSWORD per Tauri)
  oppure ASC_KEY_ID + ASC_ISSUER_ID + ASC_KEY_PATH (→ APPLE_API_*)
  APPLE_TEAM_ID (default YSU7PL673A)
  APPLE_SIGNING_IDENTITY o TAURI_SIGNING_IDENTITY (opz.; altrimenti auto-detect)
EOF
}

for arg in "$@"; do
  case "$arg" in
    --skip-install) SKIP_INSTALL=1 ;;
    --skip-stapling) SKIP_STAPLE_WAIT=1 ;;
    --bundles)
      echo "Passa il valore attaccato: --bundles=app,dmg" >&2
      exit 2
      ;;
    --bundles=*) BUNDLES="${arg#--bundles=}" ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Argomento sconosciuto: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

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

load_env_files() {
  local env_file key val
  for env_file in \
    "$HOME/.app-store/asc-api/key.env" \
    "$DESKTOP/.env.local" \
    "$DESKTOP/.env" \
    "$REPO/.env.local" \
    "$REPO/.env"
  do
    [[ -f "$env_file" ]] || continue
    for key in \
      APPLE_ID APPLE_PASSWORD APPLE_APP_SPECIFIC_PASSWORD APPLE_TEAM_ID \
      APPLE_SIGNING_IDENTITY TAURI_SIGNING_IDENTITY \
      ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH \
      APPLE_API_KEY APPLE_API_ISSUER APPLE_API_KEY_PATH \
      APP_STORE_CONNECT_API_KEY_ID APP_STORE_CONNECT_API_ISSUER_ID APP_STORE_CONNECT_API_KEY_PATH
    do
      val="$(env_get "$env_file" "$key")"
      if [[ -n "$val" ]]; then
        # Non sovrascrivere se già presente nell'ambiente del processo.
        if [[ -z "${!key:-}" ]]; then
          export "$key=$val"
        fi
      fi
    done
  done
}

die() {
  echo "✗ $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Manca il comando \`$1\`. $2"
}

echo "→ CasaPad Mac: build + Developer ID + notarize DMG"
echo "→ REPO=$REPO"

load_env_files

# Alias ASC / App Store Connect API → nomi che legge il bundler Tauri
if [[ -z "${ASC_KEY_ID:-}" && -n "${APP_STORE_CONNECT_API_KEY_ID:-}" ]]; then
  ASC_KEY_ID="$APP_STORE_CONNECT_API_KEY_ID"
fi
if [[ -z "${ASC_ISSUER_ID:-}" && -n "${APP_STORE_CONNECT_API_ISSUER_ID:-}" ]]; then
  ASC_ISSUER_ID="$APP_STORE_CONNECT_API_ISSUER_ID"
fi
if [[ -z "${ASC_KEY_PATH:-}" && -n "${APP_STORE_CONNECT_API_KEY_PATH:-}" ]]; then
  ASC_KEY_PATH="$APP_STORE_CONNECT_API_KEY_PATH"
fi

# Se c’è solo il .p8 in ~/.app-store/asc-api/, ricava KEY_ID dal nome (come xcode-testflight).
if [[ -z "${ASC_KEY_PATH:-}" ]]; then
  for p8 in "$HOME/.app-store/asc-api"/AuthKey_*.p8; do
    [[ -f "$p8" ]] || continue
    ASC_KEY_PATH="$p8"
    [[ -z "${ASC_KEY_ID:-}" ]] && ASC_KEY_ID="$(basename "$p8" | sed -E 's/^AuthKey_([^.]+)\.p8$/\1/')"
    break
  done
fi

[[ -n "${APPLE_TEAM_ID:-}" ]] && TEAM_ID="$APPLE_TEAM_ID"
export APPLE_TEAM_ID="$TEAM_ID"

# Tauri legge APPLE_PASSWORD; accettiamo anche APPLE_APP_SPECIFIC_PASSWORD.
if [[ -z "${APPLE_PASSWORD:-}" && -n "${APPLE_APP_SPECIFIC_PASSWORD:-}" ]]; then
  export APPLE_PASSWORD="$APPLE_APP_SPECIFIC_PASSWORD"
fi

# API key path → APPLE_API_* (notarize di Tauri)
if [[ -n "${ASC_KEY_ID:-}" && -n "${ASC_ISSUER_ID:-}" && -f "${ASC_KEY_PATH:-}" ]]; then
  export APPLE_API_KEY="${APPLE_API_KEY:-$ASC_KEY_ID}"
  export APPLE_API_ISSUER="${APPLE_API_ISSUER:-$ASC_ISSUER_ID}"
  export APPLE_API_KEY_PATH="${APPLE_API_KEY_PATH:-$ASC_KEY_PATH}"
fi

# --- toolchain ---
need_cmd node "Installa Node 20/22 (come mobile/web)."
need_cmd npm "Installa npm."
if ! command -v rustc >/dev/null 2>&1 && [[ -f "$HOME/.cargo/env" ]]; then
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env"
fi
need_cmd rustc "Installa Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
need_cmd cargo "Installa Rust (cargo manca dopo rustup)."
need_cmd xcrun "Installa Xcode Command Line Tools: xcode-select --install"
need_cmd codesign "Serve codesign (Xcode CLT)."
need_cmd security "Serve security (macOS keychain)."

# --- signing identity ---
SIGNING_IDENTITY="${APPLE_SIGNING_IDENTITY:-${TAURI_SIGNING_IDENTITY:-}}"
if [[ -z "$SIGNING_IDENTITY" ]]; then
  # Preferisci Developer ID Application (fuori Mac App Store). Non usare "Apple Distribution".
  # Evita mapfile (bash 3.2 di sistema su macOS).
  IDS=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && IDS+=("$line")
  done < <(security find-identity -v -p codesigning 2>/dev/null \
    | sed -n 's/.*"\(Developer ID Application:[^"]*\)".*/\1/p')
  if [[ ${#IDS[@]} -eq 0 ]]; then
    die "Nessuna identity \"Developer ID Application\" nel keychain.
Crea il certificato su https://developer.apple.com/account/resources/certificates/list
(tipo Developer ID Application, team $TEAM_ID), installalo in Keychain Access, poi ritenta.
Identities attuali:
$(security find-identity -v -p codesigning 2>/dev/null || true)"
  fi
  if [[ ${#IDS[@]} -gt 1 ]]; then
    echo "Avviso: più Developer ID Application trovate; uso la prima. Imposta APPLE_SIGNING_IDENTITY per forzare." >&2
    printf '  - %s\n' "${IDS[@]}" >&2
  fi
  SIGNING_IDENTITY="${IDS[0]}"
fi
export APPLE_SIGNING_IDENTITY="$SIGNING_IDENTITY"
export TAURI_SIGNING_IDENTITY="$SIGNING_IDENTITY"
echo "→ signingIdentity=$SIGNING_IDENTITY"
echo "→ team=$TEAM_ID"

# --- credentials check ---
HAS_PASSWORD=0
HAS_API=0
[[ -n "${APPLE_ID:-}" && -n "${APPLE_PASSWORD:-}" ]] && HAS_PASSWORD=1
[[ -n "${APPLE_API_KEY:-}" && -n "${APPLE_API_ISSUER:-}" && -f "${APPLE_API_KEY_PATH:-}" ]] && HAS_API=1

if [[ "$HAS_PASSWORD" -eq 0 && "$HAS_API" -eq 0 ]]; then
  die "Credenziali notarize mancanti.
Opzione A — Apple ID:
  export APPLE_ID='tu@email'
  export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'  # account.apple.com → App-Specific Password
  export APPLE_TEAM_ID='$TEAM_ID'
Opzione B — App Store Connect API (come TestFlight):
  ~/.app-store/asc-api/AuthKey_XXX.p8 + key.env con ASC_KEY_ID / ASC_ISSUER_ID
  oppure APP_STORE_CONNECT_API_KEY_ID / _ISSUER_ID / _KEY_PATH
Vedi desktop/docs/DISTRIBUTION.md e desktop/.env.example"
fi

if [[ "$HAS_API" -eq 1 ]]; then
  echo "→ Notarize auth: App Store Connect API key ($APPLE_API_KEY)"
else
  echo "→ Notarize auth: Apple ID ($APPLE_ID)"
fi

# --- deps + build ---
cd "$DESKTOP"
[[ -f package.json ]] || die "Manca desktop/package.json"
[[ -f src-tauri/tauri.conf.json ]] || die "Manca desktop/src-tauri/tauri.conf.json"
[[ -f src-tauri/entitlements.plist ]] || die "Manca desktop/src-tauri/entitlements.plist (richiesto per hardened runtime / notarize)"

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo "→ npm install"
  npm install
else
  echo "→ npm install saltato (--skip-install)"
fi

# signingIdentity resta null in tauri.conf.json: lo iniettiamo via --config
# (Tauri non legge TAURI_SIGNING_IDENTITY da solo; lo script lo mappa qui).
CONFIG_JSON="$(printf '{"bundle":{"macOS":{"signingIdentity":%s}}}' \
  "$(python3 -c 'import json,os; print(json.dumps(os.environ["APPLE_SIGNING_IDENTITY"]))')")"

BUILD_ARGS=(build --ci --config "$CONFIG_JSON" --bundles "$BUNDLES")
if [[ "$SKIP_STAPLE_WAIT" -eq 1 ]]; then
  BUILD_ARGS+=(--skip-stapling)
  echo "→ --skip-stapling: non attende/staple ticket (utile prima notarize lunga)"
fi

echo "→ npx tauri ${BUILD_ARGS[*]}"
npx tauri "${BUILD_ARGS[@]}"

BUNDLE_DIR="$DESKTOP/src-tauri/target/release/bundle"
DMG_DIR="$BUNDLE_DIR/dmg"
APP_DIR="$BUNDLE_DIR/macos"

echo ""
echo "✓ Build completata."
if [[ -d "$DMG_DIR" ]]; then
  echo "→ DMG:"
  ls -la "$DMG_DIR"/*.dmg 2>/dev/null || echo "  (nessun .dmg in $DMG_DIR)"
fi
if [[ -d "$APP_DIR" ]]; then
  echo "→ APP:"
  ls -la "$APP_DIR"/*.app 2>/dev/null || true
fi
echo ""
echo "Verifica locale (opzionale):"
echo "  spctl --assess --type execute -vv \"$APP_DIR\"/*.app"
echo "  xcrun stapler validate \"$DMG_DIR\"/*.dmg"
echo "Docs: desktop/docs/DISTRIBUTION.md"
