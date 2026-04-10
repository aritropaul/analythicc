# 🍑 analythicc

Fun, peachy-fresh analytics for your projects. Self-hosted. Privacy-first. No cookies.
Built on Next.js + Cloudflare D1 + Drizzle.

![theme: peach/coral/cream](https://img.shields.io/badge/theme-peachy-ff7e5f?style=flat-square)

## ✨ What you get

- **Multi-project dashboard** — one install, many sites
- **Real-time visitors** — live pulse that updates every 15s
- **KPIs** — visitors, pageviews, bounce rate, avg session duration
- **Drill-downs** — pages, sources, countries, devices, browsers, OS
- **Beautiful charts** — smoothed SVG line charts with hover states
- **Custom events** — `window.ana('event', 'signup_click')`
- **SPA-aware tracker** — patches `history.pushState` automatically
- **Tiny tracker** — ~2 KB, no deps, no cookies (uses sessionStorage)
- **Single-user auth** — password + signed cookie, zero infra
- **Edge runtime** — all routes run on Cloudflare Workers
- **Privacy friendly** — IP never stored, country from `request.cf`

## 🚀 Quick start

### 1. Install dependencies

```bash
cd analythicc
npm install
```

### 2. Create a Cloudflare D1 database

```bash
npx wrangler login
npx wrangler d1 create analythicc
```

Copy the `database_id` it prints into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "analythicc"
database_id = "paste-it-here"
migrations_dir = "drizzle/migrations"
```

### 3. Apply migrations

Local (for `pages dev`):
```bash
npm run db:migrate:local
```

Remote (production D1):
```bash
npm run db:migrate:remote
```

### 4. Set local secrets

Copy the example file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```env
ADMIN_PASSWORD="pick-a-good-one"
SESSION_SECRET="$(openssl rand -hex 32)"
SALT_SEED="$(openssl rand -hex 16)"
```

### 5. Run it

```bash
npm run pages:dev
```

Open http://localhost:8788, log in with `ADMIN_PASSWORD`, create your first project.

> **Note:** `npm run dev` (plain Next dev) won't have D1 bindings. Always use
> `npm run pages:dev` for local development.

## 📦 Install the tracker

Once you create a project, you'll get a snippet like:

```html
<script defer src="https://your-analythicc.pages.dev/tracker.js" data-site="a1b2c3d4e5f6a7b8"></script>
```

Paste it before `</head>` on the site you want to track. That's it.

### Custom events

```js
window.ana('event', 'button_click', { location: 'hero' });
```

### Local development tracking

Localhost is ignored by default. To enable:

```html
<script defer src="..." data-site="..." data-track-localhost></script>
```

### Respect Do Not Track

```html
<script defer src="..." data-site="..." data-respect-dnt></script>
```

## 🌐 Deploy

### Cloudflare Pages (recommended)

```bash
npm run pages:deploy
```

Then set your secrets in the Cloudflare dashboard:

- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `SALT_SEED`

And bind your D1 database in **Settings → Functions → D1 database bindings**:

- Variable name: `DB`
- Database: `analythicc`

### Vercel

```bash
vercel deploy
```

Note: D1 is Cloudflare-only. For Vercel, swap `drizzle-orm/d1` for a different
SQLite-compatible adapter (Turso, Neon, Postgres). The schema is portable.

## 🗂️ Project structure

```
analythicc/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── collect/       # tracker → D1
│   │   │   ├── auth/          # login / logout
│   │   │   ├── sites/         # project CRUD
│   │   │   └── stats/[id]/    # aggregations for dashboard
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # project list
│   │   │   └── [siteId]/      # single-project analytics
│   │   ├── login/
│   │   └── layout.tsx
│   ├── components/            # KPI card, line chart, tables, etc.
│   ├── lib/
│   │   ├── schema.ts          # Drizzle tables
│   │   ├── db.ts              # D1 client
│   │   ├── auth.ts            # HMAC cookie session
│   │   ├── stats.ts           # query helpers
│   │   └── ua.ts              # tiny UA parser
│   └── middleware.ts          # auth gate
├── public/
│   └── tracker.js             # client-side script
├── drizzle/migrations/        # SQL migrations
├── wrangler.toml              # Cloudflare config
└── next.config.mjs
```

## 🎨 Theme

Warm peach + coral + cream. Instrument Serif for display, Inter for UI.

- `peach.*`       — main surface tones
- `coral.400/500` — accents, CTAs, active states
- `ink.900`       — text
- `cream.50`      — background

Modify `tailwind.config.ts` to retune.

## 🔒 Privacy notes

- No cookies. Session IDs live in `sessionStorage`.
- No IP addresses stored. Only country/region/city from Cloudflare's edge.
- No third-party pixels or CDNs.
- Deletes are cascading — deleting a site wipes all its events.

## 📝 License

MIT. Do whatever. Ship fun things.
