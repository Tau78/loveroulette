# Love Roulette — Libreria audio

## Convenzione nomi (SUNO genera sempre 2 take)

Per ogni traccia del brief [`docs/18-suno-music-brief.md`](../docs/18-suno-music-brief.md):

```
LR_{NN}_{TrackName}_A.mp3   ← prima take SUNO (Prompt 1, take #1)
LR_{NN}_{TrackName}_B.mp3   ← seconda take SUNO (Prompt 1, take #2)
```

Il brief propone **3 prompt alternativi** per traccia (direzioni creative diverse). Non vanno in `_A`/`_B`:

```
candidates/
  LR_{NN}_{TrackName}_P2_A.mp3   ← Prompt 2, take #1
  LR_{NN}_{TrackName}_P2_B.mp3   ← Prompt 2, take #2
  LR_{NN}_{TrackName}_P3_A.mp3   ← Prompt 3, take #1
  LR_{NN}_{TrackName}_P3_B.mp3   ← Prompt 3, take #2
```

Quando un prompt alternativo vince ad orecchio, promuovi quella coppia in `loops/` come `_A`/`_B` ufficiali.

### Esempio LR_01 (lobby)

```
music/dark_fuchsia/loops/
  LR_01_Lobby_Ambient_A.mp3      ← Prompt 1, take A
  LR_01_Lobby_Ambient_B.mp3      ← Prompt 1, take B
music/dark_fuchsia/candidates/
  LR_01_Lobby_Ambient_P2_A.mp3   ← Prompt 2 «Velvet Countdown», take A
  LR_01_Lobby_Ambient_P2_B.mp3   ← Prompt 2, take B (quando pronta)
```

Dopo aver ascoltato entrambe, segna la preferita in `manifest.json`:

```json
{
  "LR_01_Lobby_Ambient": {
    "primary": "A",
    "alternate": "B",
    "phase": "lobby",
    "loop": true
  }
}
```

## Come usare A e B

| Strategia | Quando |
|-----------|--------|
| **Solo primary** | Serata M1 — più semplice; usa `_A` o `_B` scelta a orecchio |
| **Crossfade A↔B** | Lobby lunga (30+ min) — alterna i due loop ogni 3–4 min, crossfade 2 s, zero silenzio |
| **A = default, B = backup** | Se una take ha artefatti SUNO o vocali indesiderati |

Non rinominare `take1/take2` generico: con 21 tracce × 2 diventa ingestibile.

## Master WAV (opzionale)

```
LR_01_Lobby_Ambient_A.wav
LR_01_Lobby_Ambient_B.wav
```

MP3 320 kbps in `loops/` per playback web; WAV in `music/_masters/` se vuoi archivio qualità.

Dopo ogni export SUNO, sincronizza nel player web:

```bash
cd web && npm run sync:audio
```

## Tracce P0 in repo

| File A / B | Fase | SUNO take (primary A) |
|------------|------|------------------------|
| `LR_06_Extraction_Drumroll_A/B` | Estrazione (drumroll) | Empty Room Impact / (1) (~9 s) — **pronti al live** |
| `LR_07_Extraction_Reveal_A/B` | Estrazione (ding) | Fuchsia Fanfare / Fuchsia Fanfare (1) |
| `LR_15_Winner_Anthem_A/B` | Vincitori (loop) | Victory Confetti (~50 s) / Love Roulette Champions (~114 s) |
| `LR_16_Winner_Stinger_A/B` | Vincitori (hit) | Confetti Strike / Confetti Strike_1 |

## Prossime tracce P0

| File A / B | Fase |
|------------|------|
| `LR_02_Quiz_Tension_A/B` | Quiz |

Stinger: di solito **una sola** take basta (scegli A o B); per i loop conviene tenere entrambe.

### Gong quiz (`LR_Quiz_Question_Gong`)

Stinger one-shot alla fase **results** del quiz (proiettore + admin). Non è SUNO: file SFX esterno in `dark_fuchsia/stingers/LR_Quiz_Question_Gong_A.mp3`. Dettagli licenza in [`SFX_ATTRIBUTION.md`](./SFX_ATTRIBUTION.md). Dopo il download, `cd web && npm run sync:audio` copia il file in `web/public/audio/`.
