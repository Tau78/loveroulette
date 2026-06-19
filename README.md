# Love Roulette

Piattaforma web per **Love Roulette** — gioco interattivo live in sala per single.

## Struttura progetto

```
Love Game/
├── docs/                    # Documentazione completa v2
│   ├── 00-master-spec-v2.md # Spec master unificata
│   ├── 01-game-design.md
│   ├── ...
│   └── printable/
│       └── checklist-animatore.pdf
└── web/                     # App Next.js (M1 scaffold)
```

## Documentazione

Inizia da **[docs/00-master-spec-v2.md](docs/00-master-spec-v2.md)**.

Review pending: **[docs/REVIEW.md](docs/REVIEW.md)**

## Quick start (web)

```bash
cd web
cp .env.example .env.local
# Configura Supabase credentials

npm install
npm run dev
```

Apri:
- http://localhost:3000 — Home
- http://localhost:3000/s/DEMO01 — Evento demo
- http://localhost:3000/s/DEMO01/display — Proiettore
- http://localhost:3000/admin/DEMO01 — Dashboard animatore

## Database

Applica migration:

```bash
# Con Supabase CLI
supabase db push
# Poi seed
psql $DATABASE_URL -f supabase/seed.sql
```

## Roadmap

| Milestone | Scope |
|-----------|-------|
| M1 | Core game — quiz, matching, estrazione, finali, voto |
| M2 | Chat, domande avanzate, badge QR, stats |
| M3 | Giuria, offline queue, polish |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind · Supabase · Vercel
