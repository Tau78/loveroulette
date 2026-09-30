# Video plancia

| File | Uso |
|------|-----|
| `sfondo-animato.mp4` | Loop ambient sul proiettore (sempre disponibile) |
| `sigla.mp4` | **Richiesto in installazione** — intro serata (bundled). Path fisso: `/grafiche/video/sigla.mp4` |

## Cue rapidi header (opzionali)

Slide sul proiettore già funzionano dai chip **QR / Sponsor / Pausa / Tra 5′**.
Se aggiungi i MP4 qui sotto, la plancia li mette anche in anteprima locale:

```
web/public/grafiche/video/cues/sponsor.mp4
web/public/grafiche/video/cues/pausa.mp4
web/public/grafiche/video/cues/tra-5-minuti.mp4
```

## Sigla (bundled)

La sigla **non** si carica dalla plancia in serata: è un file dell’app.

Path ufficiale:

```
web/public/grafiche/video/sigla.mp4
```

**Provvisoria attuale (2026-09-30):** «Sigla provvisoria love roulette» (H.264+AAC, ~18 s).  
Su TestFlight / Vercel arriva solo dopo deploy (VAI): URL `https://loveroulette.vercel.app/grafiche/video/sigla.mp4`.

### Fallback senza video

Se `sigla.mp4` manca, su «Parte ora» la plancia:

- mostra **logo a tutto campo** + roulette/glow animati
- riproduce l’audio in (primo trovato):

```
web/public/grafiche/audio/sigla.mp3
web/public/grafiche/video/sigla.mp3
```

(Audio estratto dalla stessa sigla provvisoria.)

A fine audio → hold (come fine video). Se manca anche l’audio, resta lo stage visuale silenzioso.
