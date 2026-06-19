# Love Roulette — Funzionalità

> Modulo 04 · Feature complete v1 (roadmap per milestone)  
> Versione: 2.0 · Giugno 2026

## Legenda milestone

| Tag | Milestone |
|-----|-----------|
| M1 | Core Game — MVP giocabile |
| M2 | Social & Admin avanzato |
| M3 | Polish & Resilienza |

---

## 1. Pre-registrazione e accesso

### 1.1 Pre-registrazione (M1)

- URL: `/register/{eventCode}`
- Campi: email, nickname desiderato, genere (M/F)
- Consensi GDPR obbligatori (privacy + trattamento dati evento)
- Conferma email (magic link Supabase Auth)
- Nickname univoco per evento (constraint DB)

### 1.2 Join in sala (M1)

- URL: `/s/{eventCode}`
- Login con account pre-registrato
- Collegamento badge fisico:
  - Scan QR su pettorina → pre-compila `badge_code`
  - Oppure inserimento manuale codice (es. `#12`)
- Feedback presenza: nick + numero badge + stato "online" visibile ad animatore
- Fallback staff: animatore assegna nick da dashboard

### 1.3 Badge fisico (M2)

- Template stampabile pettorina a cuore con QR unique
- QR punta a `/s/{eventCode}?badge={code}`
- Codice badge ↔ player_id mapping in DB

---

## 2. Quiz e domande

### 2.1 Set fisso (M1)

- 24–27 domande seed per evento demo
- 4 opzioni ciascuna, ordine fisso
- Progress bar + contatore "Domanda X di Y"
- Blocco navigazione indietro (no cambio risposta) — configurabile

### 2.2 CRUD domande admin (M2)

- Dashboard: aggiungi/modifica/disattiva domande
- Campi: testo, 4 opzioni, categoria, peso, ordine
- Import/export JSON set domande
- Duplica set da evento precedente

### 2.3 Branching dinamico (M2)

- Regola: `if answer(option_id) on question_A → show question_B next`
- Albero domande validato (no cicli)
- Max depth branching: 5 livelli
- Fallback: domande non raggiunte = saltate nel matching

### 2.4 Override realtime animatore (M2)

- Durante QUIZ attivo:
  - **Skip**: salta domanda corrente per tutti
  - **Insert**: inserisce domanda extra in coda
  - **Pause**: congela timer (se presente)
- Broadcast `question_show` sincronizza tutti i client

### 2.5 Statistiche live (M2)

Configurabili per serata in `events.config.stats_visibility`:

| Target | Cosa mostra |
|--------|-------------|
| Dashboard animatore | % per ogni opzione, conteggio assoluto |
| Proiettore | Barre animate % aggregate |
| Giocatore | "Il 67% ha risposto come te" post-risposta |

---

## 3. Matching ed estrazione

### 3.1 Calcolo affinità (M1)

- Trigger automatico fine quiz (o manuale animatore)
- Algoritmo default: simple (% match)
- Output: tabella pairs ordinata, non esposta ai giocatori

### 3.2 Modalità estrazione (M1)

Animatore seleziona da dashboard:

- **Random**: pool coppie non ancora mostrate, pick random
- **Classifica**: prossima coppia per rank crescente (dal basso)
- **Ibrido**: N random poi classifica
- **Count limit**: mostra solo X coppie prima di eliminazione

### 3.3 Display roulette (M1)

- Route `/s/{code}/display` fullscreen
- Animazione + reveal nickname
- Opzione: mostrare/nascondere % affinità su display (default: nascosto)

### 3.4 Sfoltimento (M1)

- Automatico: elimina tutte tranne top 3 in sequenza animata
- Manuale: ogni `Avanti` elimina la coppia con rank peggiore tra non-finaliste
- Aggiorna ruolo giocatori: finalisti → `role=finalist`, altri → `role=audience`

---

## 4. Finali e votazione

### 4.1 Prove configurabili (M1)

- Lista prove in `events.config.challenge_order`
- Default: dance, kiss, declaration, kamasutra
- Animatore avanza prove manualmente
- Display mostra nome prova corrente

### 4.2 Voto pubblico (M1)

- Trigger: animatore `open_voting` / `close_voting`
- UI audience: 3 bottoni grandi con nick coppie finaliste
- 1 voto per prova per giocatore (unique constraint)
- Conteggio live su dashboard (non su proiettore per suspense)

### 4.3 Giuria opzionale (M3)

- Attivazione: `events.config.jury_enabled`
- Giuria = players con `role=jury` (assegnati da animatore)
- Voto: score 1–10 per coppia per prova, oppure singolo voto
- Pesi: `public_weight` + `jury_weight` (default 70/30)
- Formula: `total = public_votes × Wp + jury_score × Wj`

### 4.4 Proclamazione vincitore (M1)

- Somma voti tutte le prove
- Parità: spareggio manuale animatore (default) o prova extra (config)
- Schermata vincitore + export risultati

---

## 5. Chat e social

### 5.1 Chat pre-evento (M2)

- Attiva in stato LOBBY (default 20:30)
- Solo giocatori pre-registrati e joinati
- Modalità anonima: nick nascosto agli altri (visibile solo ad animatore)
- Modalità identificata: opzionale per serata

### 5.2 Moderazione (M2)

- Filtro parole vietate (lista configurabile)
- Animatore: hide, highlight (popup proiettore), ban player
- Popup messaggi "carini":
  - Manuale: animatore seleziona messaggio → fullscreen proiettore
  - Auto: random ogni X minuti (config `chat_auto_highlight_interval`)

### 5.3 Controllo chat (M2)

- Toggle on/off da dashboard
- Pausa durante quiz/finali (auto-disabilitata)
- Rate limit anti-spam

---

## 6. Dashboard animatore

### 6.1 Panoramica (M1)

- Stato evento corrente + timeline fasi
- Contatori: online, quiz completati, coppie estratte, voti
- Bottone AVANTI contestuale

### 6.2 Controlli per fase (M1–M3)

| Fase | Controlli |
|------|-----------|
| LOBBY | Start quiz, toggle chat, lista presenze |
| QUIZ | Skip/insert domanda (M2), forza fine quiz |
| EXTRACTION | Modalità, Avanti, anteprima display |
| ELIMINATION | Auto/manuale, Avanti |
| FINALS | Seleziona prova, open/close vote, spareggio |
| WINNER | Proclama, export, chiudi evento |

### 6.3 Rehearsal mode (M3)

- Simula giocatori bot (6–30)
- Avanza fasi senza persistere voti
- Reset rehearsal con un click

---

## 7. Display proiettore

| Feature | Milestone |
|---------|-----------|
| QR evento in lobby | M1 |
| Animazione roulette | M1 |
| Reveal coppie | M1 |
| Barra 3 finalisti | M1 |
| Stats % domande | M2 |
| Popup chat highlight | M2 |
| Countdown voto 3-2-1 | M1 |
| Schermata vincitore | M1 |
| Logo locale watermark | M3 |

---

## 8. Export e post-evento

### 8.1 Export CSV (M2)

- Coppie con score affinità
- Voti per prova
- Statistiche domande
- Lista partecipanti (senza email in export standard)

### 8.2 Retention dati (M1 config, M2 automation)

- Default: cancellazione dati personali 30 giorni post-evento
- Export obbligatorio prima purge (notifica animatore)
- Anonimizzazione chat: immediata opzione configurabile

---

## 9. PWA mobile

- Installabile home screen (manifest.json)
- Icona cuore brand
- Offline: shell cached (M3), voti in coda (M3)
- Notifiche push: out of scope v1

---

## 10. Matrice feature × milestone

| Feature | M1 | M2 | M3 |
|---------|:--:|:--:|:--:|
| Pre-reg + join | ✓ | | |
| Quiz fisso | ✓ | | |
| Matching simple | ✓ | | |
| Estrazione 3 modalità | ✓ | | |
| Display roulette | ✓ | | |
| Sfoltimento top 3 | ✓ | | |
| 4 prove + voto pubblico | ✓ | | |
| Tema Dark Fuchsia | ✓ | | |
| Chat completa | | ✓ | |
| CRUD + branching domande | | ✓ | |
| Stats live | | ✓ | |
| Badge QR | | ✓ | |
| Temi Romantic + Neon | | ✓ | |
| Giuria pesata | | | ✓ |
| Offline vote queue | | | ✓ |
| Affinity avanzato | | | ✓ |
| Rehearsal mode | | | ✓ |

---

## 11. Riferimenti

- Architettura → [03-architecture.md](03-architecture.md)
- Domande esempio → [06-question-bank.md](06-question-bank.md)
- Runbook → [07-animator-runbook.md](07-animator-runbook.md)
