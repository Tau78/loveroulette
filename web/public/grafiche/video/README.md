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

1. Esporta MP4 H.264, 16:9 (ideale 1920×1080).
2. Copialo qui come:

```
web/public/grafiche/video/sigla.mp4
```

3. Commit / deploy / rebuild desktop — stesso path su Vercel e su Tauri (`public`).

Se manca, il proiettore mostra solo un hold brand («Si parte»), **senza** messaggi tecnici. La plancia admin può avvisare in footer.

Override locale (blob) da Setup resta solo emergenza sviluppo; in produzione usa il file bundled.
