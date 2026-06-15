# Hardening Kit Web

SaaS dashboard for the [Hardening Kit](https://github.com/amir-chaari22/hardening_kit) — visualize scan results, manage exceptions, and track release security across all your projects.

## Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| Framework   | Next.js 14 (App Router)                         |
| UI          | shadcn/ui + Radix UI + Tailwind CSS             |
| Auth        | Supabase Auth (email + GitHub OAuth)            |
| Database    | Supabase PostgreSQL via Drizzle ORM             |
| API         | Hono (on Next.js API routes)                    |
| Deployment  | Vercel / any Node.js host                       |

## Features

- **Dashboard** — scan history, block rate, unread alerts
- **Projects** — per-project scan history, exceptions, setup guide
- **Scan detail** — violations, warnings, checks summary
- **Alerts** — security alerts on BLOCK decisions
- **Settings** — profile, organization, API keys
- **Landing page** — public marketing page

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run `drizzle/0000_initial.sql` in the SQL editor
3. Enable GitHub OAuth in **Auth → Providers**
4. Copy your project URL and keys

### 2. Environment

```bash
cp .env.local.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install & run

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 4. Connect the CLI

After signing up, go to **Settings → API Keys** and create a key.

Set it in your project CI:

```bash
export HARDENING_KIT_API_URL=https://your-dashboard.vercel.app
export HARDENING_KIT_API_KEY=hk_...
```

The CLI will POST scan results automatically.

## Project structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── auth/
│   │   ├── login/page.tsx               # Sign in
│   │   ├── signup/page.tsx              # Sign up
│   │   └── callback/route.ts            # OAuth callback
│   ├── dashboard/
│   │   ├── layout.tsx                   # Sidebar layout (auth gated)
│   │   ├── page.tsx                     # Overview
│   │   ├── projects/
│   │   │   ├── page.tsx                 # Project list
│   │   │   ├── new/page.tsx             # Create project
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # Project detail
│   │   │       └── scans/[scanId]/page.tsx  # Scan detail
│   │   ├── alerts/page.tsx              # Alerts
│   │   └── settings/page.tsx           # Settings
│   └── api/[[...route]]/route.ts        # Hono API
├── components/
│   ├── ui/                              # shadcn/ui components
│   ├── layout/sidebar.tsx              # Navigation sidebar
│   ├── projects/copy-button.tsx
│   ├── alerts/mark-read-button.tsx
│   └── settings/
│       ├── profile-form.tsx
│       └── api-key-section.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts                   # Drizzle schema (7 tables)
│   │   └── index.ts                    # DB client
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   └── server.ts                   # Server client
│   └── utils.ts                        # cn() helper
└── middleware.ts                        # Auth protection
```

## Database schema

7 tables: `organizations`, `members`, `projects`, `scans`, `exceptions`, `alerts`, `api_keys`

Row-level security (RLS) enforced — users can only see their org's data.

Auto-creates org + member row on signup via Supabase Auth trigger.

## Deploy to Vercel

```bash
vercel --prod
```

Set all `.env.local` variables in the Vercel dashboard.

## API endpoints (Hono)

| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/health | Health check |
| GET    | /api/projects | List projects |
| POST   | /api/projects | Create project |
| GET    | /api/projects/:id | Get project |
| GET    | /api/projects/:id/scans | List scans |
| POST   | /api/projects/:id/scans | Submit scan result |
| GET    | /api/scans/:id | Get scan |
| GET    | /api/projects/:id/exceptions | List exceptions |
| POST   | /api/projects/:id/exceptions | Add exception |
| DELETE | /api/projects/:id/exceptions/:id | Remove exception |
| GET    | /api/alerts | List unread alerts |
| PATCH  | /api/alerts/:id/read | Mark alert read |
| GET    | /api/dashboard/stats | Dashboard statistics |
