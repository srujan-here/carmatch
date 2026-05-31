# Deploying CarMatch to Vercel (with Turso)

Local dev uses a SQLite file. Vercel's serverless filesystem can't persist writes, so
production uses **Turso (libSQL)** — same SQLite dialect, no schema or query changes. The
app auto-switches: it uses the libSQL driver adapter whenever `DATABASE_URL` starts with
`libsql://` (or `TURSO_AUTH_TOKEN` is set), and the native SQLite file otherwise.

## 1. Create the schema + seed your Turso DB (run locally, once)

Prisma's CLI can't push over `libsql://`, so we apply the generated DDL directly and then
seed with the normal script. Using **your** Turso URL and token:

```bash
export DATABASE_URL="libsql://YOUR-DB.turso.io"
export TURSO_AUTH_TOKEN="YOUR_TOKEN"

npm run db:push:turso   # creates the Car + RecommendationSession tables on Turso
npm run db:seed         # loads the 49 cars into Turso
```

You should see `Seeded 49 cars.`

## 2. Deploy to Vercel

### Option A — Dashboard (easiest)
1. Go to **vercel.com/new** and import the GitHub repo `srujan-here/carmatch`.
2. Under **Environment Variables**, add (for Production *and* Preview):
   - `DATABASE_URL` = `libsql://YOUR-DB.turso.io`
   - `TURSO_AUTH_TOKEN` = `YOUR_TOKEN`
   - `ANTHROPIC_API_KEY` = `sk-ant-...` *(optional — turns on the AI layer)*
3. Click **Deploy**. Vercel runs `npm install` + `npm run build` automatically.

### Option B — CLI
```bash
vercel login
vercel link                                  # link to the repo / create a project
printf 'libsql://YOUR-DB.turso.io' | vercel env add DATABASE_URL production
printf 'YOUR_TOKEN'                | vercel env add TURSO_AUTH_TOKEN production
# optional:
printf 'sk-ant-...'                | vercel env add ANTHROPIC_API_KEY production
vercel --prod
```

## Notes
- No build-time DB access is needed — all data routes/pages are `force-dynamic`.
- To verify after deploy: open the live URL, run the wizard, then reload the
  `/results/<id>` URL — if it still shows your shortlist, Turso persistence is working.
- Re-seeding is idempotent: `npm run db:seed` wipes and reloads the catalog.
