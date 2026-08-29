---
name: store-release
description: >-
  Google Play listing + EAS Android build/submit for Love Roulette.
  Use when shipping Play Console, store/android, play-submit, eas-android-build,
  or Android store listing. For Apple Submit for Review use apple-release.
---

# Store release (Play + link Apple)

Automazione **Android / Play**. Per iOS (TestFlight, App Review, Age Rating, review notes) usa **sempre** [`.cursor/skills/apple-release/SKILL.md`](../apple-release/SKILL.md) e la regola `apple-release.mdc`.

**VAI** in questo repo = commit / merge / push e, se tocca `mobile/`, TestFlight via Xcode. Non è Submit for Review né upload Play.

Package Android: `it.musicproeventi.loveroulette`  
Nome store: **Love Roulette** — plancia animatore per serata live, **non** gioco d’azzardo. Simulated Gambling = None (come Apple).

## Google Play — setup una tantum

1. Crea l’app su **Play Console** (package `it.musicproeventi.loveroulette`)
2. **Setup → API access** → collega Google Cloud → **Create service account**
3. Concedi permesso **Release to internal testing** (o superiore)
4. Scarica JSON → es. `~/.config/loveroulette/play-service-account.json` (mai in git)
5. Copia `.env.play.example` → `.env.play` (se presente) e punta al JSON:

```bash
PLAY_SERVICE_ACCOUNT_JSON=/Users/TUO/.config/loveroulette/play-service-account.json
PLAY_TRACK=internal
```

6. Compila la scheda store (titolo, short, full) da `store/android/it-IT/` — incolla a mano su Play finché non c’è Supply API
7. Asset grafici (icona, feature graphic, screenshot) e questionario contenuti restano **manuali** in Play Console

## Google — testi versionati

| File | Campo Play |
| --- | --- |
| `store/android/it-IT/title.txt` | Titolo (~30 caratteri) |
| `store/android/it-IT/short_description.txt` | Descrizione breve (max 80) |
| `store/android/it-IT/full_description.txt` | Descrizione completa |

Messaggio listing: plancia / regia serata live. **Non** casino, scommesse o gambling.

## Google — comandi (dalla root del repo)

```bash
# Build AAB su EAS cloud
bash scripts/eas-android-build.sh --no-wait

# Dopo build completata: upload su Play (track da .env.play, default internal)
bash scripts/play-submit.sh
```

Non inventare credenziali. Non committare `.env.play` né il JSON del service account.

## Flusso tipico 1.0.x (Android)

1. Aggiorna `store/android/it-IT/` se cambiano titolo/descrizioni
2. Setup Play una tantum fatto (app + API access + SA)
3. `bash scripts/eas-android-build.sh` → attendi AAB
4. `bash scripts/play-submit.sh` → track internal (poi promuovi a mano)
5. In parallelo iOS: VAI / `scripts/xcode-testflight.sh` + skill **apple-release** per Submit for Review

## Apple (rimando)

Non duplicare qui la checklist ASC. Prima di “è pronta per lo Store” iOS: skill **apple-release**, `review-notes.template.txt`, Simulated Gambling = None.
