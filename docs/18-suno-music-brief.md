# Love Roulette — SUNO Music Brief

> Modulo 18 · Prompt produzione soundtrack live  
> Versione: 1.0 · Giugno 2026

## Introduzione

Questo documento definisce la **colonna sonora ufficiale** di Love Roulette per serate live in sala: tracce loopabili per fasi lunghe (lobby, quiz, estrazione), stinger brevi per reveal e slide dinamiche, underscore per eliminazione e votazione, brani dedicati alle prove finali e un climax vincitori. I prompt sotto sono **copy-paste pronti per SUNO** (in inglese); l’animatore o il tech lead seleziona il **tema serata** (`dark_fuchsia` default, `romantic_elegant`, `neon_party`) e applica le varianti colore descritte in §4. Target: locali notturni, proiettore + PA sala, nessun vocal obbligatorio (vocals opzionali solo dove indicato).

**Riferimenti**: [01-game-design.md](01-game-design.md) · [02-design-system.md](02-design-system.md) · [07-animator-runbook.md](07-animator-runbook.md) · [12-slides-library.md](12-slides-library.md)

---

## 1. Tabella tracce

| Track name | Phase | Duration target | Mood | BPM range | When played | Loop |
|------------|-------|-----------------|------|-----------|-------------|------|
| `LR_01_Lobby_Ambient` | LOBBY | 3:00–4:00 (loop) | Warm anticipation, social buzz | 90–105 | 20:30 briefing → `start_quiz`; sotto chat e QR badge | **Yes** |
| `LR_02_Quiz_Tension` | QUIZ | 2:30–3:30 (loop) | Focused curiosity, light suspense | 100–118 | Tema + lettura domanda (`theme_intro`, `question`) | **Yes** |
| `LR_25_Quiz_Results_Reveal` | QUIZ | 0:45–1:00 (loop) | Satisfying stats reveal | 105–115 | Fase `results` — barre % in sala (dopo gong) | **Yes** |
| `LR_03_Quiz_Anticipation` | QUIZ | 1:30–2:00 (loop) | Rising heartbeat, “almost match” | 112–128 | Ultime 5 domande; slide `cd_matching_soon`, `wf_love_roulette_wink` | **Yes** |
| `LR_04_Matching_Transition` | MATCHING | 0:25–0:45 (one-shot) | Algorithmic mystery → reveal tease | 95–110 → 130 | Auto transizione `QUIZ → MATCHING`; backend calcolo affinità | **No** |
| `LR_05_Extraction_Underscore` | EXTRACTION | 2:00–3:00 (loop) | Game-show glamour, controlled hype | 118–124 | Tra una coppia e l’altra; animatore parla sopra | **Yes** |
| `LR_06_Extraction_Drumroll` | EXTRACTION | 0:12–0:20 (segment) | Roulette spin, nail-biting | 128–140 (accel) | Ogni tap **AVANTI** → sync spin 3–5 s (design system §5.1) | **Segment** |
| `LR_07_Extraction_Reveal` | EXTRACTION | 0:03–0:06 (stinger) | Ding + sparkle, couple spotlight | — (impact) | Stop roulette → nickname coppia fullscreen | **No** |
| `LR_08_Elimination_Tension` | ELIMINATION | 1:30–2:30 (loop) | Somber cut, ranking drama | 85–100 | Sfoltimento dal basso classifica fino a top 3 | **Yes** |
| `LR_09_Elimination_Drop` | ELIMINATION | 0:02–0:04 (SFX) | Whoosh down, fade couple bar | — | Coppia eliminata: fade out barra 800 ms | **No** |
| `LR_10_Finals_Dance` | FINALS | 3:00–4:00 (loop) | Upbeat dancefloor, show energy | 120–128 | Prova 1 — La Prova del Ballo (~21:50) | **Yes** |
| `LR_11_Finals_Romantic` | FINALS | 2:30–3:30 (loop) | Intimate, elegant, goosebumps | 70–90 | Prove 2–3 — Bacio + Dichiarazione d’Amore | **Yes** |
| `LR_12_Finals_Playful` | FINALS | 2:00–3:00 (loop) | Cheeky, ironic, spicy-but-classy | 105–115 | Prova 4 — Kamasutra mimato; slide `ms_spicy_unlock` | **Yes** |
| `LR_13_Voting_Countdown` | VOTING | 0:08–0:12 (one-shot) | 3-2-1 punch | 130–140 | `Open Voting` → countdown fullscreen proiettore | **No** |
| `LR_14_Voting_Suspense` | VOTING | 0:45–1:00 (loop) | Tight race, audience holds breath | 110–120 | Finestra voto ~30 s; slide `gm_vote_nail_biter` | **Yes** |
| `LR_15_Winner_Anthem` | WINNER | 2:30–3:30 (loop) | Triumph, confetti, vacation prize | 124–132 | Proclamazione coppia + premio Buono Vacanza | **Yes** |
| `LR_16_Winner_Stinger` | WINNER | 0:05–0:08 (stinger) | “VINCITORI!” impact hit | — | Primo frame animazione spotlight vincitori | **No** |
| `LR_17_Slide_Energy` | SLIDES | 0:04–0:07 (stinger) | Stats hype, consensus wave | 120–128 | `sr_consensus_wave`, `gm_online_surge`, `gm_quiz_wave` | **No** |
| `LR_18_Slide_Suspense` | SLIDES | 0:05–0:08 (stinger) | Plot twist, vote tie | 100–110 | `gm_vote_nail_biter`, `wf_plot_twist`, `wf_single_rebel` | **No** |
| `LR_19_Slide_Celebration` | SLIDES | 0:04–0:06 (stinger) | Random joy burst | 128–135 | `wf_confetti_random`, `ms_party_mode` | **No** |
| `LR_20_Phase_Transition` | SLIDES / TRANSITIONS | 0:06–0:10 (whoosh) | Phase banner, ceremonial handoff | 90–105 | `ac_phase_announce`, cambio stato dashboard | **No** |
| `LR_21_Closed_Outro` | CLOSED | 1:30–2:00 (fade) | Warm goodbye, afterglow | 80–95 | `close_event`, ringraziamenti animatore | **No** (fade out) |

**Totale tracce: 22** (incl. `LR_25` sotto-fase quiz)

---

## 2. Prompt SUNO per traccia

> **Convenzioni globali per tutti i prompt**
> - Aggiungere in coda se serve: ` instrumental only, no vocals ` oppure ` optional wordless female ahhs ` dove indicato.
> - Durata SUNO: generare **2× la durata target** e tagliare loop pulito in post (Audacity/Reaper).
> - Evitare lyrics esplicite; tono **PG-13**, ironico ma mai volgare.
> - Export consigliato: WAV 48 kHz 24-bit master → MP3 320 kbps per playback web.

> **SUNO — quale modalità usare (leggere prima di generare)**
>
> Suno ha **due prodotti diversi** nel menu Create → Custom. Se sbagli modalità, la durata nel prompt viene ignorata.
>
> | Obiettivo | Menu | Tipo / toggle | Durata tipica | Note |
> |-----------|------|---------------|---------------|------|
> | Loop lunghi (lobby, quiz, bed) | **Custom → Song** | **Instrumental = ON** | ~1–4 min (poi tagli loop) | Campo **Style of Music** + opzionale **Lyrics** con `[Verse]`/`[Instrumental]` |
> | Stinger 2–5 s (ding, hit, whoosh) | **Custom → Sounds** | **One-Shot** | **1–4 s** (fisso) | Ideale per `LR_07`, `LR_09`, slide stinger. **Non chiedere 12 s qui** — resterà ~2 s |
> | Segmento build 10–20 s (drumroll, countdown) | **Custom → Song** | **Instrumental = ON** | ~15–30 s generati | **Non usare Sounds One-Shot.** Usa Styles + Lyrics a sezioni (sotto) |
> | Sample ritmico loopabile | **Custom → Sounds** | **Loop** + BPM | variabile | Può aggiungere armonia/melodia indesiderata; preferire Song per drumroll |
>
> **Regola pratica Love Roulette**
> - **`LR_06` drumroll (12–18 s)** → **Song + Instrumental**, mai Sounds One-Shot.
> - **`LR_07` reveal (3–5 s)** → **Sounds One-Shot** *oppure* Song con Lyrics `[Hit]`/`[Decay]`/`[End]` (Prompt 1 v2 ha funzionato in Song).
> - Se Sounds One-Shot restituisce ~2 s nonostante «12 seconds» nel testo: **comportamento normale** — Suno Sounds non rispetta la durata numerica come un DAW.
>
> **Come ottenere 12–18 s in Song mode (Instrumental)**
> 1. Create → **Custom** → lasciare **Song** (non Sounds).
> 2. **Instrumental = ON**.
> 3. **Style of Music** — mood, strumenti, BPM, produzione (**no timeline**).
> 4. **Lyrics** — timeline a sezioni; Suno segue l’arco anche senza parole:
>    ```
>    [Instrumental]
>    [Intro — 3 seconds, soft snare rolls]
>    [Build — 6 seconds, accelerating snare, rising white noise]
>    [Peak — 3 seconds, maximum tension]
>    [Silence — hard stop, empty room]
>    [End]
>    ```
> 5. Chiedere **~30 s** in Style se serve margine; tagliare silenzio finale in Audacity/Reaper.
> 6. Suno restituisce **2 take** → salva `_A` e `_B`.
>
> **Sounds — quando usarlo davvero**
> - Prompt breve, vocabolario SFX: `cinematic whoosh`, `heavy door slam`, `deep 808 kick one shot`.
> - Durata: accettare ~1–4 s oppure provare «**5 second long** …» — risultato **non garantito**.
> - **One-Shot** = un colpo. **Loop** = ripetizione (attenzione: può generare mini-brano).
>
> Riferimento ufficiale: [Suno Sounds — help center](https://help.suno.com/en/articles/10625537).

> **SUNO Custom Song — stinger e segmenti corti (<20 s)**
>
> Un solo campo (Styles **o** Lyrics) spesso fallisce su percussion/SFX strutturati. Usare **entrambi**:
>
> | Campo | Cosa mettere |
> |-------|----------------|
> | **Styles** | Mood, strumenti, BPM, palette, produzione — *nessuna tempistica* |
> | **Lyrics** | Arco temporale a sezioni — tag `[Instrumental]`, `[Build]`, `[Peak]`, `[Silence]`; SUNO segue la narrativa anche senza parole |
>
> Impostare **Instrumental = ON**. Durata target: chiedere **~30 s** in Styles e tagliare a 15 s in post se serve il silenzio finale preciso.

---

### `LR_01_Lobby_Ambient`

**When**: pre-serata, chat anonima, attesa badge QR.

**Prompt 1**
```
Instrumental deep house lounge, warm sub bass, soft fuchsia-filtered synth pads, muted hi-hats, distant club crowd texture very low in mix, romantic late-night single mixer vibe, dark nightclub background #0D0D12, accent hits in hot pink #E91E8C, relaxed confident energy, 96 BPM, seamless loop, no vocals, production polished for live venue PA
```

**Prompt 2**
```
Ambient electronic slow burn, Rhodes piano chords, gentle four-on-the-floor kick barely audible, shimmering arpeggio in magenta tones, anticipation before a dating game show, cozy but sexy club atmosphere, 102 BPM, loopable 4-minute bed, instrumental only, no lead melody too catchy, mix leaves headroom for animator microphone
```

**Prompt 3**
```
Minimal nu-disco instrumental, warm analog bass, soft claps every 2 bars, neon heart motif on synth pluck, dark room pre-party energy, singles mingling, smooth and inviting not aggressive, 98 BPM, long intro suitable for crossfade loop, no vocals, no sudden drops
```

---

### `LR_02_Quiz_Tension`

**When**: domande profilazione 24–27, feedback % opzionale.

**Prompt 1** — *in repo (2026-06-19):* `LR_02_Quiz_Tension_A` ← SUNO «The Final Question (2)», `_B` ← «The Final Question (3)», primary **A**.

**Per manche/tema (2026-06-20):** il player usa `quiz-theme-tracks.ts` — una loop per categoria slide (`lifestyle`, `romantic`, …). Finora tutte puntano a LR_02; generare varianti SUNO per mood (es. romantic = ballad pulse, fun = uptempo) e aggiornare manifest + `QUIZ_THEME_BED_TRACK`.

```
Modern quiz show underscore, pulsing synth bass, ticking percussion subtle, rising curiosity tension, dark fuchsia club palette, syncopated hi-hats, game show intelligence vibe without cheesy TV sound, 108 BPM, instrumental loop, medium energy, leaves space for question text on screen, no vocals
```

**Prompt 2**
```
Electronic tension bed, muted kick pattern, plucked synth motif repeating every 8 bars, slight filter sweep every 16 bars, love compatibility test atmosphere, sleek and focused, 112 BPM, seamless loop 3 minutes, instrumental only, no big drops, background for smartphone taps
```

**Prompt 3**
```
Cinematic minimal techno-lite, heartbeat kick at 106 BPM, arpeggiated pink synth, low brass stabs very sparse, suspenseful but playful dating questionnaire mood, dark background mix, loop friendly, no vocals, no melody that competes with animator voice
```

---

### `LR_25_Quiz_Results_Reveal`

**When**: fase quiz `results` — barre percentuali in sala (dopo gong `LR_Quiz_Question_Gong`).

**Prompt 2 (Styles + Lyrics)** — *in repo (2026-06-19 v2):* `_A` ← «The Final Question (8)», `_B` ← «The Final Question (9)», primary **A**. Sostituisce take (6)/(7).

**Styles**
```
Instrumental only, no vocals. Game show results reveal bed, satisfying resolution after tension. Bright fuchsia synth swell, warm major chord lift, soft sparkle arpeggio, crowd-pleasing stats moment. 110 BPM, uplifting but short phrases 4 bars, loopable 60 seconds or clean 8-second arc. No big drop, no vocals, mix sits under percentage bars on screen
```

**Lyrics**
```
[Instrumental]

[Intro — held pad, anticipation release]

[Reveal — chord lift, sparkle pluck, positive game show ding energy without literal SFX]

[Sustain — gentle loop bed for 6 seconds on screen]

[Fade — optional tail for crossfade out]

[End]
```

**Prompt 1 (legacy)** — take (6)/(7), sostituite da Prompt 2.

```
Instrumental only, no vocals. Game show results reveal bed, satisfying resolution after tension. Bright fuchsia synth swell, warm major chord lift, soft sparkle arpeggio, crowd-pleasing stats moment. 110 BPM, uplifting but short phrases 4 bars, loopable 60 seconds or clean 8-second arc. No big drop, no vocals, mix sits under percentage bars on screen
```

---

### `LR_03_Quiz_Anticipation`

**When**: ultime 5 domande, slide “Quasi match!”.

**Prompt 1**
```
Building anticipation instrumental, tempo 118 BPM accelerating feel via rising white noise layer, heartbeat kick doubling, bright fuchsia lead synth entering bar 16, matchmaking countdown energy, dating roulette suspense, instrumental only, designed to loop but with clear 8-bar phrase for editor cuts
```

**Prompt 2**
```
Progressive house tension rise, snare roll every 32 bars subtle, bass gets fuller each section, romantic game show climax approaching, hot pink accent stabs, 124 BPM, no drop yet just continuous build loop, no vocals, club-ready mix
```

**Prompt 3**
```
Orchestral-electronic hybrid pulse, strings ostinato staccato, electronic kick joins, sense of destiny and matching algorithm about to run, emotional but controlled, 115 BPM, loop 90 seconds, instrumental, wordless tension not chaos
```

---

### `LR_04_Matching_Transition`

**When**: `end_quiz` → backend M×F matching (invisibile ai giocatori).

**Prompt 1**
```
Short cinematic transition 35 seconds, start mysterious digital glitch and data processing bleeps, morph into romantic swell with synth choir pad, love algorithm calculating pairs, dark to bright fuchsia gradient feel, 100 BPM opening to 128 BPM ending, instrumental, one-shot not loop, ends on held chord for extraction handoff
```

**Prompt 2**
```
30-second stinger suite, opening with muted CPU-style ticks and matrix math mood, mid section adds warm analog pad, final 8 bars introduce roulette wheel spin hint on percussion, dating app magic moment, no vocals, single play transition asset
```

**Prompt 3**
```
One-shot bridge music 40 seconds, ambient intro 10s then rising tom fills into euphoric instrumental hook 8 bars then fade, theme love roulette brand suspense, electronic orchestral, ends cleanly for animator to speak, no loop
```

---

### `LR_05_Extraction_Underscore`

**When**: pausa tra estrazioni, animatore chiama nickname.

**Prompt 1 (legacy)** — take «The Final Question (4)/(5)», sostituite da Prompt 2.

```
Glamorous game show underscore loop, 120 BPM four-on-the-floor, funky bass line, disco strings stabs every 4 bars, fuchsia and coral accent hits #E91E8C #FF4757, live dating lottery on stage energy, instrumental, medium-high energy but compressed dynamics for voice-over, seamless 2-minute loop, no vocals
```

**Prompt 2** — *in repo (2026-06-19 v2):* `_A` ← «Midnight Game Show», `_B` ← «Midnight Game Show (1)», primary **A**.

```
Nu-disco instrumental loop 122 BPM, tight groove, muted guitar chops, shuffling hi-hats, casino-meets-nightclub vibe without literal slot machine sounds, romantic game show presenter bed music, dark mix, loopable, no lead vocal
```

**Prompt 3**
```
French house influenced instrumental, filtered looped sample feel synthetic, sidechain pump gentle, celebratory couple reveal show pacing, pink neon accents, 118 BPM, 2:30 loop, instrumental only, keeps crowd moving between reveals
```

---

### `LR_06_Extraction_Drumroll`

**When**: roulette spin 3–5 s ogni **AVANTI**.

**Prompt 1 — *in repo (2026-06-20 v5):* `_A` ← SUNO «Empty Room Impact» (~**9,8 s**), `_B` ← «Empty Room Impact (1)» (~**9,2 s**), primary **A**. **Styles+Lyrics — pronti al live, no trim.** Archive: `P1_v4_*` Silent Tension Cue, `P1_v3_*`, `P1_legacy_*`, P2/P3 in candidates/.

**Prompt 1** — split SUNO Custom (Styles + Lyrics)

**Styles**
```
Instrumental only, no vocals, no melody. Game show lottery drumroll, SFX-like percussion segment. Soft snare rolls into thunderous fill, timpani, taiko layers. Dark fuchsia club tension, love roulette wheel spin suspense. 132 BPM accelerating crescendo. Modern cinematic percussion, polished live PA, not cheesy TV game show
```

**Lyrics**
```
[Instrumental]

[Intro — soft sparse snare rolls, quiet timpani, tense gaps between hits]

[Build — snare rolls accelerating, heartbeat kick enters, tension rising fast]

[Peak — thunderous drum fill, timpani and taiko slam, maximum suspense]

[Silence — sudden hard stop, complete silence, empty room]

[End]
```

**Prompt 1 (legacy — solo Styles, spesso insufficiente)**
```
15-second drumroll build instrumental, starting soft snare rolls accelerating to thunderous fill, timpani and taika layers, game show lottery spin tension, ends on sudden silence last 0.5 sec for reveal stinger, 132 BPM accelerating, no melody, no vocals, SFX-like musical segment
```

**Prompt 2 — *candidate in repo (2026-06-19 v2):* `P2_A` ← SUNO «The Reveal», `P2_B` ← «The Reveal (1)», ~**8,2 s** ciascuno — **pronti al live, no trim**. Orchestrale + ticking clock. Take precedente «Casino Roulette Tension Roll» in `P2_legacy_A`. Confronta vs Prompt 1 v3 in stingers/.

**Prompt 2**
```
Casino roulette tension roll 18 seconds, orchestral snare crescendo, heartbeat kick speeding up, subtle ticking clock, love roulette wheel spinning, dramatic peak then hard stop, instrumental only, designed as repeatable segment not full loop
```

**Prompt 3 — ⚠️ NON usare Custom → Sounds + One-Shot** (produce ~2 s). Usare **Song + Instrumental** come Prompt 1.

**Prompt 3 — *candidate in repo (2026-06-19):* `P3_A` ← SUNO «Rising Snare Vault» (~122 s), `P3_B` ← «Rising Snare Vault (1)» (~128 s). Styles+Lyrics Song mode — **tagliare 12–18 s** (Intro → Silence) in post. Electronic / white-noise vs orchestrale P2.

**Styles**
```
Instrumental only, no vocals, no melody. Electronic build-drop segment, rising white noise and snare pattern, 140 BPM feel, filter opening on synth, dating game roulette spin suspense, dark fuchsia club, maximum suspense then hard cut to silence, tight edit for animation sync, modern cinematic SFX segment not a full song
```

**Lyrics**
```
[Instrumental]

[Intro — 2 seconds, filtered noise bed, sparse snare taps]

[Build — 5 seconds, snare pattern accelerating, white noise rising, synth filter opening]

[Peak — 3 seconds, maximum suspense, full snare roll and noise peak]

[Silence — sudden hard stop, complete silence for reveal stinger]

[End]
```

**Prompt 3 (legacy — solo testo, per Sounds; atteso ~2 s, non adatto a LR_06)**
```
Electronic build-drop segment 12 seconds, rising white noise and snare pattern 140 BPM feel, filter opening on synth, maximum suspense 4 seconds then cut to silence, dating game extraction moment, no vocals, tight edit for animation sync
```

---

### `LR_07_Extraction_Reveal`

**When**: stop roulette → coppia a schermo + confetti leggeri.

**Prompt 1** — *in repo (2026-06-19 v2):* `_A` ← SUNO «Fuchsia Fanfare», `_B` ← «Fuchsia Fanfare (1)», primary **A**. Sostituisce take «Fuchsia Sparkle» (solo _A).

**Prompt 1 (Styles + Lyrics)**

**Styles**
```
Instrumental only, no vocals. Reveal stinger, bright major chord hit, sparkling bell arpeggio, short brass fanfare, fuchsia sparkle synth. Game show winner ding modernized, glossy confetti moment, romantic couple spotlight. Punchy impact, tail decay under 2 seconds, single strike not loop
```

**Lyrics**
```
[Instrumental]

[Hit — bright major chord impact, bells sparkle]

[Fanfare — short brass stab, fuchsia synth glitter]

[Decay — quick fade, silence]

[End]
```

**Prompt 1 (legacy)**
```
4-second reveal stinger, bright major chord hit, sparkling bell arpeggio, short brass fanfare, confetti moment, fuchsia sparkle synth, game show winner ding modernized, instrumental impact, no vocals, tail decay under 2 seconds for quick reset
```

**Prompt 2**
```
3-second cinematic hit, sub drop plus chime layer, romantic reveal sparkle, love connection found moment, glossy production, single strike not loop, instrumental only
```

**Prompt 3**
```
5-second celebratory sting, disco orchestra hit, handclaps on 2 and 4, pink noise sweep upward, couple spotlight on projector, short and punchy, no vocals
```

---

### `LR_08_Elimination_Tension`

**When**: sfoltimento coppie, restano top 3 finalisti.

**Prompt 1**
```
Dark elimination underscore loop 92 BPM, minor key, slow pulsing bass, sparse piano notes, emotional goodbye to couples leaving, ranking drama subtle not tragic, fuchsia accent on downbeat every 8 bars, instrumental, 2-minute seamless loop, no vocals, mix slightly quieter than extraction
```

**Prompt 2**
```
Ambient downtempo tension 88 BPM, deep sub drone, muted trap hi-hats, sense of narrowing field, survival game show elimination bed, dark club #1A1A24 surface tones, loopable, instrumental only, no sudden peaks
```

**Prompt 3**
```
Neo-noir lounge instrumental 95 BPM, upright bass, brushed drums, melancholic synth pad, couples sent back to tables mood, classy and restrained, loop 90 seconds, no vocals, space for animator announcements
```

---

### `LR_09_Elimination_Drop`

**When**: coppia eliminata, fade barra inferiore 800 ms.

**Prompt 1**
```
2.5-second elimination whoosh SFX musical, descending synth slide, soft sub drop, reverse cymbal into low thud, couple eliminated from ranking, dark fuchsia tail, instrumental, single hit no loop
```

**Prompt 2**
```
3-second downer sting, minor chord stab fading out, wind-down sweep, game show exit sound modern, short tail, no vocals, mix -6dB relative to reveal stinger
```

**Prompt 3**
```
Quick bass drop 2 seconds, vinyl stop effect subtle, emotional punctuation not harsh, elimination moment UI sync, instrumental only
```

---

### `LR_10_Finals_Dance`

**When**: Prova del Ballo — animatore può alzare volume PA.

**Prompt 1**
```
Upbeat dance pop instrumental 124 BPM, four-on-the-floor kick, funky bass, bright lead synth hooks, couples dance challenge on stage, club banger energy clean and fun, fuchsia filter sweeps, 3:30 loop, no vocals or optional wordless chants only, festival-ready mix
```

**Prompt 2**
```
Latin house dance track 126 BPM, percussive shakers, horn stabs, sexy but tasteful dancefloor vibe, live dating show ballo proof, instrumental loop 3 minutes, crowd clap sample very low, no lyrics
```

**Prompt 3**
```
EDM-pop instrumental 122 BPM, sidechain synths, drop every 32 bars moderate not overwhelming, stage dance competition energy, hot pink lead, loopable, no vocals, PA-friendly limited sub
```

---

### `LR_11_Finals_Romantic`

**When**: Prova del Bacio + Dichiarazione d’Amore.

**Prompt 1**
```
Romantic cinematic instrumental 78 BPM, soft piano, warm strings legato, gentle acoustic guitar fingerpicking, intimate love declaration mood, elegant not cheesy, 3-minute loop, optional wordless female ahhs very subtle, no lyrics, mix warm and wide
```

**Prompt 2**
```
Slow jam R&B instrumental 82 BPM, Rhodes chords, soft snap drums, sensual but classy, kiss and love letter challenge on stage, velvet night atmosphere, loop seamless, no lead vocal
```

**Prompt 3**
```
Orchestral pop ballad bed 85 BPM, harp glissandi sparse, cello melody, romantic tension goosebumps, dating game finale emotional peak, instrumental only, 2:30 loop, no sudden dynamics
```

---

### `LR_12_Finals_Playful`

**When**: Prova Kamasutra mimata, tono ironico PG-13.

**Prompt 1**
```
Quirky funk instrumental 108 BPM, playful bass line, muted trumpet stabs, cheeky dating game challenge vibe, spicy but classy ironic tone never explicit, wah guitar licks, 2:30 loop, no vocals, smirk energy
```

**Prompt 2**
```
Retro lounge funk 112 BPM, bossa nova brush drums hybrid, silly sexy game show parody mood tasteful, bouncy piano, pepper emoji energy without comedy sound effects, instrumental loop, no lyrics
```

**Prompt 3**
```
Electro-swing lite instrumental 110 BPM, swing drums sampled feel, plucky synth, fun final round mime challenge, crowd laughing friendly vibe, loop 2 minutes, no vocals
```

---

### `LR_13_Voting_Countdown`

**When**: countdown 3-2-1 prima apertura voti smartphone.

**Prompt 1**
```
10-second voting countdown instrumental, voiceless tom hits marking beats, rising pitch each bar, final bar orchestral hit on ONE, game show vote opening, 136 BPM strict pulse, one-shot, no spoken numbers in music leave room for UI
```

**Prompt 2**
```
8-second hype countdown bed, snare build every beat, synth riser, explosive final accent cut to silence for vote buttons appear, instrumental only, single play
```

**Prompt 3**
```
12-second clock tension, tick-tock percussion morphing to stadium stomp last 3 counts, audience vote moment, ends on impact, no vocals
```

**Status (2026-06-20):** *manifest placeholder* — path `stingers/LR_13_Voting_Countdown_{A,B}.mp3`; file SUNO **non ancora in repo**. Wiring audio: `playVotingSequence` su transizione `couple_reveal → voting`.

---

### `LR_14_Voting_Suspense`

**When**: finestra voto ~30 s, pareggio opzionale.

**Prompt 1**
```
Suspense loop 60 seconds 114 BPM, ticking hi-hat pattern, pulsing bass two notes only, tight vote race atmosphere, nail biter game show, dark mix minimal melody, seamless loop, instrumental, no vocals, tension not horror
```

**Prompt 2**
```
Minimal techno suspense bed 118 BPM, hypnotic groove, filter slowly opening over 30 seconds phrase, three couples voting drama, loop 45 seconds, instrumental only
```

**Prompt 3**
```
Orchestral suspense ostinato 110 BPM, repeating string pattern, timpani roll under, live audience voting on phones, 50-second loop, no vocals, moderate volume
```

**Status (2026-06-20):** *manifest placeholder* — path `loops/LR_14_Voting_Suspense_{A,B}.mp3`; file SUNO **non ancora in repo**. Bed attivo in `finalsShow.phase === "voting"` (~20 s).

---

### `LR_15_Winner_Anthem`

**When**: proclamazione vincitori + premio vacanza + confetti 5 s.

**Prompt 1 — *in repo (2026-06-19):* `_A` ← SUNO «Victory Confetti», ~**50 s**. `_B` = Prompt 2 «Love Roulette Champions» (~114 s) — vedi sotto.

**Prompt 1**
```
Victory anthem instrumental 128 BPM, euphoric four-on-the-floor, big supersaw chords, confetti celebration, vacation prize triumph, fuchsia to coral gradient energy #E91E8C #FF4757, 3-minute loop, optional wordless crowd chant hey-oh, no lyrics, festival drop every 16 bars bright not aggressive
```

**Prompt 2 — *in repo (2026-06-19):* `_B` ← SUNO «Love Roulette Champions», ~**114 s** (Prompt 2). Più vicino al target loop del brief vs `_A` Victory Confetti (~50 s).

**Prompt 2**
```
Stadium EDM victory track 130 BPM, uplifting melody, sidechain pump, winner couple spotlight, love roulette champions mood, instrumental loop 2:45, no vocals, PA punchy mids
```

**Prompt 3**
```
Orchestral-dance hybrid winner theme 126 BPM, brass fanfare hooks with electronic kick, emotional triumph romantic game show finale, loopable celebration bed, no lyrics, confetti-ready energy
```

---

### `LR_16_Winner_Stinger`

**When**: primo frame “VINCITORI!” + nick coppia.

**Prompt 1 — *in repo (2026-06-20):* `_A` ← «Confetti Strike» (~3,8 s), `_B` ← «Confetti Strike_1» (~4,6 s), primary **A**. Pronti al live.

**Prompt 1**
```
6-second winner impact stinger, massive chord hit, cymbal crash, sparkle arpeggio ascending, confetti burst sync, instrumental only, tail 2 seconds, louder peak asset in soundtrack pack
```

**Prompt 2 — *candidate in repo (2026-06-20):* `P2_A` ← «Grand Prize Reveal» (~9,6 s), `P2_B` ← «Grand Prize Reveal (1)» (~4,6 s). Confronta vs Confetti Strike (stingers/). **P2_B** più aderente al target 5 s.

**Prompt 2**
```
5-second victory fanfare modern, synth brass plus sub boom, game show grand prize reveal, single hit not loop, no vocals
```

**Prompt 3 — *candidate in repo (2026-06-20):* `P3_A` ← «Golden Moment» (~**7 s**, target brief), `P3_B` ← «Golden Moment (1)» (~14 s). Choir pad + clap — ottimo crossfade verso `LR_15`.

**Prompt 3**
```
7-second celebration hit, choir pad swell one chord, clap stack, golden moment spotlight, instrumental sting ends clean for anthem crossfade
```

---

### `LR_17_Slide_Energy`

**When**: slide stats hype (`sr_consensus_wave`, `gm_online_surge`, `gm_quiz_wave`).

**Prompt 1**
```
5-second energy stinger instrumental, upward synth riff, snare fill, stats reveal hype, bright fuchsia accent, 124 BPM, short tail, no vocals, for 5-8 second slide duration sync
```

**Prompt 2**
```
6-second pop bump, funky guitar scratch, clap, positive crowd reaction feel, gamification slide moment, instrumental hit not loop
```

**Prompt 3**
```
4-second whoosh-up chime, modern UI sound design musical, sala d'accordo energy, quick reset, no vocals
```

---

### `LR_18_Slide_Suspense`

**When**: pareggio voto, plot twist, mistero ribelle.

**Prompt 1**
```
6-second suspense stinger, low brass stab, reverse cymbal, glitch tick, plot twist slide mood, minor key, instrumental, no vocals, slightly unsettling playful not scary
```

**Prompt 2**
```
7-second mystery hit, detuned piano chord, sub drop, vote tie nail biter, single play stinger
```

**Prompt 3**
```
5-second tension ping, clock echo, stereo widen sweep, wildcard slide reveal, instrumental only
```

---

### `LR_19_Slide_Celebration`

**When**: confetti random, party mode slide.

**Prompt 1**
```
5-second celebration pop sting, major chord sparkle, party horn subtle, confetti burst sync, 130 BPM, joyful random moment, instrumental, no vocals
```

**Prompt 2**
```
4-second disco flare, octave up bass fill, handclaps, momento random fantastici mood, short stinger
```

**Prompt 3**
```
6-second festive hit, marimba run, kick accent, neon party burst energy, instrumental only
```

---

### `LR_20_Phase_Transition`

**When**: `ac_phase_announce`, cambio fase LOBBY→QUIZ→EXTRACTION ecc.

**Prompt 1**
```
8-second phase transition whoosh instrumental, rising sweep into ceremonial chord, game show phase banner, neutral energy adaptable any phase, 100 BPM, ends on held pad for next bed music crossfade, no vocals
```

**Prompt 2**
```
10-second broadcaster transition, news-style drum roll subtle into bright stab, animator handoff moment, instrumental one-shot
```

**Prompt 3**
```
7-second cinematic swoosh, orchestra hit plus electronic tail, state change UI sync, single play not loop
```

---

### `LR_21_Closed_Outro`

**When**: `close_event`, ringraziamenti, export dati.

**Prompt 1**
```
90-second outro instrumental fading, 88 BPM, warm pad and soft piano, grateful afterglow after party, love roulette night ends, gentle decrescendo last 20 seconds to silence, no vocals, not loop designed as closing track
```

**Prompt 2**
```
Ambient closing bed 92 BPM, mellow deep house stripped down, distant club memories vibe, fade out tail, instrumental, single play with natural ending
```

**Prompt 3**
```
Soft acoustic-electric hybrid outro 85 BPM, nostalgic romantic night over feeling, 2-minute track with written ending not loop, no vocals
```

---

## 3. Varianti per tema serata

Tema impostato in `events.config.theme` → applicare **stem notes** o **prompt suffix** a generation time.

### Tema A — Dark Fuchsia (default)

| Elemento | Direttiva SUNO / post |
|----------|----------------------|
| Palette | `dark background #0D0D12, hot pink #E91E8C accents, coral #FF4757 highlights` |
| Genre bias | Deep house, nu-disco, modern game-show EDM |
| Prompt suffix | `, dark fuchsia club vibe, magenta neon accents, love game classic energy` |
| Evitare | Pastel soft jazz dominante, acoustic folk se non traccia romantic |

**Variant prompt example** (append to any bed track):
```
dark fuchsia club palette, magenta synth accents on hot pink #E91E8C, deep black background mix, classic love game nightclub energy
```

### Tema B — Romantic Elegant

| Elemento | Direttiva SUNO / post |
|----------|----------------------|
| Palette | `deep plum #1A0F1E, dusty rose #D4A5C8, soft gold #C9A96E` |
| Genre bias | Orchestral pop, slow jam, jazz lounge, piano-led beds |
| Prompt suffix | `, romantic elegant evening, dusty rose and soft gold tones, cinematic intimacy, Playfair elegance not club aggressive` |
| Sostituzioni consigliate | `LR_01` più piano/strings; `LR_05` più strings meno four-on-the-floor; `LR_15` orchestral non EDM |

**Variant prompt — Lobby**:
```
Romantic elegant lobby ambient, solo piano and warm strings pad, dusty rose #D4A5C8 tone, soft gold accents, refined singles soirée, 94 BPM loop, no vocals, candlelit upscale venue not nightclub
```

**Variant prompt — Winner**:
```
Orchestral victory theme romantic elegant, full strings and harp, soft timpani, gold shimmer accents, emotional not EDM, 90 BPM building to 110 BPM, instrumental, vacation prize grandeur classy
```

### Tema C — Neon Party

| Elemento | Direttiva SUNO / post |
|----------|----------------------|
| Palette | `pure black #050508, cyan #00F5FF, magenta #FF00FF, electric yellow #FFFF00` |
| Genre bias | Electro, synthwave, hyperpop instrumental, festival trap-lite |
| Prompt suffix | `, neon party theme, cyan and magenta glow, electric yellow stabs, high impact young festival energy` |
| Sostituzioni consigliate | Più sidechain e supersaw su `LR_02`, `LR_05`, `LR_10`; stinger più corti e bright |

**Variant prompt — Quiz**:
```
Neon party quiz tension, synthwave arpeggios cyan and magenta, electric bass, 116 BPM, glowing retro-future dating game, instrumental loop, high energy young club, no vocals
```

**Variant prompt — Extraction drumroll**:
```
Neon electro build 14 seconds, supersaw riser cyan to magenta, trap snare roll accelerating, festival drop silence at end, lottery spin hyper energy, instrumental only
```

### Matrice rapida sostituzione tracce per tema

| Track | Dark Fuchsia | Romantic Elegant | Neon Party |
|-------|--------------|------------------|------------|
| LR_01 | Default prompts | Piano/strings lobby | Synthwave lobby |
| LR_05 | Nu-disco underscore | String disco lite | Electro house underscore |
| LR_10 | Funky dance pop | Latin pop elegant | Harder EDM dance |
| LR_11 | Default romantic | **Primary theme sound** | Synth ballad neon |
| LR_15 | EDM anthem | Orchestral anthem | Festival banger |
| LR_17–19 | Fuchsia stingers | Soft chime stingers | Neon glitch stingers |

---

## 4. Specifiche tecniche

### Formato file

| Uso | Formato | Note |
|-----|---------|------|
| Master archivio | **WAV** 48 kHz / 24-bit | Nome file: `LR_XX_TrackName_v1.wav` |
| Playback web dashboard | **MP3** 320 kbps CBR | Stesso stem; normalizzati insieme |
| Stinger corti (<10 s) | WAV + MP3 | Zero padding >100 ms silenzio iniziale |
| Loop beds | WAV con **loop point** marcato in metadata comment | Crossfade loop 8–16 ms in editor |

### Loudness target (venue / PA sala)

Mix per **playback live** con microfono animatore sopra la musica:

| Tipo traccia | Integrated LUFS | True peak |
|--------------|-----------------|-----------|
| Loop ambient (LR_01, LR_08, LR_21) | **-16 to -14 LUFS** | ≤ -1 dBTP |
| Loop attivo (quiz, extraction bed, finals) | **-14 to -12 LUFS** | ≤ -1 dBTP |
| Stinger / drumroll / reveal | **-10 to -8 LUFS** | ≤ -0.5 dBTP |
| Winner anthem (peak moment) | **-12 to -10 LUFS** | ≤ -0.5 dBTP |

**Sala tipica**: PA consumer/full-range; **non** masterare a -8 LUFS streaming loudness — l’animatore alza volume per finali. Tenere **6 dB headroom** sotto clip PA.

**Check pre-serata**: playback a volume reale sala con microfono aperto; musica deve stare **3–6 dB sotto** voce animatore nelle fasi parlato (lobby, extraction, elimination).

### Crossfade e cue (implementazione M1/M2)

| Transizione | Durata crossfade | Cue |
|-------------|------------------|-----|
| Lobby → Quiz | 2.0 s | `start_quiz` state change |
| Quiz → Anticipation | 1.5 s | domanda `total - 5` o slide `cd_matching_soon` |
| Anticipation → Matching transition | 0 s (hard) | `end_quiz`; play LR_04 once |
| Matching → Extraction underscore | 1.0 s | LR_04 tail → LR_05 |
| AVANTI extraction | 0 s | Duck LR_05 −12 dB → LR_06 → LR_07 → restore LR_05 |
| Extraction → Elimination | 2.0 s | `start_elimination` |
| Elimination drop | 0 s overlay | LR_09 over LR_08, no stop bed |
| Finals challenge switch | 1.5 s | `next_challenge` + challenge type map |
| Open voting | 0 s | LR_13 → LR_14; duck challenge bed |
| Close voting | 1.0 s | fade LR_14 → restore challenge bed or silence |
| Winner | 0 s hit + 2 s crossfade | LR_16 → LR_15 |
| Slide stinger | Duck bed −8 dB 0.3 s | Play LR_17/18/19; restore 0.5 s after `slide_dismiss` |
| Closed | 3.0 s fade | LR_15 or LR_08 → LR_21 |

**Ducking**: sidechain o automazione −8 a −14 dB su bed quando animatore parla (opzionale M3); minimo manuale volume tablet pre-serata.

### Organizzazione cartelle (proposta)

```
music/                          ← sorgente repo (SUNO export)
  dark_fuchsia/
    loops/
      LR_01_Lobby_Ambient_A.mp3
      LR_01_Lobby_Ambient_B.mp3
    candidates/                 ← prompt alternativi (P2, P3) finché non promossi
      LR_01_Lobby_Ambient_P2_A.mp3
    stingers/
    _masters/                   ← WAV 48k opzionale
  manifest.json                 ← primary A/B per traccia + candidates
web/public/audio/               ← copia per deploy (sync da music/)
  dark_fuchsia/loops/...
```

### SUNO — due versioni per generazione

SUNO restituisce sempre **2 take**. Nomenclatura fissa:

| Suffisso | Significato |
|----------|-------------|
| `_A` | Prima take (versione #1) |
| `_B` | Seconda take (versione #2) |

Esempio: `LR_01_Lobby_Ambient_A.mp3` + `LR_01_Lobby_Ambient_B.mp3`.

**Uso consigliato:** scegli una **primary** (A o B) per la serata; la seconda serve come **alternate** per crossfade in loop lunghi (lobby 30 min) o backup. Per stinger corti (<10 s) basta una take vincente.

Vedi [`music/README.md`](../music/README.md).

---

## 5. Priorità M1 — minimum viable soundtrack

Ordine di produzione SUNO se tempo limitato. **4 tracce obbligatorie** per prima serata credibile; poi espansione.

| Priorità | Track | Motivo |
|----------|-------|--------|
| **P0 — Must ship** | `LR_01_Lobby_Ambient` | 30+ min pre-show; prima impressione |
| **P0 — Must ship** | `LR_02_Quiz_Tension` | 15 min domande; evita silenzio awkward |
| **P0 — Must ship** | `LR_06_Extraction_Drumroll` + `LR_07_Extraction_Reveal` | Cuore spettacolo roulette; contano come **1 deliverable operativo** (coppia spin+ding) |
| **P0 — Must ship** | `LR_15_Winner_Anthem` + `LR_16_Winner_Stinger` | Chiusura emotiva + premio; contano come **1 deliverable operativo** |
| **P1 — Strongly recommended** | `LR_05_Extraction_Underscore` | Copre 20 min estrazione tra reveal |
| **P1** | `LR_03_Quiz_Anticipation` | Ultime domande + transizione matching |
| **P1** | `LR_13_Voting_Countdown` + `LR_14_Voting_Suspense` | Finali interattivi |
| **P2 — M1.5** | `LR_08` + `LR_09`, `LR_10–12`, slide stingers `LR_17–20` | Completano arco narrativo |
| **P3 — M2** | `LR_04`, `LR_21`, varianti tema B/C complete | Polish multi-tema |

**M1 kit minimo file count**: 6 file audio (4 bed/stinger logic + drumroll + reveal grouped) — **oppure 7 file** se drumroll e reveal separati.

### Checklist generazione SUNO

- [ ] Generare **2 varianti** per traccia P0; A/B in rehearsal
- [ ] Tagliare loop a zero-cross con crossfade 12 ms
- [ ] Normalizzare LUFS per tabella §4
- [ ] Test con roulette: spin 4 s → drumroll peak → reveal stinger
- [ ] Test microfono animatore sopra LR_05 e LR_01
- [ ] Esportare `manifest.json` con `phase`, `loop`, `theme`

---

## 6. Mapping fase → traccia (quick reference animatore)

| Fase dashboard | Musica default | Slide stinger (se attiva) |
|----------------|----------------|---------------------------|
| LOBBY | LR_01 | LR_17, LR_19 |
| QUIZ | LR_02 → LR_03 (ultime 5) | LR_17, LR_18, LR_19 |
| MATCHING | LR_04 (once) | LR_20 |
| EXTRACTION | LR_05 + LR_06/07 per AVANTI | LR_20 |
| ELIMINATION | LR_08 + LR_09 | LR_18 |
| FINALS | LR_10 / LR_11 / LR_12 per prova | LR_17, LR_18 |
| VOTING | LR_13 → LR_14 | LR_18 |
| WINNER | LR_16 → LR_15 | LR_19 |
| CLOSED | LR_21 | — |

---

## 7. Riferimenti

- State machine e fasi → [01-game-design.md](01-game-design.md) §3–4
- Temi e animazioni → [02-design-system.md](02-design-system.md) §2, §5
- Timeline serata → [07-animator-runbook.md](07-animator-runbook.md) §1
- Slide mood → [12-slides-library.md](12-slides-library.md) §6
