# Love Roulette — Generatore API (import/export manche + quiz)

> Modulo 22 · Integrazione editor esterno domande  
> Formato: `love_roulette_generatore_v1` · Evento demo: `DEMO01`

L'**Editor / Generatore** esterno scambia le manche in JSON e comanda il quiz live (start, tick, advance, stato) via HTTP. L'admin web espone la stessa API nel pannello **Generatore manche** (`AdminGeneratorePanel`).

---

## Base URL

```
/api/events/{code}/generatore
```

`{code}` = slug evento a 6 caratteri (es. `DEMO01`), case-insensitive.

Esempio locale:

```
http://localhost:3000/api/events/DEMO01/generatore
```

---

## Autenticazione

| Metodo | Header | Quando |
|--------|--------|--------|
| PIN animatore | `X-Animator-Pin: <pin>` | Se `events.metadata.animator_pin` è impostato (DEMO01: `123456`) |
| API key Generatore | `X-Generatore-Key: <key>` | Se `events.metadata.generatore_api_key` è impostato |

**Regola:** se è configurato almeno uno tra PIN e API key, la richiesta deve presentare **PIN valido oppure key valida**. Se nessuno dei due è configurato, l'endpoint è aperto (solo ambienti di sviluppo).

**Eccezione:** `POST` con `{ "action": "tick" }` è **pubblico** (nessun header richiesto), come su `/api/events/{code}/quiz` — consente al display di fare polling del timer.

Per impostare la key su un evento (Supabase SQL Editor):

```sql
update public.events
set metadata = metadata || jsonb_build_object('generatore_api_key', 'your-secret-key')
where metadata->>'love_roulette_code' = 'DEMO01';
```

---

## Formato JSON manche (`love_roulette_generatore_v1`)

File di esempio nel repo: [`web/data/generatore/example-manche-v1.json`](../web/data/generatore/example-manche-v1.json) (2 manche, 3 domande).

### Schema

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `format` | string | sì | Sempre `"love_roulette_generatore_v1"` |
| `version` | number | sì | Sempre `1` |
| `event_code` | string | no | Slug evento (informativo in export) |
| `exported_at` | string (ISO) | no | Timestamp export |
| `manche` | array | sì | Almeno una manche |
| `meta` | object | no | Timing quiz (secondi) |

**Manche:**

| Campo | Tipo | Obbligatorio |
|-------|------|--------------|
| `id` | string | sì — id stabile lato editor (es. `manche_lifestyle`) |
| `order` | number | sì — ordine di presentazione (1-based) |
| `theme_title` | string | sì — titolo slide tema |
| `theme_subtitle` | string | no |
| `questions` | array | sì — almeno una domanda per manche |

**Domanda:**

| Campo | Tipo | Obbligatorio |
|-------|------|--------------|
| `id` | string | consigliato — id logico editor; in import viene sostituito con UUID DB |
| `body` | string | sì |
| `category` | string | sì — es. `lifestyle`, `romantic`, `fun` |
| `weight` | number | no — default `1` |
| `options` | array | sì — **esattamente 4** opzioni |

**Opzione:**

| Campo | Tipo | Obbligatorio |
|-------|------|--------------|
| `id` | string | no — rigenerato in DB all'import |
| `label` | string | sì |
| `sort_order` | number | no — default indice 0–3 |

**Meta timing (`meta`):**

| Campo | Default | Descrizione |
|-------|---------|-------------|
| `start_countdown_seconds` | 5 | Countdown prima del quiz |
| `theme_intro_seconds` | 4 | Slide intro manche |
| `question_timer_seconds` | 15 | Timer risposta |
| `results_seconds` | 6 | Slide risultati domanda |

### Esempio minimale

```json
{
  "format": "love_roulette_generatore_v1",
  "version": 1,
  "manche": [
    {
      "id": "manche_lifestyle",
      "order": 1,
      "theme_title": "Stile di vita",
      "theme_subtitle": "Abitudini e serate",
      "questions": [
        {
          "id": "q01",
          "body": "La serata ideale per te è...",
          "category": "lifestyle",
          "weight": 1,
          "options": [
            { "id": "a", "label": "Discoteca fino all'alba", "sort_order": 0 },
            { "id": "b", "label": "Cena romantica a lume di candela", "sort_order": 1 },
            { "id": "c", "label": "Serata Netflix sul divano", "sort_order": 2 },
            { "id": "d", "label": "Avventura all'aperto", "sort_order": 3 }
          ]
        }
      ]
    }
  ],
  "meta": {
    "start_countdown_seconds": 5,
    "theme_intro_seconds": 4,
    "question_timer_seconds": 15,
    "results_seconds": 6
  }
}
```

### Comportamento import

1. Valida formato, versione e struttura (4 opzioni per domanda).
2. Imposta `is_active = false` su tutte le domande evento attive.
3. Inserisce nuove domande e opzioni in `love_roulette_questions` / `love_roulette_question_options`.
4. Salva in `events.metadata`:
   - `love_roulette_manche` — array `{ mancheId, order, title, subtitle, questionIds }`
   - `love_roulette_quiz_timing` — timing da `meta`
5. Se c'era un quiz in corso (`love_roulette_quiz`), lo resetta.

### Comportamento export

- Se esiste `love_roulette_manche` in metadata, esporta quella struttura con domande attive.
- Altrimenti raggruppa per `category` (fallback legacy).

**Round-trip:** testi, ordine manche, titoli tema e opzioni sono preservati. Gli UUID domanda/opzione in export **cambiano** a ogni import (l'editor può tenere i propri id logici nel file sorgente).

---

## Endpoint HTTP

### `GET /api/events/{code}/generatore`

Esporta il documento manche corrente.

**Risposta 200:**

```json
{
  "ok": true,
  "document": { "...": "love_roulette_generatore_v1" }
}
```

**Errori:** `400` slug invalido · `401` non autorizzato · `404` evento · `503` errore server

---

### `POST /api/events/{code}/generatore`

Corpo JSON: comando con discriminant `action`.

**Risposta comune:**

```json
{ "ok": true, "...": "payload specifico azione" }
```

```json
{ "ok": false, "error": "messaggio" }
```

#### Comandi

| `action` | Auth | Descrizione |
|----------|------|-------------|
| `import_manche` | sì | Importa documento manche |
| `export_manche` | sì | Stesso payload di GET |
| `get_quiz_state` | sì | Stato quiz + `runtimeState` evento |
| `start_quiz` | sì | Avvia sessione quiz (`runtimeState: quiz`) |
| `advance` | sì | Domanda / fase successiva |
| `tick` | **no** | Aggiorna timer fase corrente |
| `skip_phase` | sì | Salta fase display corrente |
| `finish` | sì | Termina quiz |

---

## Esempi curl — DEMO01

Sostituisci `http://localhost:3000` con l'URL deploy. PIN demo seed: `123456`.

### Export manche (GET)

```bash
curl -sS \
  -H "X-Animator-Pin: 123456" \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Export manche (POST)

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d '{"action":"export_manche"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Import manche

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d "{\"action\":\"import_manche\",\"document\":$(cat web/data/generatore/example-manche-v1.json)}" \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

Risposta attesa:

```json
{
  "ok": true,
  "imported": {
    "mancheCount": 2,
    "questionCount": 3
  }
}
```

### Stato quiz

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d '{"action":"get_quiz_state"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Avvia quiz

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d '{"action":"start_quiz"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Tick timer (pubblico)

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"tick"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Avanza domanda / fase

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d '{"action":"advance"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Salta fase

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d '{"action":"skip_phase"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Termina quiz

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-Animator-Pin: 123456" \
  -d '{"action":"finish"}' \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

### Con API key Generatore (alternativa al PIN)

```bash
curl -sS \
  -H "X-Generatore-Key: your-secret-key" \
  "http://localhost:3000/api/events/DEMO01/generatore" | jq .
```

---

## Note integrazione editor esterno

1. **Workflow consigliato:** `export_manche` → modifica offline → `import_manche` → `get_quiz_state` / `start_quiz` durante la serata.
2. **Id stabili:** usa `manche[].id` e `questions[].id` come chiavi editor; dopo import ignora gli UUID in risposta export e rimappa se necessario sul contenuto (body + label opzioni).
3. **Ordine:** rispetta `manche[].order`; le domande seguono l'ordine nell'array `questions`.
4. **Categorie:** allineate a [docs/06-question-bank.md](./06-question-bank.md) (`lifestyle`, `romantic`, `adventure`, `values`, `fun`, `intimacy`).
5. **Display sync:** il proiettore su `/s/{code}/display` reagisce a `runtimeState` e metadata quiz; usa `tick` a ~1 Hz in fase quiz o lascia al client display il polling esistente.
6. **Admin UI:** stessi endpoint usati da `/admin/DEMO01` → pannello Generatore (import file / export download).
7. **Codice sorgente:** `web/src/app/api/events/[code]/generatore/route.ts`, `web/src/lib/generatore/manche.ts`, `web/src/lib/generatore/types.ts`.

---

## Riferimenti

- Setup evento demo: [15-test-event-setup.md](./15-test-event-setup.md)
- Banca domande / categorie: [06-question-bank.md](./06-question-bank.md)
- API quiz legacy (admin): `POST /api/events/{code}/quiz` — preferire `/generatore` per l'editor esterno
