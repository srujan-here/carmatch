# CarMatch — from “I don’t know what to buy” to “I’m confident about my shortlist”

A guided car finder. Instead of dumping a 49-car catalog on a confused buyer, CarMatch asks
six quick questions (plus optional free-text), scores **every** car against the buyer’s needs
with a weighted engine, and returns a short, **explained** shortlist — each car with a match %,
the reasons it fits, and the honest trade-offs. Buyers can then compare a few side-by-side.

> Built for the CarDekho “Software Engineer — AI-Native” take-home.

---

## Run it in under 2 minutes

```bash
npm install        # also runs `prisma generate` via postinstall
npm run dev        # generates client, creates + seeds the SQLite DB, starts Next.js
```

Open **http://localhost:3000**. That’s it — no external services, no API keys required.

- `npm test` — engine unit tests (buyer personas)
- `npm run build` — production build
- The AI layer is **optional**: set `ANTHROPIC_API_KEY` in `.env` to turn on natural-language
  free-text parsing and explanations. Without it, the app runs fully on the deterministic engine.

Docker alternative: `docker compose up` (see `docker-compose.yml`).

---

## What I built (and why)

The brief’s real problem is **choice overload**, so the highest-value thing to build is the
*decision*, not another catalog. CarMatch is opinionated about that:

1. **Guided intake** — budget, usage, seats, optional body/fuel/transmission, top priorities, and
   a free-text box. Each question maps to a scoring signal; nothing is asked for decoration.
2. **A real recommendation engine** (the non-trivial backend) — pure, deterministic, testable.
   Hard filters (seating, budget + a 10% stretch) then a weighted, normalized soft score across
   five dimensions (mileage, safety, performance, features, value). The buyer’s priorities and
   usage set the weights; body/fuel/transmission preferences carry real weight too.
3. **Explained results** — a match %, deterministic “why it fits” / “trade-offs”, and a friendly
   one-line summary. Every search is **persisted** and **shareable by URL** (`/results/<id>`).
4. **Side-by-side compare** — pick 2–4 cars; the table highlights the best value per spec row.

### Deliberately cut (to stay in the 2–3h box)
- **Auth / user accounts** — sessions are shareable by unguessable id instead.
- **Real-time data / scraping** — a curated 49-car Indian-market seed instead. The engine is
  data-source-agnostic; swapping in a bigger feed is just a different seed.
- **Car images** — text-first cards; image hosting wasn’t worth the time.
- **Exhaustive test coverage** — focused tests on the engine (the part with real logic) only.
- **Pixel-perfect design** — clean Tailwind, not a design system.

---

## Tech stack & why

| Choice | Why |
| --- | --- |
| **Next.js (App Router, TS)** | One repo for the UI *and* the non-trivial backend (route handlers). First-class Vercel deploy. |
| **Prisma + SQLite** | Real persistence with a typed schema, migrations, and a seed — zero external services locally. Same SQLite dialect scales to **Turso (libSQL)** on serverless via a driver adapter, so prod writes work without changing a query. |
| **Zod** | One source of truth for the preferences contract, shared by the wizard, the API, and the engine — types can’t drift. |
| **Anthropic SDK** | Optional hybrid AI layer (free-text → preferences; natural-language explanations) with prompt caching. Degrades gracefully to templates with no key. |
| **Vitest** | Fast persona tests on the pure engine. No ceremony. |

### Architecture
```
src/lib/recommendation/   pure engine — normalize → weights → score → reasons (no I/O, unit-tested)
src/lib/llm/              optional Claude layer; every function falls back without a key
src/lib/db/               Prisma client (native SQLite local / libSQL prod), repositories
src/lib/types/            Zod + shared domain types (single source of truth)
src/app/api/              recommend · sessions · cars (the backend)
src/app/                  landing · /find wizard · /results/[id] · /compare
src/data/cars.seed.json   curated catalog
```
The engine is deliberately **pure and decoupled** from the DB and the LLM: the API route does I/O,
the engine does math, the LLM layer only ever *enhances*. That’s what keeps it testable and scalable.

---

## AI tools: what I delegated vs. did manually

- **Delegated to the AI tool (Claude Code):** scaffolding, the bulk of the React/Tailwind UI, the
  Prisma wiring, the seed dataset draft, and first drafts of every file. This is the “AI-native”
  point of the exercise — most lines were AI-written.
- **Did / drove manually (the judgment calls):**
  - **Product scoping** — deciding the decision engine (not a catalog) was the highest-value build,
    and what to cut.
  - **The scoring model** — dimensions, weights, budget tolerance, and how reasons/trade-offs are
    derived. I tuned this by reading test output, not by accepting the first version.
  - **Course-correcting the tool.** Two examples that made it into the code:
    - Pinned **Prisma 6** after the scaffold pulled bleeding-edge **Prisma 7** — not worth burning
      the time-box debugging a brand-new major.
    - Caught a dishonest reason: a 3★ car was being labelled *“Strong safety”* by the fallback path.
      Fixed it to a neutral “best overall balance…” so the product never overstates a spec.
- **Where the tools helped most:** boilerplate-heavy UI and the DB/ORM plumbing — fast and correct.
- **Where they got in the way:** defaulting to the newest dependency versions, and being a bit too
  eager to praise mediocre results until I tightened the thresholds.

---

## If I had another 4 hours
- A “why not these?” panel and live sliders to re-rank without re-submitting.
- Persisted, named shortlists and a proper compare-from-catalog browse mode.
- Catalog aggregates (price-by-body-type) on the landing page from a `/api/stats` endpoint.
- Richer LLM use: a conversational follow-up (“actually, bump the boot space”) that edits prefs.
- Real car data + images, and a few Playwright happy-path tests over the engine’s unit tests.
