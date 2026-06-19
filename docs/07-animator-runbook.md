# Love Roulette — Runbook Animatore

> Modulo 07 · Operatività sul campo, timeline, troubleshooting  
> Versione: 2.0 · Giugno 2026

## 1. Timeline serata tipo

| Orario | Fase | Azioni animatore |
|--------|------|------------------|
| 19:30 | Setup tecnico | Accendi proiettore, apri `/admin/{code}`, test display |
| 20:00 | Apertura sala | Mostra QR evento su proiettore, consegna badge |
| 20:15 | Pre-registrazione live | Aiuta chi non ha registrato (fallback staff) |
| 20:30 | LOBBY + Chat | Attiva chat, modera, popup messaggi divertenti |
| 20:45 | Briefing | Spiega regole: no squadre, quiz sincero, finali palco |
| 21:00 | QUIZ | `Start Quiz`, monitora completamento (target >90%) |
| 21:15 | MATCHING | Automatico; verifica coppie generate in dashboard |
| 21:20 | ESTRAZIONE | Modalità random, `AVANTI` per ogni coppia, chiama nick |
| 21:40 | ELIMINAZIONE | Sfoltimento fino a top 3, invita finalisti al palco |
| 21:50 | FINALE Prova 1 | Ballo — base musicale, poi `Open Voting` |
| 22:00 | FINALE Prova 2 | Bacio |
| 22:10 | FINALE Prova 3 | Dichiarazione |
| 22:20 | FINALE Prova 4 | Kamasutra mimato |
| 22:30 | VINCITORE | Proclama, premio, foto |
| 22:45 | Chiusura | `Close Event`, ringraziamenti |

*Timeline adattabile; durata quiz ed estrazione dipende da numero partecipanti.*

---

## 2. Setup pre-serata (T-60 min)

### Hardware

- [ ] Proiettore/TV collegato, risoluzione 1920×1080
- [ ] Display route aperta: `/s/{code}/display` (fullscreen F11)
- [ ] Tablet/PC animatore carico, connettività WiFi
- [ ] Backup: hotspot 4G/5G pronto
- [ ] Audio per prove (cavo jack o Bluetooth)

### Software

- [ ] Login dashboard admin verificato
- [ ] Evento in stato LOBBY
- [ ] Domande caricate (conteggio 24–27)
- [ ] Tema selezionato e verificato su proiettore
- [ ] Rehearsal completato (M3) o test rapido 3 device

### Materiali

- [ ] Badge pettorina a cuore stampati con QR
- [ ] Lista pre-registrati (export)
- [ ] Premio Buono Vacanza fisico
- [ ] Microfono animatore

---

## 3. Script animatore per fase

### LOBBY (20:30)

> "Benvenuti a Love Roulette! Niente squadre stasera: siete tutti single e giocate per voi. Prendete il badge con il cuore, inquadrate il QR col telefono, e aspettate che parta il quiz. Intanto scriveteci in chat — siete anonimi, divertitevi!"

### QUIZ (21:00)

> "Parte il quiz! 27 domande per scoprire la vostra anima gemella. Rispondete col cuore, non col cervello — il sistema fa il resto!"

**Monitora**: barra completamento dashboard. Se qualcuno è bloccato, aiuta in sala.

### ESTRAZIONE (21:20)

> "Il computer ha calcolato tutte le coppie possibili. Ora la roulette decide chi si incontra stasera!"

Premi **AVANTI** → attendi animazione → chiama nick → fai alzare e incontrare.

### ELIMINAZIONE (21:40)

> "Adesso eliminiamo le coppie meno compatibili... fino ai nostri tre finalisti!"

### FINALI (21:50+)

Per ogni prova:
1. Spiega regola prova
2. Finalisti eseguono
3. "Pubblico, prendete il telefono! Votate la coppia che..." 
4. `Open Voting` → 30 sec → `Close Voting`
5. Annuncia parzialmente (opzionale suspense)

### VINCITORE (22:30)

> "I campioni assoluti di Love Roulette sono... [NICK] & [NICK]! Buono vacanza per voi!"

---

## 4. Controlli dashboard — quick reference

| Situazione | Azione |
|------------|--------|
| Quiz non parte | Verifica stato LOBBY → click Start Quiz |
| Giocatore non in lista | Aggiungi manuale o re-scan badge |
| Display nero | Refresh `/display`, check Realtime connessione |
| Coppia già uscita | Normale in random; continua AVANTI |
| Voto non registrato | Verifica voting open + player role audience |
| Parità finale | Dashboard → Spareggio manuale |
| Chat inappropriate | Hide + ban se necessario |
| Emergenza reset fase | Admin → Reset to phase (con conferma) |

---

## 5. Troubleshooting

### WiFi instabile

1. Chiedi silenzio rete (meno streaming)
2. Attiva hotspot backup
3. Display: refresh pagina
4. Voti: se M3 attivo, coda offline sync automatico
5. Estendi tempo voto di 15 sec

### Giocatore senza smartphone

- Non può votare né fare quiz individualmente
- Opzioni: partner condivide (sconsigliato), staff inserisce risposte quiz pre-match (solo emergenza), escluso da votazione

### Disparità M/F (es. 14M / 16F)

- Sistema genera tutte le combinazioni possibili
- 14×16 = 224 coppie — estrazione più lunga
- Considera di non estrarre tutte (modalità count limit)

### Proiettore crop testo

- Verifica safe zone 5% margini
- Aumenta font size in settings display
- Tema con contrasto più alto

### Realtime lag

- Refresh display e admin
- Verifica Supabase status page
- Fallback: animatore annuncia coppie manualmente leggendo da dashboard

---

## 6. Regole spareggio (operativo)

1. **Parità su singola prova**: punti divisi ex-aequo
2. **Parità totale finale**: animatore seleziona vincitore da dashboard O avvia prova extra
3. Documentare decisione per export post-serata

---

## 7. Post-serata

- [ ] Export CSV risultati
- [ ] Screenshot vincitori (opzionale)
- [ ] `Close Event` entro 24h
- [ ] Verifica purge dati programmato (30gg)
- [ ] Debrief tecnico: problemi, tempi, feedback cliente

---

## 8. Contatti emergenza tecnica

| Ruolo | Contatto |
|-------|----------|
| Supporto tech | [da configurare] |
| Supabase status | status.supabase.com |
| Backup animatore | [secondo operatore] |

---

## 9. Riferimenti

- Checklist stampabile → [printable/checklist-animatore.md](printable/checklist-animatore.md)
- Game design → [01-game-design.md](01-game-design.md)
- Test scenari → [08-test-scenarios.md](08-test-scenarios.md)
