# Love Roulette — Design System

> Modulo 02 · UI/UX, temi, animazioni, wireframe  
> Versione: 2.0 · Giugno 2026

## 1. Principi di design

- **Dark-first**: ottimizzato per locali/notturni e proiettori.
- **Leggibilità a distanza**: proiettore = font grandi, alto contrasto.
- **Touch-first mobile**: target minimi 48×48px, bottoni voto enormi in finale.
- **Emozione controllata**: animazioni celebrative ma non distraenti dall'animatore.
- **Tre temi switchabili** per serata senza redeploy.

---

## 2. Temi

### Tema A — Dark Fuchsia (default)

| Token | Valore | Uso |
|-------|--------|-----|
| `--bg-primary` | `#0D0D12` | Sfondo app |
| `--bg-surface` | `#1A1A24` | Card, pannelli |
| `--accent-primary` | `#E91E8C` | CTA, cuori, highlight |
| `--accent-secondary` | `#FF4757` | Alert, countdown |
| `--text-primary` | `#FFFFFF` | Testo principale |
| `--text-muted` | `#A0A0B0` | Secondario |
| `--gradient-hero` | `#E91E8C → #FF4757` | Header, vincitore |

**Mood**: club, energia, love game classico.

### Tema B — Romantic Elegant

| Token | Valore | Uso |
|-------|--------|-----|
| `--bg-primary` | `#1A0F1E` | Sfondo viola scuro |
| `--bg-surface` | `#2D1F35` | Card |
| `--accent-primary` | `#D4A5C8` | Rosa antico |
| `--accent-secondary` | `#C9A96E` | Oro soft |
| `--text-primary` | `#F5EDE8` | Crema |
| `--font-display` | Serif (Playfair Display) | Titoli |

**Mood**: elegante, romantico, serata raffinata.

### Tema C — Neon Party

| Token | Valore | Uso |
|-------|--------|-----|
| `--bg-primary` | `#050508` | Nero profondo |
| `--accent-primary` | `#00F5FF` | Cyan neon |
| `--accent-secondary` | `#FF00FF` | Magenta neon |
| `--accent-tertiary` | `#FFFF00` | Giallo elettrico |
| `--glow` | `0 0 20px currentColor` | Effetti neon |

**Mood**: festa, alto impatto, giovane.

### Implementazione temi

```css
[data-theme="dark_fuchsia"] { /* tokens A */ }
[data-theme="romantic_elegant"] { /* tokens B */ }
[data-theme="neon_party"] { /* tokens C */ }
```

Tema salvato in `events.config.theme`, applicato via `data-theme` su root e display.

---

## 3. Tipografia

| Ruolo | Mobile | Proiettore | Dashboard |
|-------|--------|------------|-----------|
| Display/H1 | 28–32px bold | **64–96px** bold | 24px |
| H2 | 22px semibold | 48px | 20px |
| Body | 16px | 32px | 14px |
| Button | 18px bold | 40px bold | 14px |
| Nickname coppia | — | **72px+** | — |

**Font stack**: Inter (UI), Playfair Display (solo Romantic Elegant titoli).

---

## 4. Componenti chiave

### 4.1 Mobile giocatore

- **Header**: logo Love Roulette + nick + badge numero (cuore).
- **Quiz card**: domanda centrata, 4 bottoni risposta full-width stacked.
- **Feedback post-risposta**: barra % animata (se abilitata).
- **Waiting state**: pulse heart + "In attesa dell'animatore..."
- **Vote screen**: 3 bottoni verticali 40% altezza viewport ciascuno, label "Coppia 1/2/3" + nick coppia sotto.
- **Chat bubble**: lista messaggi + input; badge "anonimo" se attivo.

### 4.2 Display proiettore (16:9)

Layout zones:

```
┌─────────────────────────────────────────────┐
│  LOGO EVENTO          [fase corrente]       │
├─────────────────────────────────────────────┤
│                                             │
│         AREA PRINCIPALE ANIMazione          │
│         (roulette / coppia / %)        │
│                                             │
├─────────────────────────────────────────────┤
│  Coppia 1  │  Coppia 2  │  Coppia 3         │  ← barra finalisti
└─────────────────────────────────────────────┘
```

- Safe zone 5% margini (proiettori crop).
- Nessun testo sotto 32px equivalente.
- QR evento angolo basso-dx in LOBBY (opzionale).

### 4.3 Dashboard animatore

- **Sidebar**: fasi con indicatori stato (verde=attivo, grigio=done).
- **Main panel**: controlli contestuali per fase.
- **Bottone primario**: `AVANTI` — grande, sempre visibile, colore accent.
- **Secondary**: skip domanda, pausa chat, emergency reset fase.
- **Live stats**: giocatori connessi, quiz completati, voti ricevuti.
- **Moderation queue**: chat flagged per review.

---

## 5. Animazioni

### 5.1 Roulette (estrazione coppie)

**Spec tecnica**:
- Durata spin: 3–5 sec (randomizzata leggermente).
- Elementi: 8–12 cuori/nickname che ruotano in cerchio (CSS transform o Lottie).
- Easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` decelerazione finale.
- Stop: zoom su coppia estratta + confetti leggeri (particelle CSS, max 50).
- Audio opzionale: tick + ding (mutabile, default off in v1).

**Fallback**: se animazione non carica, fade-in diretto nickname coppia.

### 5.2 Eliminazione coppia

- Coppia in barra inferiore: fade out + slide down (800ms).
- Suono opzionale: "whoosh".

### 5.3 Apertura votazione

- Countdown 3-2-1 full-screen proiettore.
- Smartphone: vibrazione leggera (se permesso) + bottoni appaiono.

### 5.4 Vincitore

- Spotlight animato su coppia vincente.
- Testo "VINCITORI!" + nick + premio.
- Confetti intensificato 5 sec.

### Stack animazioni consigliato

| Animazione | Tecnologia |
|------------|------------|
| Roulette | Framer Motion + CSS |
| Confetti | canvas-confetti (leggero) |
| Transizioni UI | Framer Motion |
| Lottie (opzionale M3) | dotlottie per asset designer |

---

## 6. Wireframe testuali

### Quiz (mobile)

```
┌──────────────────────┐
│ ♥ Love Roulette      │
│ Ciao, Marco (#12)    │
├──────────────────────┤
│ Domanda 5 di 27      │
│ ████░░░░░░░░ 18%     │
│                      │
│ "La serata ideale    │
│  per te è..."        │
│                      │
│ ┌──────────────────┐ │
│ │ A) Discoteca     │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ B) Cena romantica│ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ C) Casa e Netflix│ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ D) Avventura     │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Voto finale (mobile)

```
┌──────────────────────┐
│  VOTA LA COPPIA!     │
│  Prova: Il Ballo     │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │                  │ │
│ │    COPPIA 1      │ │
│ │  Marco & Sofia   │ │
│ │                  │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    COPPIA 2      │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │    COPPIA 3      │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Dashboard animatore — Estrazione

```
┌────────┬─────────────────────────────────────┐
│ LOBBY  │  FASE: Estrazione coppie            │
│ QUIZ ✓ │                                     │
│ MATCH✓ │  Modalità: [Random ▼]               │
│ EXTRA● │  Coppie mostrate: 4 / 12            │
│ ELIM   │                                     │
│ FINAL  │  ┌─────────────────────────────┐    │
│        │  │     [  AVANTI  ]           │    │
│        │  └─────────────────────────────┘    │
│        │  [Anteprima display →]            │
│        │  Prossima: random da pool           │
└────────┴─────────────────────────────────────┘
```

---

## 7. Accessibilità

- Contrasto WCAG AA minimo (AAA su proiettore dove possibile).
- Focus visible su dashboard (keyboard nav animatore).
- `prefers-reduced-motion`: disabilita confetti e riduce spin a fade.
- Colori non unico indicatore: icone + testo su bottoni voto.

---

## 8. Asset brand

- Logo: cuore stilizzato + "Love Roulette"
- Icona PWA: cuore su sfondo accent (512×512)
- Badge fisico: PDF stampabile template in `docs/printable/` (future)

---

## 9. Riferimenti

- Game flow → [01-game-design.md](01-game-design.md)
- Feature chat/stats → [04-features.md](04-features.md)
