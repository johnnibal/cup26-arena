# Cup26 Arena

**Status: active development** — features and schema may change; not production-hardened yet.

Cup26 Arena is a **FIFA World Cup 2026–style prediction game**: signed-in users predict group-stage (and eventually knockout) scores, earn points, and appear on a global leaderboard. Scoring and leaderboard data live in **Supabase (Postgres)** with **Row Level Security**; admins can enter official results so predictions are scored after full time.

## Tech stack

| Area        | Choice |
| ----------- | ------ |
| Framework   | [Next.js](https://nextjs.org) 15 (App Router) |
| UI          | React 19, TypeScript, [Tailwind CSS](https://tailwindcss.com) 3, [Framer Motion](https://www.framer.com/motion/) |
| Backend     | [Supabase](https://supabase.com) — Auth (e.g. Google), Postgres, RPC for scoring |
| Tooling     | ESLint, Prettier |

## Main features

- **Matches** — Browse 2026 group fixtures (kickoffs, venues, teams) and match detail.
- **Predictions** — Submit scorelines before kickoff; edits locked after kickoff.
- **Scoring** — Exact score = 3 points; correct result (win/draw) only = 1 point (see DB functions for authoritative rules).
- **Leaderboard** — Aggregated user stats from scored predictions.
- **Profile** — Favorite team, theming, identity for the competition.
- **Admin** — Result entry / corrections (restricted to users in the `admin_users` allow-list in the database).

Knockout bracket generation is **planned** only; see [`docs/knockout-2026.md`](./docs/knockout-2026.md).

## Prerequisites

- **Node.js** 20+
- **npm** 10+ (or compatible package manager)
- A **Supabase** project with migrations applied and seeds loaded (see `supabase/migrations/`)

## Install and run locally

```bash
git clone <your-repo-url>
cd cup26-arena
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, and other vars (see below).
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful scripts

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Development server       |
| `npm run build`         | Production build         |
| `npm start`             | Run production build     |
| `npm run lint`          | ESLint                   |
| `npm run type-check`    | TypeScript (no emit)     |
| `npm run format`        | Prettier (write)         |
| `npm run format:check`  | Prettier (check only)    |

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local`. Do **not** commit `.env.local`.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (safe to expose to the browser). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe for client; RLS enforced). |
| `SUPABASE_SERVICE_ROLE_KEY` | For some server/tooling | **Server-only.** Bypasses RLS — never expose in client bundles or public repos as a committed value. |
| `NEXT_PUBLIC_APP_URL` | Yes (typical) | Public site URL, e.g. `http://localhost:3000` in dev. |

Replace placeholders with values from the Supabase dashboard **Settings → API**. Never paste real keys into issues, READMEs, or commits.

### Security note before you push

- The **`.next`** folder can contain **inlined `NEXT_PUBLIC_*` values** from your last `next build` / dev session. It is gitignored — keep it that way. For a clean machine state you can delete `.next` anytime; it is regenerated on the next build.
- Keep **`.env.local`** and **`supabase/.env`** out of git (see `.gitignore`).
- If anything sensitive was ever committed, remove it from history and **rotate** the affected keys in Supabase.

## Project structure (high level)

```
src/app/          # Next.js routes (auth, main app, admin)
src/components/   # UI by feature
src/lib/          # Supabase clients, env helpers, data loaders
supabase/         # SQL migrations and seeds
public/           # Static assets (e.g. flags)
docs/             # Design notes (e.g. future knockout format)
```

## Database

Schema, RLS, scoring functions, and seeds live under `supabase/migrations/`. Apply them with the Supabase CLI or dashboard in the order of the migration filenames.

## License

Add a `LICENSE` file if you want to specify terms for a public repository.
