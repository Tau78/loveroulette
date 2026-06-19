# Love Roulette — Strategia animazioni display (proiettore)

> Modulo 19 · Realismo vs stack tecnico  
> Aggiornato: 2026-06-19

## Problema

Animare un PNG con CSS/Framer (rotazione clip, blob luci) **non** produce un look da palco realistico: doppi layer, allineamento ruota, luci “finte”.

Per qualità **broadcast / casino / teatro** servono **asset dedicati** + player in app.

---

## Opzioni (dal più realistico al più leggero)

| Approccio | Realismo | Tool esterno (creazione asset) | Integrazione web | Quando usarlo |
|-----------|----------|-------------------------------|------------------|---------------|
| **A) Video loop** | ★★★★★ | After Effects, DaVinci, Runway, Blender | `<video>` MP4/WebM loop, mute, cover | Sfondo + luci palco + atmosfera |
| **B) Rive** | ★★★★ | [Rive.app](https://rive.app) | `@rive-app/react-canvas`, stati da `runtime_state` | Ruota, cuori, transizioni fasi |
| **C) Lottie** | ★★★ | After Effects + Bodymovin | `lottie-react` (già in progetto) | Roulette, confetti, stinger |
| **D) Three.js / WebGL** | ★★★★ | Blender → GLB, o codice | `@react-three/fiber` | Ruota 3D, luci volumetriche (più dev) |
| **E) CSS / Framer** | ★★ | Nessuno | Già usato (velluto) | Placeholder, MVP, non proiettore finale |

**Raccomandazione Love Roulette:**

```
Layer 1: video loop sfondo (luci palco, 15–30 s, seamless)
Layer 2: Rive “roulette-wheel.riv” (rotazione lenta; accelerazione su matching)
Layer 3: Lottie stinger (estrazione, vincitore)
Layer 4: UI React (QR, testi, fasi) — sopra tutto
```

Non serve un “software esterno” per **far girare** l’app: serve per **produrre gli asset**. Il player resta Next.js.

---

## Deliverable da preparare (con file corretto)

Quando hai il visual definitivo, chiedi al designer (o a te con AE/Rive):

| Asset | Formato | Note |
|-------|---------|------|
| Sfondo palco | MP4 H.264 1920×1080, 24fps, loop seamless | Luci in movimento; **senza** ruota testo (o ruota su layer alpha separato) |
| Ruota | `.riv` o Lottie JSON | Solo disco numerato; loop; stato `spin_fast` per matching |
| Logo statico | PNG/WebP 2× | Fallback se video non carica |
| Stinger estrazione | Lottie 3–5 s | One-shot, non loop |

Cartella target: `web/public/display/`

---

## Integrazione prevista (M1.5 → M2)

```tsx
// Pseudocodice display
<DisplayStage>
  <BackgroundVideo src="/display/stage-lights-loop.mp4" />
  <RiveWheel state={runtimeState === "matching" ? "fast" : "idle"} />
  <DisplayContent phase={runtimeState} /> {/* QR, quiz, ecc. */}
</DisplayStage>
```

Sync animatore: `runtime_state` da Supabase già disponibile → cambia stato Rive/video senza ricaricare pagina.

---

## Cosa evitare

- Un solo PNG animato con maschere CSS (effetto “doppia ruota”, allineamento fragile su proiettori diversi)
- GIF pesanti (banding, no sync stati)
- Video non loopati o con audio (proiettore sempre mute)

---

## Prossimo passo

1. Invia **file corretto** (preferibilmente layered: sfondo / ruota / logo separati, o brief per AE)
2. Implementiamo `DisplayStage` con video + Rive
3. Fase matching → `wheel.play("spin")` via hook sessione

Vedi anche [14-visual-quality-roadmap.md](14-visual-quality-roadmap.md), [17-regia-video-roadmap.md](17-regia-video-roadmap.md), [20-google-flow-video-prompts.md](20-google-flow-video-prompts.md) (prompt Google Flow + riferimenti `grafiche/`).
