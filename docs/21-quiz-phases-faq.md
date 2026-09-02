# Love Roulette — FAQ quiz e fasi serata

> Modulo 21 · Perché vedo 5 domande? Timeline completa  
> Aggiornato: 2026-06-19

## Perché il quiz mostra solo 5 domande?

**Non è il numero “ufficiale” della serata.** In locale, se il pool domande su Supabase è vuoto, l’app usa un **fallback di sviluppo** con le prime 5 domande (Q1–Q5) hardcoded in `web/src/lib/musicpro/questions.ts` (`DEV_FALLBACK_QUESTIONS`).

Lo script demo `web/scripts/seed-demo-questions-only.sql` inserisce **solo Q1–Q5** nel pool — utile per smoke test, non per una serata reale.

| Situazione | Domande in quiz |
|------------|-----------------|
| Pool DB vuoto + `NODE_ENV=development` | 5 (fallback inline) |
| Seed demo SQL eseguito | 5 (pool Q1–Q5) |
| Pool / evento con set completo | 24–27 |
| Import manche da Generatore | Tutte quelle nel JSON importato |

**In dashboard animatore** la riga **«Domande caricate: N»** legge `GET /api/events/{code}/questions` e mostra quante domande il sistema userà per il prossimo avvio quiz.

---

## Come caricare il set completo (24–27 domande)

### Import automatico (default DEMO01)

All'apertura della dashboard admin, `GET /api/events/{code}/questions` esegue **automaticamente** l'import del bundle default se mancano domande o il contenuto è cambiato.

| Evento | Bundle default | Domande |
|--------|----------------|---------|
| **DEMO01** | `DEMO01-manche-full-v1.json` | 27 |

Metadata evento (opzionale):

- `generatore_auto_import: false` — disabilita auto-import (solo import manuale)
- `generatore_default_bundle: "DEMO01-manche-full-v1"` — bundle per altri eventi

Verifica in admin: **Domande caricate: 27 · bundle OK**.

### Import manuale (override)

1. **Import Generatore**  
   Admin → **Generatore** → **Importa manche** → file JSON (sovrascrive il bundle).

2. **Seed / pool Supabase**  
   Popola `love_roulette_question_pool` con `web/data/pools/pool_v2026_06.json` (50 domande da [06-question-bank.md](./06-question-bank.md) §4). All’avvio quiz il pool viene materializzato sull’evento.

3. **Verifica**  
   Controlla in admin che **Domande caricate** sia ≥ 24 prima di *Avvia quiz*.

---

## Il quiz è una sola fase della serata

Una serata Love Roulette **non** è solo il quiz. Il flusso runtime completo:

```
lobby → quiz → matching → extraction → elimination → finals → winner → closed
```

| Fase | Cosa succede |
|------|----------------|
| **Lobby** | Iscrizione, QR, chat |
| **Quiz** | 24–27 domande di affinità (questa fase!) |
| **Matching** | Calcolo coppie (automatico) |
| **Estrazione** | Sorteggio coppie una alla volta |
| **Eliminazione** | Sfoltimento fino ai top 3 |
| **Finali** | Prove palco (ballo, bacio, …) |
| **Vincitore** | Proclamazione e chiusura |

Quindi: **5 domande = ambiente demo / pool non popolato**, non la durata prevista di una serata reale. Per timeline operativa dell’animatore vedi [07-animator-runbook.md](./07-animator-runbook.md).

---

## Fasi di ogni domanda (proiettore + mobile)

Il pulsante **AVANTI** in regia guida la manche. Solo il countdown di avvio e il timer risposte si chiudono da soli.

| Passo | Regia | Proiettore | Tastiere |
|-------|--------|------------|----------|
| **0** | AVANTI lancia la **nuova manche** | Countdown 5 s (solo all’avvio quiz) | Bloccate |
| **1** | AVANTI | Slide argomento / tema | Bloccate |
| **2** | AVANTI | Testo domanda (+ media se presente), senza risposte | Bloccate |
| **3** | AVANTI | Opzioni + countdown | **Attive** |
| **4** | Automatico a fine timer | Stop visivo/sonoro | **Chiuse** |
| **5** | AVANTI | Percentuali in sala + SFX | Chiuse |
| **6** | AVANTI | Classifica di accoppiamento temporanea | Chiuse |
| **7** | AVANTI | Chiude la classifica → riparte dal passo **1** (slide argomento) | Chiuse |

Nuova manche / avvio quiz: `start_countdown → theme_intro → question → answers → results → …`

Domanda successiva: `theme_intro → question → answers → (lock) → results → next_question* → theme_intro`

Le **ultime N domande** (default **5**, impostabile in setup / Generatore `hide_ranking_last_n`) **saltano il punto 6** (classifica). Dopo i risultati si passa alla slide argomento successiva o al matching.

Con **Auto** acceso, le fasi in hold (tema, domanda, risultati, classifica) possono avanzare da sole. Il timer risposte **non** rivela mai le % da solo: serve AVANTI.

---

## Audio: gong a fine countdown risposte

Il gong suona **solo** quando scade il timer della fase **Domanda + risposte** (`answers`) — non se l’animatore salta con AVANTI prima dello zero, non in fase risultati.

Allineato al **countdown del proiettore**: stesso orologio `resolveSyncedQuizClock`, trigger quando `answers` arriva a remaining 0 (lock tastiere, overlay Stop). File: `LR_Quiz_Question_Gong` — [Pixabay Zildjian gong](https://pixabay.com/sound-effects/musical-old-zildjian-gong-quite-natural-34294/), trim ~4 s.

In fase **results** la colonna sonora passa a **`LR_25_Quiz_Results_Reveal`** (bed reveal %, crossfade ~1,5 s).

## Audio: sottofondo per tema manche

Durante **Tema** (`theme_intro`), **Domanda**, **Risposte** e **Prossima domanda**, il bed segue la **categoria** della domanda corrente (allineata alle slide tema Generatore: lifestyle, romantic, adventure, values, fun, intimacy).

Mapping in `web/src/lib/audio/quiz-theme-tracks.ts` — oggi tutte le categorie usano `LR_02_Quiz_Tension` finché non esporti loop SUNO dedicati per manche; aggiorna `QUIZ_THEME_BED_TRACK` + manifest quando pronti.

Quando il proiettore passa a **results** (dopo il gong), compaiono le percentuali in sala.
