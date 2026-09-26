# CasaPad Mac — distribuzione (Developer ID + notarize)

Distribuzione **fuori** Mac App Store: `.dmg` firmato con **Developer ID Application**, notarizzato e stapled da Apple.

Team tipico: `YSU7PL673A` (stesso di mobile / `AGENTS.md`).

## One-liner

Dalla root del repo, con credenziali già in env o in `desktop/.env` / `~/.app-store/asc-api/key.env`:

```bash
bash scripts/desktop-notarize-dmg.sh
```

O da `desktop/`:

```bash
npm run notarize:dmg
```

Artefatti: `desktop/src-tauri/target/release/bundle/dmg/*.dmg` e `…/macos/*.app`.

## Prerequisiti

| Cosa | Note |
| --- | --- |
| Rust (`rustc` / `cargo`) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Xcode CLT | `xcode-select --install` (`codesign`, `xcrun notarytool`) |
| Node + npm | come `web/` / `mobile/` |
| Certificato **Developer ID Application** | Apple Developer → Certificates. **Non** basta `Apple Development` né `Apple Distribution` (quest’ultimo è App Store / TestFlight iOS). |

Verifica identity:

```bash
security find-identity -v -p codesigning | grep "Developer ID Application"
```

## Credenziali (mai in git)

Copia `desktop/.env.example` → `desktop/.env` (già in `.gitignore`).

### Opzione A — Apple ID + app-specific password

```bash
export APPLE_ID='tu@email'
export APPLE_APP_SPECIFIC_PASSWORD='xxxx-xxxx-xxxx-xxxx'  # account.apple.com
export APPLE_TEAM_ID='YSU7PL673A'
```

Lo script esporta `APPLE_PASSWORD` (nome letto dal bundler Tauri) da `APPLE_APP_SPECIFIC_PASSWORD`.

### Opzione B — App Store Connect API (consigliata, allinea a TestFlight)

Stesso layout di `scripts/xcode-testflight.sh`:

- `~/.app-store/asc-api/AuthKey_XXXXXX.p8`
- `~/.app-store/asc-api/key.env` con `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH`

Alias accettati: `APP_STORE_CONNECT_API_KEY_ID` / `_ISSUER_ID` / `_KEY_PATH`.

Lo script mappa a `APPLE_API_KEY`, `APPLE_API_ISSUER`, `APPLE_API_KEY_PATH` per Tauri.

## Signing identity in config

In `src-tauri/tauri.conf.json`, `bundle.macOS.signingIdentity` resta **`null`**.

Motivo: l’identity completa (`Developer ID Application: Nome (TEAMID)`) varia per macchina/certificato. Lo script la risolve da:

1. `APPLE_SIGNING_IDENTITY` o `TAURI_SIGNING_IDENTITY` (env / `.env`), oppure
2. auto-detect della prima `Developer ID Application` in keychain

e la passa a `tauri build --config '{"bundle":{"macOS":{"signingIdentity":"…"}}}'`.

**Nota:** Tauri CLI **non** legge da solo `TAURI_SIGNING_IDENTITY`; è un alias supportato solo da `scripts/desktop-notarize-dmg.sh`.

Entitlements: `src-tauri/entitlements.plist` (JIT / unsigned executable memory / disable library validation per WKWebView + hardened runtime). `hardenedRuntime` è `true` di default in Tauri 2.

## Flag utili

```bash
bash scripts/desktop-notarize-dmg.sh --skip-install    # riusa node_modules
bash scripts/desktop-notarize-dmg.sh --skip-stapling   # non attende ticket (prima notarize lunga)
bash scripts/desktop-notarize-dmg.sh --bundles=app,dmg
```

## Verifica post-build

```bash
spctl --assess --type execute -vv desktop/src-tauri/target/release/bundle/macos/*.app
xcrun stapler validate desktop/src-tauri/target/release/bundle/dmg/*.dmg
```

## Mac App Store — fase successiva

Il percorso attuale è **Developer ID + notarize** (download diretto / sito / USB). Il **Mac App Store** richiede App Sandbox, provisioning diverso, review Apple, e spesso entitlement/capability diverse da quelle in `entitlements.plist` (qui sandbox **non** è attivo). Non mescolare i due flussi nello stesso certificato/script: sarà un target/config separati in un giro successivo.

## Riferimenti

- Script: `scripts/desktop-notarize-dmg.sh` (stile di `scripts/xcode-testflight.sh`)
- Env template: `desktop/.env.example`
- Team / Apple release: `AGENTS.md`, `.cursor/skills/apple-release/SKILL.md`
