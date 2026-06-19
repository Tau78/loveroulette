# Love Roulette — Banca Domande

> Modulo 06 · Template domande, categorie, branching, pool taggato  
> Versione: 2.1 · Giugno 2026 · Pool `pool_v2026_06` (50 domande)

## 1. Linee guida contenuto

### Tono (decisione documentata)

- **Divertito e ironico**, mai volgare o esplicito sessualmente
- Adatto a serata 18+ in locale pubblico
- Domande inclusivi: evitare stereotipi di genere rigidi
- Linguaggio: **italiano** (v1)
- 4 opzioni sempre **bilanciate** (nessuna "ovvia" risposta "giusta")

### Struttura domanda

```json
{
  "id": "q01",
  "body": "La serata ideale per te è...",
  "category": "lifestyle",
  "weight": 1.0,
  "options": [
    { "id": "a", "label": "Discoteca fino all'alba" },
    { "id": "b", "label": "Cena romantica a lume di candela" },
    { "id": "c", "label": "Serata Netflix sul divano" },
    { "id": "d", "label": "Avventura all'aperto" }
  ]
}
```

---

## 2. Categorie (per algoritmo avanzato)

| Categoria | Descrizione | Peso default |
|-----------|-------------|--------------|
| `lifestyle` | Abitudini, serate, cibo | 1.0 |
| `romantic` | Relazioni, gesti, sentimenti | 1.2 |
| `adventure` | Viaggi, rischio, spontaneità | 1.0 |
| `values` | Famiglia, carriera, priorità | 1.1 |
| `fun` | Ironia, situazioni buffe | 0.8 |
| `intimacy` | Vicinanza emotiva (non esplicita) | 1.2 |

---

## 3. Set esempio leggibile (27 domande)

> Il pool operativo completo (50 domande con metadata per l'engine adattivo) è in [§4](#4-pool-50-domande-taggate). Schema tag e import: [§5](#5-versioning-pool-e-import).

### Lifestyle (Q1–Q6)

**Q1.** La serata ideale per te è...
- A) Discoteca fino all'alba
- B) Cena romantica a lume di candela
- C) Serata Netflix sul divano
- D) Avventura all'aperto

**Q2.** Come ti prepari per uscire?
- A) Ore davanti allo specchio
- B) Dieci minuti e via
- C) Chiedo consiglio a un amico
- D) Dipende dall'umore

**Q3.** Il tuo piatto preferito per un primo appuntamento è...
- A) Pizza e birra
- B) Sushi elegante
- C) Cucina casalinga
- D) Tapas da condividere

**Q4.** Domenica mattina tipica?
- A) Sport o passeggiata
- B) Dormire fino a mezzogiorno
- C) Brunch con amici
- D) Progetti creativi

**Q5.** In vacanza preferisci...
- A) Mare e relax totale
- B) Città d'arte e musei
- C) Trekking e natura
- D) Feste e nightlife

**Q6.** Il tuo drink signature è...
- A) Spritz o cocktail
- B) Vino rosso
- C) Birra artigianale
- D) Analcolico creativo

### Romantic (Q7–Q12)

**Q7.** Cosa ti fa innamorare per primo?
- A) Il sorriso
- B) L'intelligenza
- C) Il senso dell'umorismo
- D) La sicurezza in sé

**Q8.** Il gesto romantico perfetto?
- A) Lettera scritta a mano
- B) Sorpresa last-minute
- C) Guardare le stelle insieme
- D) Ballare in salotto

**Q9.** In una relazione cosa non può mancare?
- A) Fiducia totale
- B) Risate ogni giorno
- C) Spazio personale
- D) Passione

**Q10.** Primo appuntamento: chi paga?
- A) Offro sempre io
- B) Alla romana
- C) Chi ha proposto paga
- D) A turni

**Q11.** Quanto sei geloso/a?
- A) Per niente
- B) Un po', è segno di cura
- C) Solo se c'è motivo
- D) Preferisco non rispondere

**Q12.** L'anniversario ideale si festeggia...
- A) Cena stellata
- B) Viaggio sorpresa
- C) Serata semplice a casa
- D) Con amici, festa grande

### Adventure (Q13–Q17)

**Q13.** Ti lanceresti con il paracadute?
- A) Già fatto!
- B) Assolutamente sì
- C) Forse... con qualcuno accanto
- D) Mai nella vita

**Q14.** Decisioni importanti le prendi...
- A) Col cuore
- B) Con la testa
- C) Chiedendo consiglio
- D) All'ultimo momento

**Q15.** Preferisci pianificare o improvvisare?
- A) Tutto pianificato
- B) Mix equilibrato
- C) Totalmente spontaneo
- D) Dipende dal contesto

**Q16.** Ti piacerebbe vivere all'estero?
- A) Già ci ho pensato seriamente
- B) Per un periodo sì
- C) Solo in vacanza lunga
- D) Casa mia è qui

**Q17.** Sport o attività che ti attira di più?
- A) Danza
- B) Escursionismo
- C) Palestra
- D) Nessuno, sono un divano

### Values (Q18–Q22)

**Q18.** Tra 5 anni ti vedi...
- A) Con famiglia
- B) Carriera al top
- C) Viaggiando il mondo
- D) Non ci ho pensato

**Q19.** Cosa conta di più?
- A) Stabilità
- B) Libertà
- C) Successo
- D) Felicità quotidiana

**Q20.** Quanto spesso vedi i tuoi genitori?
- A) Ogni settimana
- B) Una volta al mese
- C) Solo le feste
- D) Vivo lontano

**Q21.** Animali domestici?
- A) Ho già un pet
- B) Ne voglio assolutamente uno
- C) Mi piacciono ma non li avrei
- D) Allergico/indifferente

**Q22.** Politica e attualità...
- A) Seguo tutto da vicino
- B) Solo i grandi temi
- C) Preferisco evitare
- D) Ne parlo solo con amici

### Fun (Q23–Q27)

**Q23.** Se fossi un personaggio di film romantico...
- A) Il bad boy con cuore d'oro
- B) La romantica sognatrice
- C) Il comico della situazione
- D) L'eroe silenzioso

**Q24.** Karaoke: ci saliresti?
- A) Primo in fila!
- B) Solo se obbligato
- C) Mai, morirei di imbarazzo
- D) Solo dopo qualche drink

**Q25.** Il tuo superpotere ideale in coppia?
- A) Leggere nel pensiero
- B) Teletrasporto
- C) Capire sempre l'umore
- D) Non ne ho bisogno

**Q26.** Messaggio perfetto a mezzanotte?
- A) "Stai dormendo?"
- B) "Non vedo l'ora di rivederti"
- C) Meme divertente
- D) Nessuno, a quell'ora dormo

**Q27.** Se vincessi il buono vacanza stasera...
- A) Partirei domani con chi ho accanto
- B) Chiamerei il mio migliore amico
- C) Organizzerei un viaggio di gruppo
- D) Lo metterei da parte e pianificherei

---

## 4. Pool 50 domande taggate

Pool curato per l'[Adaptive Session Engine](10-adaptive-questions-mobile.md): 27 domande base (Q1–Q27) + **23 nuove** (Q28–Q50). Nessun duplicato semantico con il set esempio sopra.

### Legenda metadata

| Campo | Tipo | Valori / note |
|-------|------|----------------|
| `mood[]` | string[] | `relax`, `romance`, `spicy` — allineati agli slider animatore |
| `energy` | int 1–5 | 1 = calmo · 5 = adrenalinico |
| `intimacy_level` | int 1–3 | 1 = leggero · 2 = emotivo · 3 = vulnerabile (mai esplicito) |
| `category` | string | `lifestyle`, `romantic`, `adventure`, `values`, `fun`, `intimacy` |
| `pairing_weight` | float | Peso nel matching weighted (default 1.0; romantic/intimacy spesso 1.2) |
| `phase_hint` | string | `warmup`, `build`, `peak`, `cooldown`, `any` — suggerimento ordine sessione |
| `tags[]` | string[] | Filtri engine: es. `icebreaker`, `flirt-soft`, `spicy-l1`, `matching-strong` |

Domande `spicy` nel pool v2026_06 sono **Spicy L1** (flirt leggero, PG-18). Spicy L2 richiede unlock animatore — vedi [10-adaptive-questions-mobile.md](10-adaptive-questions-mobile.md).

### Array import-ready (`pool_v2026_06`)

```json
{
  "pool_id": "pool_v2026_06",
  "locale": "it",
  "question_count": 50,
  "questions": [
    {
      "id": "q01",
      "body": "La serata ideale per te è...",
      "options": [
        { "id": "a", "label": "Discoteca fino all'alba" },
        { "id": "b", "label": "Cena romantica a lume di candela" },
        { "id": "c", "label": "Serata Netflix sul divano" },
        { "id": "d", "label": "Avventura all'aperto" }
      ],
      "mood": ["relax", "romance"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["icebreaker", "serata", "lifestyle"]
    },
    {
      "id": "q02",
      "body": "Come ti prepari per uscire?",
      "options": [
        { "id": "a", "label": "Ore davanti allo specchio" },
        { "id": "b", "label": "Dieci minuti e via" },
        { "id": "c", "label": "Chiedo consiglio a un amico" },
        { "id": "d", "label": "Dipende dall'umore" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["abitudini", "icebreaker"]
    },
    {
      "id": "q03",
      "body": "Il tuo piatto preferito per un primo appuntamento è...",
      "options": [
        { "id": "a", "label": "Pizza e birra" },
        { "id": "b", "label": "Sushi elegante" },
        { "id": "c", "label": "Cucina casalinga" },
        { "id": "d", "label": "Tapas da condividere" }
      ],
      "mood": ["relax", "romance"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["appuntamento", "cibo"]
    },
    {
      "id": "q04",
      "body": "Domenica mattina tipica?",
      "options": [
        { "id": "a", "label": "Sport o passeggiata" },
        { "id": "b", "label": "Dormire fino a mezzogiorno" },
        { "id": "c", "label": "Brunch con amici" },
        { "id": "d", "label": "Progetti creativi" }
      ],
      "mood": ["relax"],
      "energy": 1,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["abitudini", "weekend"]
    },
    {
      "id": "q05",
      "body": "In vacanza preferisci...",
      "options": [
        { "id": "a", "label": "Mare e relax totale" },
        { "id": "b", "label": "Città d'arte e musei" },
        { "id": "c", "label": "Trekking e natura" },
        { "id": "d", "label": "Feste e nightlife" }
      ],
      "mood": ["relax", "romance"],
      "energy": 3,
      "intimacy_level": 1,
      "category": "adventure",
      "pairing_weight": 1.0,
      "phase_hint": "build",
      "tags": ["viaggio", "matching-strong"]
    },
    {
      "id": "q06",
      "body": "Il tuo drink signature è...",
      "options": [
        { "id": "a", "label": "Spritz o cocktail" },
        { "id": "b", "label": "Vino rosso" },
        { "id": "c", "label": "Birra artigianale" },
        { "id": "d", "label": "Analcolico creativo" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["serata", "social"]
    },
    {
      "id": "q07",
      "body": "Cosa ti fa innamorare per primo?",
      "options": [
        { "id": "a", "label": "Il sorriso" },
        { "id": "b", "label": "L'intelligenza" },
        { "id": "c", "label": "Il senso dell'umorismo" },
        { "id": "d", "label": "La sicurezza in sé" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["attrazione", "matching-strong", "branch-parent"]
    },
    {
      "id": "q08",
      "body": "Il gesto romantico perfetto?",
      "options": [
        { "id": "a", "label": "Lettera scritta a mano" },
        { "id": "b", "label": "Sorpresa last-minute" },
        { "id": "c", "label": "Guardare le stelle insieme" },
        { "id": "d", "label": "Ballare in salotto" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["gesti", "romantic"]
    },
    {
      "id": "q09",
      "body": "In una relazione cosa non può mancare?",
      "options": [
        { "id": "a", "label": "Fiducia totale" },
        { "id": "b", "label": "Risate ogni giorno" },
        { "id": "c", "label": "Spazio personale" },
        { "id": "d", "label": "Passione" }
      ],
      "mood": ["romance"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["relazione", "matching-strong"]
    },
    {
      "id": "q10",
      "body": "Primo appuntamento: chi paga?",
      "options": [
        { "id": "a", "label": "Offro sempre io" },
        { "id": "b", "label": "Alla romana" },
        { "id": "c", "label": "Chi ha proposto paga" },
        { "id": "d", "label": "A turni" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "build",
      "tags": ["appuntamento", "valori"]
    },
    {
      "id": "q11",
      "body": "Quanto sei geloso/a?",
      "options": [
        { "id": "a", "label": "Per niente" },
        { "id": "b", "label": "Un po', è segno di cura" },
        { "id": "c", "label": "Solo se c'è motivo" },
        { "id": "d", "label": "Preferisco non rispondere" }
      ],
      "mood": ["romance"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["relazione", "trust"]
    },
    {
      "id": "q12",
      "body": "L'anniversario ideale si festeggia...",
      "options": [
        { "id": "a", "label": "Cena stellata" },
        { "id": "b", "label": "Viaggio sorpresa" },
        { "id": "c", "label": "Serata semplice a casa" },
        { "id": "d", "label": "Con amici, festa grande" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["gesti", "festa"]
    },
    {
      "id": "q13",
      "body": "Ti lanceresti con il paracadute?",
      "options": [
        { "id": "a", "label": "Già fatto!" },
        { "id": "b", "label": "Assolutamente sì" },
        { "id": "c", "label": "Forse... con qualcuno accanto" },
        { "id": "d", "label": "Mai nella vita" }
      ],
      "mood": ["relax"],
      "energy": 4,
      "intimacy_level": 1,
      "category": "adventure",
      "pairing_weight": 1.0,
      "phase_hint": "build",
      "tags": ["avventura", "branch-parent"]
    },
    {
      "id": "q14",
      "body": "Decisioni importanti le prendi...",
      "options": [
        { "id": "a", "label": "Col cuore" },
        { "id": "b", "label": "Con la testa" },
        { "id": "c", "label": "Chiedendo consiglio" },
        { "id": "d", "label": "All'ultimo momento" }
      ],
      "mood": ["relax"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "build",
      "tags": ["decisioni", "valori"]
    },
    {
      "id": "q15",
      "body": "Preferisci pianificare o improvvisare?",
      "options": [
        { "id": "a", "label": "Tutto pianificato" },
        { "id": "b", "label": "Mix equilibrato" },
        { "id": "c", "label": "Totalmente spontaneo" },
        { "id": "d", "label": "Dipende dal contesto" }
      ],
      "mood": ["relax"],
      "energy": 3,
      "intimacy_level": 1,
      "category": "adventure",
      "pairing_weight": 1.0,
      "phase_hint": "any",
      "tags": ["stile-vita", "matching-strong"]
    },
    {
      "id": "q16",
      "body": "Ti piacerebbe vivere all'estero?",
      "options": [
        { "id": "a", "label": "Già ci ho pensato seriamente" },
        { "id": "b", "label": "Per un periodo sì" },
        { "id": "c", "label": "Solo in vacanza lunga" },
        { "id": "d", "label": "Casa mia è qui" }
      ],
      "mood": ["relax"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "build",
      "tags": ["futuro", "viaggio"]
    },
    {
      "id": "q17",
      "body": "Sport o attività che ti attira di più?",
      "options": [
        { "id": "a", "label": "Danza" },
        { "id": "b", "label": "Escursionismo" },
        { "id": "c", "label": "Palestra" },
        { "id": "d", "label": "Nessuno, sono un divano" }
      ],
      "mood": ["relax"],
      "energy": 3,
      "intimacy_level": 1,
      "category": "adventure",
      "pairing_weight": 1.0,
      "phase_hint": "any",
      "tags": ["sport", "social"]
    },
    {
      "id": "q18",
      "body": "Tra 5 anni ti vedi...",
      "options": [
        { "id": "a", "label": "Con famiglia" },
        { "id": "b", "label": "Carriera al top" },
        { "id": "c", "label": "Viaggiando il mondo" },
        { "id": "d", "label": "Non ci ho pensato" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "peak",
      "tags": ["futuro", "matching-strong"]
    },
    {
      "id": "q19",
      "body": "Cosa conta di più?",
      "options": [
        { "id": "a", "label": "Stabilità" },
        { "id": "b", "label": "Libertà" },
        { "id": "c", "label": "Successo" },
        { "id": "d", "label": "Felicità quotidiana" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "peak",
      "tags": ["valori", "matching-strong"]
    },
    {
      "id": "q20",
      "body": "Quanto spesso vedi i tuoi genitori?",
      "options": [
        { "id": "a", "label": "Ogni settimana" },
        { "id": "b", "label": "Una volta al mese" },
        { "id": "c", "label": "Solo le feste" },
        { "id": "d", "label": "Vivo lontano" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "build",
      "tags": ["famiglia"]
    },
    {
      "id": "q21",
      "body": "Animali domestici?",
      "options": [
        { "id": "a", "label": "Ho già un pet" },
        { "id": "b", "label": "Ne voglio assolutamente uno" },
        { "id": "c", "label": "Mi piacciono ma non li avrei" },
        { "id": "d", "label": "Allergico/indifferente" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "any",
      "tags": ["casa", "pet"]
    },
    {
      "id": "q22",
      "body": "Politica e attualità...",
      "options": [
        { "id": "a", "label": "Seguo tutto da vicino" },
        { "id": "b", "label": "Solo i grandi temi" },
        { "id": "c", "label": "Preferisco evitare" },
        { "id": "d", "label": "Ne parlo solo con amici" }
      ],
      "mood": ["relax"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "cooldown",
      "tags": ["attualità", "social"]
    },
    {
      "id": "q23",
      "body": "Se fossi un personaggio di film romantico...",
      "options": [
        { "id": "a", "label": "Il bad boy con cuore d'oro" },
        { "id": "b", "label": "La romantica sognatrice" },
        { "id": "c", "label": "Il comico della situazione" },
        { "id": "d", "label": "L'eroe silenzioso" }
      ],
      "mood": ["relax", "romance"],
      "energy": 3,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "warmup",
      "tags": ["cinema", "ironico"]
    },
    {
      "id": "q24",
      "body": "Karaoke: ci saliresti?",
      "options": [
        { "id": "a", "label": "Primo in fila!" },
        { "id": "b", "label": "Solo se obbligato" },
        { "id": "c", "label": "Mai, morirei di imbarazzo" },
        { "id": "d", "label": "Solo dopo qualche drink" }
      ],
      "mood": ["relax"],
      "energy": 4,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "peak",
      "tags": ["palco", "social", "energia-alta"]
    },
    {
      "id": "q25",
      "body": "Il tuo superpotere ideale in coppia?",
      "options": [
        { "id": "a", "label": "Leggere nel pensiero" },
        { "id": "b", "label": "Teletrasporto" },
        { "id": "c", "label": "Capire sempre l'umore" },
        { "id": "d", "label": "Non ne ho bisogno" }
      ],
      "mood": ["romance"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "build",
      "tags": ["fantasy", "coppia"]
    },
    {
      "id": "q26",
      "body": "Messaggio perfetto a mezzanotte?",
      "options": [
        { "id": "a", "label": "\"Stai dormendo?\"" },
        { "id": "b", "label": "\"Non vedo l'ora di rivederti\"" },
        { "id": "c", "label": "Meme divertente" },
        { "id": "d", "label": "Nessuno, a quell'ora dormo" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "peak",
      "tags": ["messaggi", "flirt-soft", "spicy-l1"]
    },
    {
      "id": "q27",
      "body": "Se vincessi il buono vacanza stasera...",
      "options": [
        { "id": "a", "label": "Partirei domani con chi ho accanto" },
        { "id": "b", "label": "Chiamerei il mio migliore amico" },
        { "id": "c", "label": "Organizzerei un viaggio di gruppo" },
        { "id": "d", "label": "Lo metterei da parte e pianificherei" }
      ],
      "mood": ["relax", "romance"],
      "energy": 4,
      "intimacy_level": 2,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "peak",
      "tags": ["premio", "meta-gioco", "viaggio"]
    },
    {
      "id": "q28",
      "body": "Il piano perfetto dopo una giornata lunga...",
      "options": [
        { "id": "a", "label": "Doccia e divano, zero parole" },
        { "id": "b", "label": "Aperitivo con chi mi fa stare bene" },
        { "id": "c", "label": "Passeggiata lenta all'aperto" },
        { "id": "d", "label": "Playlist e cucinare qualcosa di semplice" }
      ],
      "mood": ["relax"],
      "energy": 1,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["chill", "routine", "nuovo-pool"]
    },
    {
      "id": "q29",
      "body": "Preferisci alba o mezzanotte per una sorpresa romantica?",
      "options": [
        { "id": "a", "label": "Alba — silenzio e caffè" },
        { "id": "b", "label": "Mezzanotte — luci e mistero" },
        { "id": "c", "label": "Tramonto, classico intramontabile" },
        { "id": "d", "label": "Sorpresa a pranzo, sono pratico/a" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["gesti", "timing", "nuovo-pool"]
    },
    {
      "id": "q30",
      "body": "Profumo o fragranza: cosa ti rappresenta di più?",
      "options": [
        { "id": "a", "label": "Fresco e pulito" },
        { "id": "b", "label": "Speziato e avvolgente" },
        { "id": "c", "label": "Leggero e agrumato" },
        { "id": "d", "label": "Ne uso poco, contano le azioni" }
      ],
      "mood": ["relax", "romance"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["sensoriale", "nuovo-pool"]
    },
    {
      "id": "q31",
      "body": "In treno o al cinema prendi...",
      "options": [
        { "id": "a", "label": "Finestrino — controllo del panorama" },
        { "id": "b", "label": "Corridoio — libertà di movimento" },
        { "id": "c", "label": "Centro — equilibrio totale" },
        { "id": "d", "label": "Dove c'è la presa per il telefono" }
      ],
      "mood": ["relax"],
      "energy": 1,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "warmup",
      "tags": ["preferenze", "ironico", "nuovo-pool"]
    },
    {
      "id": "q32",
      "body": "Cucinare insieme: chi comanda in cucina?",
      "options": [
        { "id": "a", "label": "Io — ricetta sacra" },
        { "id": "b", "label": "L'altro — mi rilasso" },
        { "id": "c", "label": "Teamwork caotico" },
        { "id": "d", "label": "Ordiniamo, siamo onesti" }
      ],
      "mood": ["relax", "romance"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "lifestyle",
      "pairing_weight": 1.0,
      "phase_hint": "build",
      "tags": ["coppia", "casa", "nuovo-pool"]
    },
    {
      "id": "q33",
      "body": "Dettaglio che ti conquista al primo incontro?",
      "options": [
        { "id": "a", "label": "Ascolta davvero quello che dici" },
        { "id": "b", "label": "Fa una battuta azzeccata" },
        { "id": "c", "label": "Ricorda un piccolo dettaglio" },
        { "id": "d", "label": "Ha le mani ferme e lo sguardo presente" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["attrazione", "matching-strong", "nuovo-pool"]
    },
    {
      "id": "q34",
      "body": "Appuntamento sotto la pioggia: cosa fai?",
      "options": [
        { "id": "a", "label": "Resto fuori finché non sono fradicio/a" },
        { "id": "b", "label": "Rifugio romantico sotto un portico" },
        { "id": "c", "label": "Corsa verso il taxi più vicino" },
        { "id": "d", "label": "Rido e cambio programma al volo" }
      ],
      "mood": ["romance"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["gesti", "improvviso", "nuovo-pool"]
    },
    {
      "id": "q35",
      "body": "\"Ti amo\": lo dici per primo o aspetti?",
      "options": [
        { "id": "a", "label": "Lo dico quando lo sento, senza timer" },
        { "id": "b", "label": "Aspetto segnali chiari" },
        { "id": "c", "label": "Preferisco dimostrarlo, non dirlo" },
        { "id": "d", "label": "Dipende — a volte scherzo, a volte sul serio" }
      ],
      "mood": ["romance"],
      "energy": 3,
      "intimacy_level": 3,
      "category": "intimacy",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["vulnerabilità", "matching-strong", "nuovo-pool"]
    },
    {
      "id": "q36",
      "body": "Regalo di coppia perfetto (budget basso)...",
      "options": [
        { "id": "a", "label": "Lettera o collage di ricordi" },
        { "id": "b", "label": "Serata a tema fatta in casa" },
        { "id": "c", "label": "Piantina o foto stampata" },
        { "id": "d", "label": "Coupon \"IO devo qualcosa\" valido 1 anno" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["gesti", "creativo", "nuovo-pool"]
    },
    {
      "id": "q37",
      "body": "Contatto fisico quotidiano in coppia: quanto conta?",
      "options": [
        { "id": "a", "label": "Essenziale — abbraccio, mano, vicinanza" },
        { "id": "b", "label": "Importante ma non ossessivo" },
        { "id": "c", "label": "Conta la qualità, non la quantità" },
        { "id": "d", "label": "Preferisco spazio e segnali verbali" }
      ],
      "mood": ["romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "intimacy",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["touch", "relazione", "nuovo-pool"]
    },
    {
      "id": "q38",
      "body": "Complimento che preferisci ricevere?",
      "options": [
        { "id": "a", "label": "Sulla voce" },
        { "id": "b", "label": "Sulla risata" },
        { "id": "c", "label": "Sull'energia che porti in sala" },
        { "id": "d", "label": "Sul modo in cui ascolti" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "intimacy",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q39",
      "body": "Per flirtare preferisci...",
      "options": [
        { "id": "a", "label": "Sguardo fisso e silenzio complice" },
        { "id": "b", "label": "Sorriso misterioso e battuta leggera" },
        { "id": "c", "label": "Domande personali ma giocose" },
        { "id": "d", "label": "Prossimità senza troppe parole" }
      ],
      "mood": ["spicy"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "intimacy",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q40",
      "body": "Ballo lento a metà serata: ci saliresti?",
      "options": [
        { "id": "a", "label": "Subito, anche senza musica giusta" },
        { "id": "b", "label": "Solo se mi chiedono" },
        { "id": "c", "label": "Preferisco guardare e ridere" },
        { "id": "d", "label": "Sì, ma solo con la persona giusta" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["palco", "flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q41",
      "body": "Per staccare con qualcuno sei più...",
      "options": [
        { "id": "a", "label": "Micino — dolce e graduale" },
        { "id": "b", "label": "Leone — diretto/a e chiaro/a" },
        { "id": "c", "label": "Fantasma — sparisco educatamente" },
        { "id": "d", "label": "Amico/a per sempre, anche se non scatta" }
      ],
      "mood": ["spicy"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "cooldown",
      "tags": ["ironico", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q42",
      "body": "Pelle d'oca: cosa te la fa venire di più?",
      "options": [
        { "id": "a", "label": "Un sussurro all'orecchio" },
        { "id": "b", "label": "Una frase sincera detta al momento giusto" },
        { "id": "c", "label": "Un tocco leggero sulla schiena" },
        { "id": "d", "label": "Una canzone che ci lega a un ricordo" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 3,
      "intimacy_level": 2,
      "category": "intimacy",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["sensoriale", "flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q43",
      "body": "Quanto tempo prima presenti qualcuno agli amici?",
      "options": [
        { "id": "a", "label": "Al secondo appuntamento, siamo transparent" },
        { "id": "b", "label": "Quando è serio — settimane o mesi" },
        { "id": "c", "label": "Mai in fretta, proteggo la privacy" },
        { "id": "d", "label": "Subito, i miei amici sono giuria d'assise" }
      ],
      "mood": ["relax", "romance"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "values",
      "pairing_weight": 1.1,
      "phase_hint": "build",
      "tags": ["social", "relazione", "nuovo-pool"]
    },
    {
      "id": "q44",
      "body": "Condividere il dessert al ristorante?",
      "options": [
        { "id": "a", "label": "Sempre — è mezzo bacio anticipato" },
        { "id": "b", "label": "Solo se è davvero buono" },
        { "id": "c", "label": "No, il mio tiramisù è intoccabile" },
        { "id": "d", "label": "Ordiniamo due e assaggiamo a vicenda" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "any",
      "tags": ["cibo", "flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q45",
      "body": "Se il partner russasse da record olimpico...",
      "options": [
        { "id": "a", "label": "Tappi fori e amore — resisto" },
        { "id": "b", "label": "Nudge gentile e cuscino extra" },
        { "id": "c", "label": "Divano d'emergenza senza drammi" },
        { "id": "d", "label": "Registro audio per blackmail affettuosa" }
      ],
      "mood": ["relax"],
      "energy": 3,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "cooldown",
      "tags": ["ironico", "coppia", "nuovo-pool"]
    },
    {
      "id": "q46",
      "body": "Cosa non daresti MAI del partner, neanche scherzando?",
      "options": [
        { "id": "a", "label": "Il cibo dal piatto" },
        { "id": "b", "label": "L'ultimo pezzo di pizza" },
        { "id": "c", "label": "Il telefono sbloccato" },
        { "id": "d", "label": "Il controllo del telecomando" }
      ],
      "mood": ["relax"],
      "energy": 3,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "cooldown",
      "tags": ["ironico", "coppia", "nuovo-pool"]
    },
    {
      "id": "q47",
      "body": "Challenge in sala: preferiresti...",
      "options": [
        { "id": "a", "label": "Imitare un film d'amore iconico" },
        { "id": "b", "label": "Improvvisare una storia assurda a due" },
        { "id": "c", "label": "Ballo coreografato lampo" },
        { "id": "d", "label": "Quiz lampo sul partner accanto" }
      ],
      "mood": ["relax"],
      "energy": 4,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "peak",
      "tags": ["palco", "meta-gioco", "energia-alta", "nuovo-pool"]
    },
    {
      "id": "q48",
      "body": "Per fare colpo al primo messaggio preferisci...",
      "options": [
        { "id": "a", "label": "Messaggio vocale caldo" },
        { "id": "b", "label": "Testo breve e spiritoso" },
        { "id": "c", "label": "GIF perfetta, zero parole" },
        { "id": "d", "label": "Domanda curiosa su di loro" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 2,
      "intimacy_level": 2,
      "category": "romantic",
      "pairing_weight": 1.2,
      "phase_hint": "build",
      "tags": ["messaggi", "flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q49",
      "body": "Ti piace quando qualcuno ordina lo stesso drink che hai scelto?",
      "options": [
        { "id": "a", "label": "Adorabile — siamo già in sintonia" },
        { "id": "b", "label": "Carino, ma voglio il mio gusto" },
        { "id": "c", "label": "Sospetto — mi stanno copiando?" },
        { "id": "d", "label": "Propongo subito un brindisi" }
      ],
      "mood": ["spicy"],
      "energy": 2,
      "intimacy_level": 1,
      "category": "fun",
      "pairing_weight": 0.8,
      "phase_hint": "any",
      "tags": ["social", "flirt-soft", "spicy-l1", "nuovo-pool"]
    },
    {
      "id": "q50",
      "body": "Piccola ossessione che riveleresti solo a chi ti piace?",
      "options": [
        { "id": "a", "label": "Playlist segreta di guilty pleasure" },
        { "id": "b", "label": "Colleziono meme da mandare a una sola persona" },
        { "id": "c", "label": "Rileggo le chat per analizzare ogni emoji" },
        { "id": "d", "label": "Ho già immaginato il nostro viaggio insieme" }
      ],
      "mood": ["romance", "spicy"],
      "energy": 3,
      "intimacy_level": 3,
      "category": "intimacy",
      "pairing_weight": 1.2,
      "phase_hint": "peak",
      "tags": ["vulnerabilità", "flirt-soft", "spicy-l1", "matching-strong", "nuovo-pool"]
    }
  ]
}
```

### Riepilogo pool `pool_v2026_06`

| Metrica | Valore |
|---------|--------|
| Domande totali | **50** (q01–q50) |
| Da set esempio §3 | 27 |
| Nuove (q28–q50) | **23** |
| Mood `relax` | 27 |
| Mood `romance` | 28 |
| Mood `spicy` (L1) | 10 |
| `phase_hint` peak | 15 |

---

## 5. Versioning pool e import

### Identificativo pool

| Campo | Valore |
|-------|--------|
| `pool_id` | `pool_v2026_06` |
| Release | Giugno 2026 |
| Locale | `it` |
| Stato | Curato — pronto seed M1 / engine adattivo M2 |

Convenzione versioni: `pool_vYYYY_MM` (es. `pool_v2026_09` per espansione a 100+ domande). Ogni release incrementa solo il pool globale; gli eventi in corso restano legati al `pool_id` attivo al momento del `start_quiz`.

### Formato import admin (esteso)

File consigliato: `web/data/pools/pool_v2026_06.json` (copia dell'array §4).

```json
{
  "pool_id": "pool_v2026_06",
  "version": 1,
  "locale": "it",
  "published_at": "2026-06-19",
  "questions": [ /* 50 oggetti come §4 */ ],
  "branching": [
    {
      "parent_question_id": "q07",
      "trigger_option_id": "b",
      "next_question_id": "q07b"
    },
    {
      "parent_question_id": "q13",
      "trigger_option_id": "a",
      "next_question_id": "q13b"
    }
  ],
  "meta": {
    "min_active_per_event": 24,
    "max_active_per_event": 27,
    "spicy_l2_in_pool": false
  }
}
```

### Pipeline import

1. **Validazione** — 4 opzioni, `id` univoci, `mood`/`category` ammessi, tono PG-18 (validator in [10-adaptive-questions-mobile.md](10-adaptive-questions-mobile.md) §2).
2. **Upsert pool globale** — tabella `question_pool` (schema: [11-db-schema-adaptive.md](11-db-schema-adaptive.md)).
3. **Binding evento** — `event_session_slots` referenzia `question_id` dal pool; animatore può forzare ordine via mixer.
4. **Rollback** — mantenere JSON precedente in `web/data/pools/`; switch `pool_id` in config evento.

Import legacy M1 (solo set fisso per evento, senza tag) resta supportato — vedi blocco sotto.

### Import legacy (set per evento)

```json
{
  "version": 1,
  "questions": [ /* array domande */ ],
  "branching": [
    {
      "parent_question_id": "q07",
      "trigger_option_id": "b",
      "next_question_id": "q07b"
    }
  ]
}
```

---

## 6. Esempi branching

### Esempio 1 — Follow-up romantico

```
Q7 (romantic) → se risposta B "intelligenza"
  → Q7b: "Cosa consideri un segno di intelligenza?"
```

### Esempio 2 — Percorso avventura

```
Q13 (adventure) → se risposta A o B "paracadute sì"
  → Q13b: "Qual è la prossima sfida che vorresti affrontare?"
```

### Regole branching

- Max 3 domande branch per evento (non rallentare quiz)
- Domande branch hanno `weight: 1.5` nel matching
- Animatore può disabilitare branching per serata

---

## 7. Review checklist contenuti

Prima di ogni serata, animatore/cliente verifica:

- [ ] Nessuna domanda ambigua o offensiva
- [ ] 4 opzioni per ogni domanda
- [ ] Minimo 24 domande attive (pool `pool_v2026_06` ne offre 50)
- [ ] Metadata mood/phase coerenti con preset animatore (vedi [10-adaptive-questions-mobile.md](10-adaptive-questions-mobile.md))
- [ ] Branching testato (se attivo)
- [ ] Pesi categorie coerenti con tipo serata

---

## 8. Riferimenti

- Game design quiz → [01-game-design.md](01-game-design.md)
- Feature CRUD → [04-features.md](04-features.md)
- Engine adattivo, mood slider, validator metadata → [10-adaptive-questions-mobile.md](10-adaptive-questions-mobile.md)
- Schema DB pool globale → [11-db-schema-adaptive.md](11-db-schema-adaptive.md)
