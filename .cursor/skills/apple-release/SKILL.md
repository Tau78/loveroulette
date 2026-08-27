---
name: apple-release
description: How to send an iOS app to App Store Review without repeating ReWavier or MusicPro Eventi rejections. Use for first submission, Submit for Review, App Review notes, TestFlight via Xcode local (bypass EAS Build), EAS fallback, Age Rating on Individual accounts, demo login, Strong Password, export compliance, account deletion, or Apple rejection 2.1 / 2.3.3 / 5.1.1. Copy this folder into every iOS repo.
---

# Apple release (recensione Store)

Due rilasci. Confonderli costa giorni.

| Azione | Cosa arriva | Cosa non arriva |
| --- | --- | --- |
| **Xcode locale** → TestFlight (vedi sotto) | Binary su **TestFlight** | Scheda Store, note, video, credenziali, Age Rating |
| **`npm run ios:ship-testflight`** (MusicPro Eventi) | Come sopra | Come sopra |
| **`bash scripts/xcode-testflight.sh`** o **VAI** (ReWavier) | Come sopra | Come sopra |
| **`eas build --auto-submit`** (solo se piano Expo attivo e quota disponibile) | Binary su **TestFlight** | Come sopra |
| **Submit for Review** in App Store Connect | Recensione per lo Store | — |

In un altro repo **VAI può voler dire altro** (es. deploy admin su MusicPro Eventi). Non trattarlo come recensione Store.

**TestFlight senza EAS Build (consigliato sul Mac):** l’app resta **Expo** (`app.json`, SDK, Metro, Expo Go in sviluppo). Si bypassa solo la **build cloud** su expo.dev. Sul Mac: `expo prebuild` → `xcodebuild archive` → upload App Store Connect. Non consuma quota EAS.

| Repo | Comando rilascio TestFlight |
| --- | --- |
| **ReWavier** | `VAI_MESSAGE='…' bash scripts/vai.sh` (commit + push + FTP + `scripts/xcode-testflight.sh`) |
| **MusicPro Eventi** | `npm run ios:ship-testflight` dalla root `musicpro-eventi-app/` |
| **Love Roulette (plancia)** | `bash scripts/xcode-testflight.sh` dalla root (guscio Expo in `mobile/`) |
| **Nuova app Expo** | Copia `scripts/xcode-testflight.sh` da ReWavier o MusicPro; adatta scheme/workspace/team (vedi sezione sotto) |

Con piano Expo attivo e quota: `eas build --profile production --platform ios --auto-submit` resta valido, ma **non** è l’unica strada.

Apple non tratta TestFlight come “scheda pronta”. Se manca **App Review Information**, bocciano **Guideline 2.1 — Information Needed**. Se sbagli **Age Rating** su account Individual, bloccano **prima** della review. Non è un bug dell’app: è un pacchetto incompleto o un questionario sbagliato.

Leggi questa skill **prima** di dire che l’app è pronta per lo Store, e **subito** se arriva un rifiuto. Compila `review-notes.template.txt` dall’app vera. Casi veri: `lessons.md`. Non inventare modelli iPhone né servizi.

## TestFlight con Xcode locale (bypass EAS Build)

**Cosa si bypassa:** solo `eas build` (compilazione sui server Expo). **Cosa resta Expo:** progetto, plugin, `app.json` / `app.config.js`, `npx expo start`, Expo Go, `expo prebuild` per generare la cartella nativa `ios/`.

### Quando usarlo

- Quota EAS esaurita o piano free senza build iOS
- Mac con Xcode già configurato (es. Mac mini worker locale)
- Serve una build di rilascio senza aspettare la coda cloud

### Quando usare ancora EAS

- CI senza Mac fisico
- Piano Expo attivo con quota disponibile
- Team che non vuole gestire Xcode sul Mac

### Prerequisiti (una volta per Mac)

1. **Xcode** installato (App Store)
2. **Apple ID** sviluppatore in **Xcode → Settings → Accounts**
3. **Team** selezionato (es. `YSU7PL673A`) con signing automatico
4. App già creata su **App Store Connect** (bundle ID, certificati gestiti da Xcode con `-allowProvisioningUpdates`)

### Flusso (ogni rilascio)

```text
app.json (buildNumber++) → expo prebuild --platform ios → pod install → xcodebuild archive → exportArchive upload → TestFlight (5–15 min)
```

La cartella `ios/` di solito è in `.gitignore`: si rigenera a ogni build. Dopo cambi a plugin Expo, permessi nativi o `app.json` → rifare **prebuild**.

### Comandi per repo

**ReWavier** (tutto-in-uno con commit):

```bash
VAI_MESSAGE='Perché del rilascio' bash scripts/vai.sh
```

Solo archivio + upload, senza git:

```bash
bash scripts/xcode-testflight.sh          # prebuild + archive + upload
bash scripts/xcode-testflight.sh --no-upload   # solo archivio locale
```

**Love Roulette** (guscio plancia in `mobile/`, stesso team `YSU7PL673A`):

```bash
bash scripts/xcode-testflight.sh --prebuild
```

Flag `vai.sh`: `--skip-build`, `--skip-submit` (archivio senza upload), `--skip-ftp`.

**MusicPro Eventi** (monorepo mobile):

```bash
cd musicpro-eventi-app
npm run ios:ship-testflight              # bump build + archive + upload
npm run ios:testflight:archive           # --no-upload
```

Con `app.json` cambiato: `bash apps/mobile/scripts/xcode-testflight.sh --prebuild`.

### Nuova app Expo — setup minimo

1. Copia in `.cursor/skills/apple-release/` (questa skill) + regola `apple-release.mdc` — vedi `INSTALL.md`.
2. Copia e adatta uno script da ReWavier (`scripts/xcode-testflight.sh`) o MusicPro (`apps/mobile/scripts/xcode-testflight.sh`):
   - `SCHEME` e `WORKSPACE` (nome app in `ios/`)
   - `DEVELOPMENT_TEAM` o `EXPO_APPLE_TEAM_ID`
   - path archivio (`ios/build/NomeApp.xcarchive`)
3. In `app.json`: `expo.ios.bundleIdentifier`, `expo.ios.buildNumber`, `ITSAppUsesNonExemptEncryption: false` se solo HTTPS.
4. Aggiungi in `package.json` o documentazione il comando tipo `ios:ship-testflight`.
5. **Non** committare segreti. **Non** assumere che `eas build` sia l’unico percorso.

### Cosa aspettarsi / problemi comuni

| Sintomo | Cosa fare |
| --- | --- |
| Upload riuscito, warning **dSYM** React/Hermes | Di solito **non blocca** TestFlight |
| `xcodebuild` auth / provisioning | Controlla Apple ID in Xcode Accounts |
| Build vecchia su TestFlight (fix JS non visibili) | Verifica che prebuild sia girato e `buildNumber` incrementato |
| App bloccata su splash | Di solito bug avvio, non pipeline: fix codice → nuova build Xcode |
| Quota EAS | Usa Xcode locale; non insistere con `eas build` |

### Agente Cursor

- Se esiste `scripts/xcode-testflight.sh` o `npm run ios:ship-testflight`, **usalo** per TestFlight.
- Non lanciare `eas build` se la quota è esaurita o l’utente ha chiesto Xcode.
- **VAI** su ReWavier = già pipeline Xcode (non EAS).
- TestFlight ≠ Submit for Review: dopo l’upload serve ancora il pacchetto metadati sotto.

## Pacchetto obbligatorio (prima app o versione nuova)

Blocca Submit for Review se manca anche una riga.

1. **Privacy** — URL `https` pubblico, testo allineato all’app (login, microfono, account).
2. **Screenshot** — app in uso (funzione vera), non splash e non solo login (2.3.3). Niente nomi TEST / REVIEW / SMOKE.
3. **Sign-In Required** — se c’è un login, ON. Username e password nei **campi dedicati**, non solo nelle Notes.
4. **Notes** — inglese, sotto 4000 caratteri, tutti e 7 i punti del template. Percorso tap **esatto** (quale pulsante, quale tab Password vs magic link).
5. **Video** — iPhone **fisico**, ultimo iOS, parte dall’icona. Allega in Resolution Center / App Review Information.
6. **Account demo** — funziona sulla **stessa build** in recensione. Non scade. Non è un cliente reale.
7. **Elimina account** — se si può creare un account, deve esserci in-app (5.1.1). Stessa build del video.
8. **Purpose string** — ogni permesso (microfono, foto, posizione, tracking) dice perché, in parole piane.
9. **Device testati** — modelli e iOS veri. Se non li sai, chiedi. Non inventare.
10. **Contatto** — nome, telefono, email in App Review Information.
11. **Age Rating** — su account **Individual**: Simulated Gambling = **None**. Quiz / classifiche / premi in locale / punti torneo = *Gambling and Contests* (Infrequent/Mild Contests). «Yes per sicurezza» blocca la submission.
12. **App Privacy** — nutrition labels compilati. Senza, «Aggiungi alla verifica» resta rosso. Non dichiarare dati che non raccogli.
13. **Export compliance** — `ITSAppUsesNonExemptEncryption = false` **nel binary** (`app.json` e `Info.plist` se c’è `ios/` nativo). Solo HTTPS.
14. **Login visibile** — ospite: Accedi (o equivalente) sul primo schermo, senza caccia.
15. **Password iOS** — campi nuova password / conferma: niente Strong Password (`textContentType="none"`, `passwordRules=""`, autofill off).
16. **Listing ≠ Notes** — vetrina = solo il ruolo utente. Staff / host e credenziali demo solo in App Review Information.

Niente acquisti? Scrivilo. Niente social pubblico? Niente report/block, e va detto. Drive/iCloud/AI/pagamenti: elenca o “none”. Email+password only? Niente Sign in with Apple, e va detto (4.8 scatta se c’è Google/Facebook).

## Dove si compila (App Store Connect)

App → versione iOS → scorri fino a **App Review Information**:

- Sign-In Required + User Name + Password
- Notes (incolla il template compilato)
- Attachment (video, se il campo c’è)
- Contact

Scheda app: Privacy Policy URL, categoria, Age Rating, App Privacy, telefono + iPad se li supporti.

**Submit for Review** solo a pacchetto pieno. VAI da solo non basta.

## Video (iPhone fisico)

Simulatore = non vale. Cloud agent = non può girarlo: chiedi all’utente.

1. Chiudi l’app. Avvia Registrazione schermo. Tocca l’icona.
2. Login con l’account demo (email/password, non Apple/Google se il demo è email). Tab **Password**, non magic link.
3. Flusso tipico: funzione centrale in 1–2 minuti.
4. Se esistono: registrazione account, **Elimina account**, acquisti, UGC + report/block, ogni permesso.
5. Ferma. Allega il file nella risposta ad Apple. Tieni una copia.

## Notes: i 7 punti (sempre, anche se “ovvi”)

Copia `review-notes.template.txt`. Compila da codice e da store, in inglese.

1. Screen recording — cosa mostra il video; cosa **non** c’è (IAP, ATT, social).
2. Device e OS testati.
3. Cos’è, per chi, quale problema risolve.
4. Come entrare e usare il nucleo (credenziali + passi + file di esempio se servono).
5. Servizi esterni (Apple, Google, iCloud, pagamenti, AI, backend) o “none”.
6. Differenze per paese, oppure “same in every region”.
7. Settore regolato / materiale protetto, oppure “not applicable”.

Se ci sono quiz, classifiche o punti: una riga che **non** è simulated gambling (niente denaro, niente IAP di valuta, niente cash-out).

## Se Apple boccia

1. Leggi `lessons.md`. Non rifare il prodotto. Non relanciare discovery.
2. **Solo metadati** (Age Rating, Notes, Privacy labels) → correggi in Connect e **rinvia la stessa build**.
3. **2.1 Information Needed** → compila i 7 punti + video sulla build che Apple ha **ora**, salvo buchi di codice.
4. Nuova build **solo** se manca qualcosa nel binario (login invisibile, Elimina account, Strong Password, export compliance). Allora: codice → VAI → video sulla build nuova → poi rispondi.
5. Resolution Center: incolla Notes + allega video. Copia le stesse Notes in App Review Information.

Altre bocciature frequenti: crash su device fisico (2.1 bug); screenshot fake (2.3.3); abbonamento senza prezzo/termini (3.1.2); purpose string vaga (5.1.1); login senza delete (5.1.1); Simulated Gambling su Individual; reviewer che non trova Accedi.

## Cosa può fare l’agente / cosa no

- **Sì:** scrivere Notes, account demo, delete account, purpose string, privacy, Age Rating, checklist, spegnere Strong Password. Dire all’utente i passi: build (se serve) → video → incolla in Connect. Per TestFlight: `xcode-testflight.sh` / `ios:ship-testflight` / VAI su ReWavier.
- **No:** inventare il video; dare Submit for Review se il pacchetto è incompleto; trattare VAI come “è sullo Store”; mettere la password demo sul sito pubblico; rispondere Yes a Simulated Gambling «per sicurezza»; trasferire l’app a un’organizzazione solo per sbloccare quel rating; usare `eas build` quando quota esaurita o il repo ha già script Xcode locale.

TestFlight è per provare sul telefono. Lo Store è un secondo invio, con questo pacchetto già pronto.
