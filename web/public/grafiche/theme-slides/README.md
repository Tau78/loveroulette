# Slide tema (pre-domanda)

Grafiche fullscreen **16:9** mostrate in fase `theme_intro` / gate Casa «tema», prima delle domande di ogni manche.

Palette allineata al tema **Dark Fuchsia**. Titolo/sottotitolo overlay dinamico.
Motion (Framer, senza video): `theme-slide-motion.ts` — Ken Burns per categoria + ingresso titolo scenico.

| File | Categoria | Motion art | Ingresso titolo |
|------|-----------|------------|-----------------|
| `lifestyle.jpg` | `lifestyle` | Zoom lento verso il drink | Slam da scale+blur |
| `romantic.jpg` | `romantic` | Deriva verso l’alto | Sale dal basso |
| `adventure.jpg` | `adventure` | Spinta dal basso-destra | Whip da sinistra |
| `values.jpg` | `values` | Zoom-out solenne | Cade dall’alto |
| `fun.jpg` | `fun` | Zoom + sway energico | Bounce/rotate |
| `intimacy.jpg` | `intimacy` | Pan sulle nastri | Reveal soft+blur |

Mapping: `quiz-theme-slides.ts` · UI: `DisplayThemeSlide`.
