# Love Roulette — Prompt Google Flow (video display)

> Modulo 20 · Generazione video per proiettore `/display`  
> Riferimenti: [`grafiche/`](../grafiche/) · [`19-display-animation-strategy.md`](19-display-animation-strategy.md)  
> Aggiornato: 2026-06-19

## Setup Google Flow

1. Apri [Google Flow](https://labs.google/fx/tools/flow) (o Flow da Google Labs / Veo).
2. Modalità consigliata: **Frames to Video** o **Ingredients to Video** → carica il PNG/JPG di riferimento da `grafiche/`.
3. **Aspect ratio:** 16:9 (se disponibile; altrimenti 9:16 e crop in post).
4. **Durata:** genera clip da **5–10 s** (limite Flow); per loop 20–30 s unisci 2–4 clip in CapCut/DaVinci con crossfade 12 frame.
5. **Audio:** disattiva / ignora — proiettore sempre mute.
6. **Export:** MP4 H.264, 1920×1080, 24 fps → cartella `grafiche/video/` poi copia in `web/public/display/video/`.

### Mapping file riferimento → video

| Riferimento | Video da generare | Loop? |
|-------------|-------------------|-------|
| `grafiche/Sfondo.png` | Luci palco + atmosfera lounge | ✅ Sì |
| `grafiche/Roulette.PNG` | Ruota rotazione lenta / veloce | ✅ Lenta · ❌ Veloce one-shot |
| `grafiche/Logo.png` | Logo glow idle (opzionale) | ✅ Sì |
| `grafiche/Cuori.jpg` | Particelle cuori (overlay) | ✅ Sì |
| — (combinato) | Stinger estrazione / vincitore | ❌ One-shot |

---

## Convenzione nomi output

```
grafiche/video/
  LR_VID_01_Stage_Background_Loop.mp4
  LR_VID_02_Roulette_Spin_Slow_Loop.mp4
  LR_VID_03_Roulette_Spin_Fast_5s.mp4
  LR_VID_04_Logo_Glow_Loop.mp4          ← opzionale
  LR_VID_05_Hearts_Ambient_Loop.mp4     ← opzionale overlay
  LR_VID_06_Extraction_Stinger.mp4
  LR_VID_07_Winner_Stinger.mp4
```

Se Flow genera 2 varianti (come SUNO): suffisso `_A` / `_B`.

---

## 1. Sfondo palco — `Sfondo.png`

**Uso in app:** Layer 1 fullscreen, loop continuo in lobby e sotto tutte le fasi.  
**Riferimento:** carica `grafiche/Sfondo.png`.

### Prompt A (consigliato — solo luci in movimento)

```
Cinematic empty luxury nightclub lounge, art deco purple walls with geometric diamond patterns, camera locked static wide shot through central doorway, NO camera movement, background only: soft bokeh stage lights slowly drifting and pulsing in magenta pink purple and cyan, subtle light beams sweeping left to right like live concert rig, deep shadows foreground seating unchanged, photorealistic, dark moody atmosphere, colors #0D0D12 #E91E8C #6B21A8, seamless loop feel, 24fps film grain very subtle, no people, no text, no logo
```

### Prompt B (luci più dinamiche — venue energy)

```
Static camera art deco nightclub interior at night, purple velvet mood, background bar area out of focus, colorful stage spotlights and bokeh orbs floating slowly, gentle lens flare passes once per loop, magenta and fuchsia gel lighting, high-end dating show venue empty before guests, cinematic color grade, loopable motion only in lights not architecture, no humans no typography
```

### Negative prompt (incolla se Flow lo supporta)

```
people, crowd, camera pan, zoom, walk through, text, logo, watermark, shaky cam, daylight, white walls, fast strobing, epilepsy flash
```

### Post-produzione

- Verifica **primo frame ≈ ultimo frame** (loop seamless).
- Nessuna ruota / logo nel video — solo ambiente (la ruota sarà layer separato).

---

## 2. Ruota lenta — `Roulette.PNG`

**Uso:** Layer 2, rotazione continua ~360° in 60–90 s (lobby, quiz).  
**Riferimento:** carica `grafiche/Roulette.PNG` (sfondo nero = overlay in app).

### Prompt A — slow loop

```
Top-down view luxury pink neon casino roulette wheel, smooth continuous clockwise rotation very slow one full turn in 8 seconds, metallic fuchsia and purple segments with heart icons and numbers, small white ball gently rolling in outer track, glossy 3D game show prop, black background, studio lighting with soft pink rim light, photorealistic render, NO text morphing, letters THE PERFECT MATCH GAME and SPIN FIND MATCH stay readable and fixed on outer ring while wheel interior spins, seamless loop, 24fps
```

### Prompt B — slow + subtle wobble

```
Close-up romantic game show roulette wheel spinning slowly clockwise, premium pink chrome material, heart symbols on segments, ball circling outer rim, subtle mechanical wobble realistic casino wheel, dark void background, neon fuchsia glow #E91E8C, broadcast TV game show quality, loopable rotation, static outer text ring if possible
```

### Nota tecnica

Se Flow distorce il testo sul bordo: genera **solo disco interno** (chiedi “inner wheel only, no outer text ring”) e in app sovrapponi il PNG statico del bordo testo — oppure usa solo `Roulette.PNG` statico + rotazione CSS/Rive per il disco.

### Negative

```
text warping, melting numbers, motion blur extreme, people, hands, table, zoom in, counter-clockwise jitter
```

---

## 3. Ruota veloce — matching / roulette — `Roulette.PNG`

**Uso:** One-shot 4–6 s quando `runtime_state = matching` o tap AVANTI estrazione.  
**Non loop.**

### Prompt

```
Dramatic game show roulette wheel accelerates spinning clockwise fast for 4 seconds then decelerates to stop, pink neon casino wheel hearts and numbers, white ball bouncing in slots nail-biting tension, sparks of fuchsia light, black background, cinematic slow-motion hybrid, TV dating lottery moment, high energy but elegant not cartoon, single play not loop, ends nearly stopped
```

### Variante estrazione (5 s)

```
Roulette wheel rapid spin building suspense, motion blur on segments, ball rattling, sudden slowdown last second, love game show reveal moment, magenta pink lighting burst, photorealistic 3D, one-shot 5 seconds
```

---

## 4. Logo glow idle — `Logo.png` (opzionale)

**Uso:** Sopra sfondo in lobby se non usi PNG statico; loop sottile.  
**Riferimento:** carica `grafiche/Logo.png`.

### Prompt

```
Static centered LOVE ROULETTE logo with interlocking pink neon hearts and crown, gentle breathing glow pulse on neon edges, tiny sparkle particles floating upward slowly, dark purple background #1A0F1E, no camera move, typography perfectly stable no morphing, romantic premium game show brand animation, seamless subtle loop 6 seconds, 24fps
```

### Negative

```
text change, letters moving, logo redesign, camera orbit, fast blink, disco strobe
```

---

## 5. Cuori ambient — `Cuori.jpg` (opzionale overlay)

**Uso:** Blend `screen` sopra sfondo, opacità 30–40%, lobby/quiz.  
**Riferimento:** carica `grafiche/Cuori.jpg`.

### Prompt

```
Two glossy pink red interlocking hearts with crown floating in dark purple space, slow gentle rotation 5 degrees back and forth, soft neon aura pulsing, floating heart particles drift upward like embers, romantic magic atmosphere, alpha-friendly dark background, seamless loop, no text, premium 3D render
```

---

## 6. Stinger estrazione coppia — composito

**Uso:** One-shot 3–5 s al reveal coppia (con `LR_07` audio stinger).  
**Riferimento:** `Roulette.PNG` + mood da `Sfondo.png` (Ingredients: entrambi se Flow supporta multi-ref).

### Prompt

```
Quick flash: roulette wheel spins 2 seconds blur then stops, burst of magenta pink light rays from center, heart-shaped bokeh explosion, game show couple reveal moment, dark club atmosphere, cinematic one-shot 4 seconds, no text on screen, elegant not cheesy
```

---

## 7. Stinger vincitore — composito

**Uso:** One-shot 5–8 s con `LR_15` / `LR_16` audio.  
**Riferimento:** `Logo.png` + `Cuori.jpg`.

### Prompt

```
Victory celebration moment, golden and fuchsia confetti raining down, neon LOVE ROULETTE logo center glowing brighter, heart crown sparkles, stage spotlights sweep upward, dating game show winners reveal, dark purple background, cinematic one-shot 6 seconds, euphoric but classy, no faces no people
```

---

## Workflow consigliato (ordine produzione)

| Step | Flow job | Riferimento | Priorità |
|------|----------|-------------|----------|
| 1 | `LR_VID_01` sfondo loop | `Sfondo.png` | **P0** |
| 2 | `LR_VID_02` ruota lenta | `Roulette.PNG` | **P0** |
| 3 | `LR_VID_03` ruota veloce | `Roulette.PNG` | **P0** |
| 4 | `LR_VID_06` stinger estrazione | Roulette + mood | P1 |
| 5 | `LR_VID_07` stinger vincitore | Logo + Cuori | P1 |
| 6 | `LR_VID_04` logo glow | `Logo.png` | P2 (PNG statico può bastare) |
| 7 | `LR_VID_05` cuori overlay | `Cuori.jpg` | P2 |

---

## Compositing in app (dopo export)

```
Z-index basso → alto:
1. LR_VID_01_Stage_Background_Loop     (video, object-fit cover)
2. LR_VID_02_Roulette_Spin_Slow_Loop   (video, centered, ~38% width) OR PNG Roulette + CSS
3. grafiche/Logo.png                   (statico, center-top) — finché LR_VID_04 non pronto
4. React UI: QR, fasi, testi
5. LR_VID_06 / 07                      (one-shot overlay fullscreen, on trigger)
```

Stati animatore → video:

| `runtime_state` | Video |
|-----------------|-------|
| `lobby` | SFONDO loop + ruota lenta + logo |
| `quiz` | SFONDO loop + ruota lenta |
| `matching` | SFONDO + `LR_VID_03` fast (once) |
| `extraction` | SFONDO + ruota veloce on AVANTI + `LR_VID_06` |
| `winner` | SFONDO + `LR_VID_07` |

---

## Limiti Flow e workaround

| Problema | Soluzione |
|----------|-----------|
| Clip max ~8–10 s | Genera 4 clip “same prompt” + unisci con crossfade per loop 30 s |
| Testo ruota si deforma | Ruota solo disco interno; bordo testo = PNG statico |
| Loop non seamless | Ultimi 0.5 s fade al primo frame in DaVinci |
| Risoluzione bassa | Upscale Topaz / Flow upscale se disponibile; target 1920×1080 |
| 2 varianti Flow | Salva `_A` e `_B`, scegli in `grafiche/video/manifest.json` |

---

## Checklist qualità pre-import

- [ ] 1920×1080 (o 3840×2160 downscale)
- [ ] Nessun audio track
- [ ] Loop: ultimo frame compatibile col primo (solo per `_Loop`)
- [ ] Logo/testo leggibile e non “melting”
- [ ] Colori coerenti Dark Fuchsia (#E91E8C, #0D0D12)
- [ ] File in `grafiche/video/` con nome `LR_VID_XX_...`

Quando hai i primi MP4, segnala — integriamo `DisplayStage` in `web/` con `<video>` e sync stati sessione.
