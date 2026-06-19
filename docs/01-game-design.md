# Love Roulette — Game Design

> Modulo 01 · Fasi, regole, flusso animatore  
> Versione: 2.0 · Giugno 2026

## 1. Visione del prodotto

**Love Roulette** è un gioco interattivo live per serate single in sala. Ogni partecipante gioca individualmente (nessuna squadra), risponde a un quiz di profilazione, viene accoppiato algoritmicamente con il sesso opposto, e partecipa a uno show guidato dall'animatore fino alla proclamazione della coppia vincitrice (premio: Buono Vacanza).

### Principi fondamentali

- **Singolo, non squadra**: un nickname = un giocatore = un smartphone.
- **Animatore al centro**: il ritmo della serata è controllato dalla dashboard admin.
- **Suspense controllata**: l'affinità reale è calcolata in backend; la presentazione può essere random o ordinata (scelta animatore).
- **Spettacolo + dati**: il gioco deve funzionare sul palco e sul proiettore, non solo sui telefoni.

---

## 2. Ruoli

| Ruolo | Dispositivo | Permessi |
|-------|-------------|----------|
| **Animatore (Admin)** | Tablet/PC | Controllo totale flusso, domande, estrazione, votazioni, moderazione chat |
| **Giocatore attivo** | Smartphone | Quiz, feedback presenza, chat (se abilitata) |
| **Finalista** | Smartphone + palco | Partecipa alle prove; non vota |
| **Pubblico votante** | Smartphone | Vota coppie finaliste (esclusi i 6 finalisti) |
| **Giuria (opzionale)** | Smartphone/tablet staff | Voto aggiuntivo con peso configurabile |
| **Display sala** | Proiettore/TV | Animazioni, coppie, stats opzionali |

---

## 3. State machine evento

```
LOBBY → QUIZ → MATCHING → EXTRACTION → ELIMINATION → FINALS → VOTING → WINNER → CLOSED
```

### Stati e transizioni

| Stato | Descrizione | Transizione (trigger animatore) |
|-------|-------------|--------------------------------|
| `LOBBY` | Pre-serata: chat, check-in badge, attesa | `start_quiz` |
| `QUIZ` | Domande 24–27, risposta multipla (4 opzioni) | `end_quiz` (auto quando tutti completano o timeout) |
| `MATCHING` | Backend calcola affinità M×F, genera classifica | Automatico → `EXTRACTION` |
| `EXTRACTION` | Roulette + estrazione coppie (modalità scelta) | `next_couple` fino a esaurimento / `start_elimination` |
| `ELIMINATION` | Sfoltimento dal basso classifica fino a top 3 | Automatico o step-by-step con `avanti` |
| `FINALS` | Prove sul palco (ordine configurabile) | Per ogni prova: `open_voting` → `close_voting` → `next_challenge` |
| `VOTING` | Sotto-stato durante ogni prova | Integrato in FINALS |
| `WINNER` | Proclamazione vincitore + premio | `close_event` |
| `CLOSED` | Serata conclusa, export dati | — |

### Modalità rehearsal

L'animatore può attivare **Rehearsal Mode**: simula il flusso con giocatori fittizi senza persistere voti reali. Utile per prova tecnica pre-serata.

---

## 4. Fasi di gioco (dettaglio)

### Fase 0 — Pre-serata (20:30, opzionale)

- Giocatori **pre-registrati** accedono via URL evento.
- **Chat** attivabile: messaggi anonimi tra registrati.
- Animatore può: filtrare, evidenziare messaggi ("popup carini"), disattivare in pausa.
- **Badge fisico**: staff consegna pettorina a cuore con QR/codice → collegamento profilo in app.

### Fase 1 — Profilazione (Quiz)

- **24–27 domande** a risposta multipla (4 opzioni ciascuna).
- Modelli supportati (tutti implementabili):
  - Set fisso identico ogni serata
  - Set configurabile da admin (CRUD)
  - Branching dinamico in base a risposte precedenti
  - Override realtime: skip, aggiungi, modifica ordine
- Dopo ogni domanda (configurabile per serata):
  - Stats su dashboard animatore
  - Stats su proiettore
  - Feedback giocatore ("X% ha risposto come te")
- Risposte salvate per `player_id` + `question_id`.

### Fase 2 — Matching

- Incrocio **tutti M × tutte F** presenti in sala.
- Punteggio affinità 0–100% (default: % risposte identiche, peso uguale).
- Modalità avanzate (configurabili): pesi per domanda, categorie, breakdown trasparente in dashboard.
- Output: classifica ordinata decrescente, persistita in sessione.
- **Non visibile ai giocatori** durante estrazione (salvo modalità "classifica").

### Fase 3 — Estrazione coppie

Animatore sceglie **modalità estrazione** da dashboard:

| Modalità | Comportamento |
|----------|---------------|
| **Random** | Ogni `Avanti` estrae coppia casuale dalla lista calcolata (non ordine classifica) |
| **Classifica** | Presenta dal basso verso l'alto (affinità crescente) |
| **Ibrido** | N estrazioni random, poi passaggio a classifica/eliminazione |
| **Numero custom** | Animatore imposta quante coppie mostrare prima dello sfoltimento |

**UX display**: animazione roulette (cuori rotanti) → stop → nickname coppia a schermo.

**Animatore in sala**: chiama i nickname, fa alzare i partecipanti, li fa incontrare visivamente.

### Fase 4 — Sfoltimento

- Dopo estrazioni, eliminazione progressiva dal **fondo classifica reale**.
- Ogni `Avanti` (modalità step) o automatico: una coppia eliminata → torna ai tavoli.
- Si ferma quando restano **3 coppie** (6 finalisti).

### Fase 5 — Finali e votazione

**Prove sul palco** (ordine **configurabile** per serata; default consigliato):

1. La Prova del Ballo
2. La Prova del Bacio
3. La Dichiarazione d'Amore
4. Posizione Kamasutra (mimata, vestiti, tono ironico)

Dopo ogni prova:
- Animatore apre finestra voto.
- **Pubblico** (tutti esclusi finalisti): 3 pulsanti Coppia 1 / 2 / 3.
- **Giuria opzionale**: voto staff con peso configurabile (es. pubblico 70%, giuria 30%).
- Sistema aggrega voti per prova e totale.

**Cambio UI smartphone**:
- Finalisti: schermata "Sei in finale!" + istruzioni palco.
- Esclusi: schermata voto (3 bottoni grandi).
- Durante pausa voto chiusa: attesa animata.

### Fase 6 — Vincitore

- Coppia con **maggior somma voti** (o regole spareggio — vedi §6).
- Animazione vincitore su proiettore.
- Premio: Buono Vacanza.

---

## 5. Regole di business

### Genere e accoppiamento

- Genere obbligatorio: `male` | `female`.
- Matching solo M×F (v1). Disparità numerica gestita: tutte le combinazioni possibili, classifica completa.
- Minimo consigliato: 6M + 6F (12 giocatori). Minimo assoluto per finali: 3M + 3F.

### Nickname e badge

- Pre-registrazione con nickname univoco per evento.
- Badge fisico con codice QR: collega pettorina ↔ profilo app.
- Fallback staff: assegna nick manualmente se QR non funziona.

### Voti

- 1 voto per prova per utente (rate limit server-side).
- Finalisti e giocatori non ancora "pubblico" non possono votare.
- Giuria: flag `is_jury` + peso in `events.config`.

### Parità voti (decisione documentata)

| Scenario | Regola default |
|----------|----------------|
| Parità totale finale | Animatore **spareggio manuale** da dashboard (selezione vincitore) |
| Parità su singola prova | Punti divisi equamente tra coppie ex-aequo |
| Alternativa configurabile | Prova extra "sudden death" attivabile da animatore |

---

## 6. Configurazione evento (`events.config`)

```json
{
  "extraction_mode": "random",
  "extraction_count": null,
  "challenge_order": ["dance", "kiss", "declaration", "kamasutra"],
  "stats_visibility": {
    "animator_dashboard": true,
    "projector": false,
    "player_feedback": true
  },
  "chat_enabled": true,
  "chat_anonymous": true,
  "jury_enabled": false,
  "jury_weight": 0.3,
  "public_weight": 0.7,
  "affinity_algorithm": "simple",
  "theme": "dark_fuchsia",
  "tie_breaker": "animator_manual",
  "question_mode": "fixed",
  "data_retention_days": 30
}
```

---

## 7. Metriche successo serata

- % giocatori che completano quiz (>90% target)
- Tempo medio fase quiz (<15 min)
- Latenza realtime display (<500ms)
- Zero voti duplicati accettati
- Animatore completa flusso senza intervento tecnico

---

## 8. Riferimenti incrociati

- UI/Temi → [02-design-system.md](02-design-system.md)
- Architettura → [03-architecture.md](03-architecture.md)
- Feature dettaglio → [04-features.md](04-features.md)
- Runbook animatore → [07-animator-runbook.md](07-animator-runbook.md)
