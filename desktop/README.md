# CasaPad Mac MVP — Love Roulette Plancia

App macOS nativa (Tauri 2 + Vite + React). **Non** è un WebView dell’admin web: la UI vive in questo package e chiama le API HTTP esistenti.

Identifier: `it.musicproeventi.loveroulette.plancia` (allineato a mobile `it.musicproeventi.loveroulette`).

## Prerequisiti

1. **Node.js** + npm (come in `web/` / `mobile/`)
2. **Xcode Command Line Tools** (o Xcode completo):
   ```bash
   xcode-select --install
   ```
3. **Rust** (necessario solo per `tauri:dev` / `tauri:build`):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   rustc --version
   ```

Il frontend Vite (`npm run build` / `npm run dev`) funziona **senza** Rust.

## Setup

```bash
cd desktop
npm install
```

## Uso MVP UI

1. `npm run dev` → apri `http://localhost:1420`
2. Login bootstrap (come mobile): **admin** / **admin12**
3. Toolbar: Host (default `https://loveroulette.vercel.app`), codice evento, **Connetti**
4. Se l’evento ha PIN animatore → campo PIN + Verifica
5. Pannelli:
   - **Live** — `runtimeState`, quiz `displayPhase` / index, `sessionId`
   - **Stats** — `onlineCount`, `participantCount` da `/session`
   - **Anteprima** — iframe `{HOST}/s/{code}/display?embed=1`
   - **Azioni** — verifica PIN, aggiorna, apri proiettore (`?present=1`), **Advance quiz (API)** (solo `POST …/quiz` `{ action: "advance" }` — il binario AVANTI completo resta su web/server)

### Shortcut

| Tasto | Azione |
| --- | --- |
| `⌘↵` (Cmd+Enter) | Connetti |
| `⌘R` o `R` | Aggiorna snapshot |
| `⌘P` | Focus PIN (o apre proiettore se PIN già attivo) |

### API / CORS

- Browser (`npm run dev`): le chiamate vanno a `/api/*` e Vite le proxya verso `VITE_API_PROXY_TARGET` (default Vercel). Così non serve CORS.
- Tauri: `@tauri-apps/plugin-http` con URL assoluto + permission in `src-tauri/capabilities/default.json`.
- Poll: 3s; **350ms** se `runtimeState` è `quiz` o `finals`.
- Nessuna chiave Supabase nel client desktop.

Per puntare il proxy a un Next locale:

```bash
VITE_API_PROXY_TARGET=http://localhost:3000 npm run dev
```

(In browser il campo Host controlla anteprima/proiettore; l’API passa comunque dal proxy.)

## Sviluppo

Solo UI browser (senza shell nativa):

```bash
npm run dev
```

App Mac completa (serve Rust + Xcode CLT):

```bash
npm run tauri:dev
```

## Build

Frontend statico:

```bash
npm run build
```

Bundle `.app` macOS:

```bash
npm run tauri:build
```

Artefatti tipici in `src-tauri/target/release/bundle/macos/`.

## Script npm

| Script | Cosa fa |
| --- | --- |
| `dev` | Vite HMR su `http://localhost:1420` |
| `build` | Typecheck + build Vite → `dist/` |
| `preview` | Serve `dist/` |
| `tauri` | CLI Tauri |
| `tauri:dev` | Shell nativa + Vite |
| `tauri:build` | Bundle installabile macOS |

## Note

- Notarizzazione Apple: fuori scope.
- Icons in `src-tauri/icons/` (PNG/icns/ico) già presenti.
- Non reimplementa la macchina a stati AVANTI.
