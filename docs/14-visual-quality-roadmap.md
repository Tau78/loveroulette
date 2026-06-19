# Love Roulette — Visual Quality Roadmap

> Grafiche estremamente raffinate: cosa possiamo fare noi vs cosa serve fuori  
> Versione: 1.0 · Giugno 2026

## Onestà sul limite attuale

Il codice generato da AI (incluso questo progetto) produce **UI funzionale e coerente**, non **art direction da prodotto premium**. Per Love Roulette in sala — proiettore + 30 telefoni — serve un salto qualitativo deliberato.

**Obiettivo:** livello "app evento premium" (Hinge/Tinder event night, HQ Trivia polish, Spotify Wrapped micro-animazioni) — non "dashboard admin generica".

---

## Cosa avete già in MusicPro (sfruttare)

| Asset GAS | Uso Love Roulette |
|-----------|-------------------|
| `graphic_themes` | Temi serata collegati a `events.theme_id` |
| Pipeline grafiche admin | Poster/locandine serata Love Roulette |
| Brand MusicPro / locali | Logo watermark proiettore |
| `apps/mobile` Expo | Pattern animazioni staff/player esistenti |

**Convergenza visiva:** Love Roulette non reinventa il brand — estende le tematiche MusicPro con **token UI live** (colori motion, non solo poster statici).

---

## Strategia a 3 livelli

### Livello 1 — Foundation (noi, M1) ✅

- Design tokens CSS (già 3 temi in `02-design-system.md`)
- Typography scale proiettore vs mobile
- Framer Motion + canvas-confetti (prototipo già in `web/`)
- `prefers-reduced-motion`, contrasto proiettore

**Limite:** resta "buon dev UI", non "raffinato".

### Livello 2 — Design system professionale (consigliato M1–M2)

| Step | Chi | Output |
|------|-----|--------|
| **Figma** art direction | Designer UI (freelance 2–5 giorni) | Key screens: lobby, quiz, estrazione, voto, vincitore + proiettore |
| **Motion spec** | Motion designer o Figma Smart Animate | Roulette, onda colore, takeover coppia — frame-by-frame |
| **Asset pack** | Designer | SVG cuori, gradienti, Lottie JSON |
| **Implementazione** | Noi (Cursor) | Pixel-perfect da Figma → React + Tailwind |

**Budget indicativo freelance IT:** €800–2500 per pack completo serata live (Figma + Lottie + icon set).

### Livello 3 — Polish produzione (M2–M3)

- **Lottie** per roulette e confetti (non CSS alone)
- **Sound design** opzionale (tick, ding, countdown — mutabile)
- **Font licensed**: Clash Display, Satoshi, o Playfair per Romantic theme
- **Photography/3D** optional per slide wildcard (stock curato, stesso grade colore)

---

## Stack tecnico consigliato per qualità alta

```
Figma (design) → Tokens Studio → CSS variables
              → LottieFiles / Rive → animazioni export
              → shadcn/ui + Tailwind (componenti base)
              → Framer Motion (transizioni screen)
              → next/font (Google o licensed)
```

### Librerie UI premium (partire da base solida)

| Libreria | Perché |
|----------|--------|
| **shadcn/ui** | Componenti accessibili, customizzabili — non look "default" se token custom |
| **Radix UI** | Già sotto shadcn — focus, a11y |
| **Motion (Framer)** | Già in uso |
| **Rive** | Alternative Lottie — file più leggeri, interactive |
| **Lenis** | Smooth scroll (lobby/pre-reg) |

### Evitare

- Gradient generici "AI purple"
- Stock photo random su proiettore
- Troppi font (>2 famiglie)
- Animazioni infinite che distraggono l'animatore dal palco

---

## Reference moodboard (direction)

| Reference | Cosa copiare |
|-----------|--------------|
| **Spotify Wrapped** | Personal reveal, bold type, full-bleed color |
| **HQ Trivia** | Countdown, tensione, sync multi-device |
| **Duolingo** (micro) | Feedback risposta soddisfacente, non childish |
| **Apple Event streams** | Tipografia proiettore, safe zones |
| **Dating apps (Hinge)** | Romance theme — elegant, non cheesy |

---

## Ruoli: chi fa cosa

| Ruolo | Quando serve | Dove trovarlo |
|-------|--------------|---------------|
| **UI/UX Designer** | Prima di M2 dev visivo | Fiverr Pro, Dribbble, Upwork, agenzie locali |
| **Motion designer** | Roulette + estrazione | LottieFiles marketplace, freelance |
| **Brand designer** | Allineamento MusicPro | Interno / chi fa già grafiche GAS |
| **Cursor/AI dev** | Implementazione fedele Figma | Questo workflow |

### Brief per designer (incolla)

> Love Roulette — serata live single in locale. Dark club, proiettore 16:9, mobile PWA. 3 temi: Dark Fuchsia (default), Romantic Elegant, Neon Party. Serve: 8 key frames + motion roulette 4s + componenti bottoni quiz/voto. Tono: sexy-ironico PG-18, mai volgare. Deliverable: Figma + export SVG/Lottie + CSS tokens.

---

## Integrazione con pipeline grafiche GAS

1. Creare tematica `graphic_themes` **"Love Roulette — Dark Fuchsia"** (etc.)
2. Campo `metadata.ui_tokens` JSON:

```json
{
  "love_roulette": {
    "css_theme": "dark_fuchsia",
    "lottie_spin_url": "https://...",
    "accent": "#E91E8C",
    "projector_font": "Clash Display"
  }
}
```

3. Love Game `web` legge `events.theme_id` → carica token → applica `data-theme`

Così **locandina + live UI** sono coerenti.

---

## Piano pratico consigliato

| Settimana | Azione |
|-----------|--------|
| 1 | Brief designer + moodboard 10 reference |
| 2 | Figma 6 screen + motion roulette |
| 3 | Implementazione token + Lottie in Love Game web |
| 4 | Test in sala reale (proiettore + 3 phone) |

**Nel frattempo:** prototipo attuale resta per **logica e flow** — non per demo cliente finale.

---

## Cosa possiamo fare subito (senza designer)

1. Installare **shadcn/ui** + rifare 3 screen chiave con componenti curati
2. Font **distinctive** via `next/font` (es. Outfit + Playfair)
3. Migliorare roulette con **Lottie free** da LottieFiles (cuori/roulette)
4. Allineare colori a **graphic_themes** MusicPro quando convergiamo

---

## Riferimenti

- Design system doc: [02-design-system.md](02-design-system.md)
- Convergenza temi GAS: [13-platform-convergence-handoff.md](13-platform-convergence-handoff.md)
