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

1. **Import Generatore (consigliato in produzione)**  
   Admin → **Generatore** → **Import** → file `web/data/generatore/DEMO01-manche-full-v1.json` (27 domande, evento `DEMO01`). Le domande vengono scritte su `love_roulette_questions` per l’evento.

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

Per ogni domanda il pulsante **AVANTI** in regia avanza **fase per fase**, non salta alla domanda successiva.

| Fase (`displayPhase`) | Proiettore | Mobile |
|-----------------------|------------|--------|
| **Tema** (`theme_intro`) | Slide manche / categoria | «Guarda il proiettore» |
| **Domanda** (`question`) | Solo testo domanda | Leggi — risposte tra poco |
| **Domanda + risposte** (`answers`) | Domanda + opzioni + countdown footer | Puoi rispondere |
| **Risultati %** (`results`) | Percentuali in sala + gong | Tempo scaduto |
| **Prossima domanda** (`next_question`) | Slide transizione | Attesa prossima domanda |

Sequenza: `theme_intro → question → answers → results → next_question →` (indice++) `theme_intro → …`

Con **Autoplay** attivo, ogni fase scade da sola al termine del timer configurato. **AVANTI** forza il passaggio immediato (`skipPhase`).

Ogni fase quiz ha un **sottofondo distinto** sul proiettore (tinta, glow e intensità ruota/video).

---

## Audio: gong a fine countdown risposte

Il gong suona **solo** quando scade il timer della fase **Domanda + risposte** (`answers`) — non se l’animatore salta con AVANTI prima dello zero, non in fase risultati.

Pitch del sample: **−24 semitoni** (più grave). File: `LR_Quiz_Question_Gong` in `music/dark_fuchsia/stingers/`.

Quando il proiettore passa a **results** (dopo il gong), compaiono le percentuali in sala.
