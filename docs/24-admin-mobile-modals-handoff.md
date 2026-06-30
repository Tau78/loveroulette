# Handoff — Admin mobile modals (MusicPro Eventi)

> Per **musicpro-eventi-app** (`admin.musicproeventi.it`)  
> Love Game web ha già i componenti di riferimento in `web/src/components/admin/AdminConfirmDialog.tsx` e `AdminAlertDialog.tsx`.

---

## Problema

1. **Popup fuori schermo su mobile** — il confirm delete locale appare al centro del documento (lista lunga), non del viewport. L’overlay scurisce lo schermo ma il dialogo non è visibile senza scrollare.
2. **`window.alert` per errori** — es. `Impossibile eliminare "[TEST] Blocco 3 ore": ci sono 2 eventi passati collegati.` usa il dialog nativo del browser.
3. **Locali `[TEST]` non eliminabili** — `admin_delete_venue` rifiuta se esistono eventi passati collegati.

---

## Fix UI (apps/admin)

### Root cause posizionamento

I modal **non devono** essere figli del contenuto scrollabile della lista. Pattern obbligatorio:

```tsx
import { createPortal } from "react-dom";

// Overlay: fixed inset-0 (viewport), NON absolute
// Portal: document.body
createPortal(
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <div className="admin-card w-full max-w-sm">…</div>
  </div>,
  document.body,
);
```

Evitare:

- `position: absolute` + `top: 50%` sul wrapper della lista
- Modal renderizzati **dentro** la card del locale o dentro il loop `.map()`
- `window.confirm()` / `window.alert()` ovunque in `apps/admin`

### Componenti da introdurre (o allineare)

| Componente | Uso |
|------------|-----|
| `AdminConfirmDialog` | Conferma eliminazione locale, evento, email, ecc. |
| `AdminAlertDialog` | Errori RPC (`admin_delete_venue`, `admin_purge_event`, …) |

Classi MusicPro già in produzione: `admin-card`, `admin-btn-primary`, `text-mp-danger`, `bg-mp-bg`, `text-mp-muted`, `border-mp-border`.

### File da controllare in musicpro-eventi-app

Cercare in `apps/admin/src`:

```
rg "window\.(confirm|alert)|\.confirm\(|\.alert\(" apps/admin
rg "absolute inset-0|items-center justify-center" apps/admin/src --glob '*locali*'
```

Punti tipici:

- `app/impostazioni/locali/page.tsx` (o equivalente)
- `components/admin/*Venue*` / `*Locali*`
- Qualsiasi pannello impostazioni con delete

### Integrazione delete locale

Flusso attuale (da bundle produzione):

```ts
// packages/shared — admin_delete_venue RPC
const result = await supabase.rpc("admin_delete_venue", { p_venue_id: id });
// result.message → "Impossibile eliminare … eventi passati collegati"
```

Sostituire:

```ts
// PRIMA (da rimuovere)
if (!window.confirm("Eliminare il locale?")) return;
// …
if (!result.success) window.alert(result.error);

// DOPO
setConfirmVenue(venue);           // apre AdminConfirmDialog
// onConfirm → chiama deleteVenue(), su errore setAlertMessage(result.error)
```

---

## Pulizia locali `[TEST]`

Script SQL in Love Game: [`web/scripts/cleanup-test-venues.sql`](../web/scripts/cleanup-test-venues.sql)

1. Aprire Supabase SQL Editor (project `fvxdghqpavdcohczrvsc`) come `postgres`
2. Eseguire con `v_dry_run := true` → verificare elenco
3. Impostare `v_dry_run := false` → rieseguire

Lo script:

1. Trova `venues.name ILIKE '[TEST]%'`
2. Per ogni evento collegato chiama `admin_purge_event(event_id)`
3. Poi `admin_delete_venue(venue_id)` per ogni locale test

---

## Checklist consegna (GAS)

- [ ] `AdminConfirmDialog` + `AdminAlertDialog` con `createPortal` + `fixed inset-0`
- [ ] Delete locale: confirm custom, errore RPC in alert custom (no `window.alert`)
- [ ] Audit `apps/admin`: zero `window.confirm` / `window.alert`
- [ ] Test mobile Safari: elimina locale a metà lista → dialog visibile senza scroll
- [ ] Eseguito `cleanup-test-venues.sql` su Supabase (dry-run poi apply)

---

## Riferimenti Love Game

| File | Note |
|------|------|
| `web/src/components/admin/AdminConfirmDialog.tsx` | Portal + viewport fixed |
| `web/src/components/admin/AdminAlertDialog.tsx` | Stesso pattern per errori |
| `web/src/components/admin/AdminPinModal.tsx` | Aggiornato con portal |
| `web/scripts/cleanup-test-venues.sql` | Pulizia DB locali test |
