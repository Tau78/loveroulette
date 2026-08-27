# Mettere apple-release in un’altra app

Questa cartella è il documento **cross-repo**. Cursor la vede solo se è nel progetto (o nei skill utente).

**Casa originale:** [Tau78/ReWavier](https://github.com/Tau78/ReWavier) `.cursor/skills/apple-release` (PR #5).  
**Questa copia (APP-Eventi)** aggiunge i rifiuti MusicPro Eventi (`lessons.md`). Da riportare su ReWavier nello stesso path quando c’è write su quel repo.

## In ogni repo iOS nuovo

Dalla root del repo di **questa** app (o da un clone):

```bash
# nel repo nuovo
mkdir -p .cursor/skills .cursor/rules scripts
cp -R path/to/ReWavier/.cursor/skills/apple-release .cursor/skills/apple-release
cp path/to/ReWavier/.cursor/rules/apple-release.mdc .cursor/rules/apple-release.mdc
cp path/to/ReWavier/scripts/xcode-testflight.sh scripts/xcode-testflight.sh
```

Adatta `scripts/xcode-testflight.sh`: `SCHEME`, `WORKSPACE`, `ARCHIVE`, `DEVELOPMENT_TEAM` (vedi sezione **TestFlight con Xcode locale** in `SKILL.md`).

In `AGENTS.md` del repo nuovo, aggiungi:

```md
# Apple release

TestFlight (VAI o `scripts/xcode-testflight.sh`) ≠ recensione Store. Bypass EAS: build con Xcode locale (`expo prebuild` + `xcodebuild`). Prima di Submit for Review leggi `.cursor/skills/apple-release/SKILL.md`. Compila `review-notes.template.txt`. Non inviare la scheda se manca il pacchetto (note 7 punti, demo login, video iPhone fisico, privacy URL, screenshot veri).
```

Le Notes **compilate** di quell’app stanno nel suo `docs/` (o equivalente), non in questa skill.

Se Apple boccia di nuovo: aggiungi il caso in `.cursor/skills/apple-release/lessons.md` e la regola in `SKILL.md` nello stesso task. Casi già dentro: ReWavier (2.1 Information Needed) e MusicPro Eventi (Age Rating Individual, login invisibile, Strong Password, export compliance).

## Sul Mac, tutte le chat locali

Copia la skill anche qui, così Cursor Desktop la propone anche prima di clonare il pack nel repo:

```bash
mkdir -p ~/.cursor/skills
cp -R .cursor/skills/apple-release ~/.cursor/skills/apple-release
```

Gli agenti Cloud vedono **solo** ciò che è nel git del repo. Senza la copia nel repo, in cloud questa regola non c’è.

## User rule (una volta, tutte le app)

In Cursor → Settings → Rules, incolla:

```text
Prima di Submit for Review o se Apple boccia: leggi .cursor/skills/apple-release/SKILL.md se c’è. TestFlight = Xcode locale (xcode-testflight.sh / ios:ship-testflight / VAI su ReWavier), non obbligatorio EAS. VAI ≠ recensione Store. Non dire che la scheda è pronta senza note 7 punti, account demo, video su iPhone fisico, privacy URL, screenshot veri, Age Rating (Individual → Simulated Gambling = None). Non rispondere Yes a Simulated Gambling per sicurezza.
```
