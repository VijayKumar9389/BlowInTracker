# Loftline

Personal blow-in insulation job tracker built with Next.js, Tailwind CSS, Prisma, and Postgres.

## Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier works)

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and find your connection strings
3. You'll need two URLs:
   - **Pooled connection** (port 6543, with `?pgbouncer=true`) for the app
   - **Direct connection** (port 5432) for migrations

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled Supabase connection string (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Direct Supabase connection string (port 5432) |
| `AUTH_SECRET` | Random 32+ character string for JWT signing. Generate with: `openssl rand -base64 32` |

Example `.env`:

```
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
AUTH_SECRET="your-32-character-secret-key-here"
```

## Database Setup

Install dependencies and run migrations:

```bash
npm install
npx prisma migrate dev
```

## Create a User

There's no sign-up flow. Create your user via the CLI:

```bash
npx tsx scripts/create-user.ts your@email.com yourpassword
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your credentials.

## Deploying to Vercel

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `DATABASE_URL` - your pooled Supabase URL
   - `DIRECT_URL` - your direct Supabase URL
   - `AUTH_SECRET` - your JWT secret
4. Deploy

Prisma migrations run automatically during the build via `prisma generate`. Run `prisma migrate deploy` manually or add it to your build command if needed:

```
prisma migrate deploy && next build
```

## Project Structure

```
src/
├── app/
│   ├── jobs/              # Main job tracker UI
│   │   ├── [id]/          # Job detail view
│   │   │   └── edit/      # Edit job form
│   │   ├── actions.ts     # Server actions
│   │   └── page.tsx       # Jobs list
│   ├── login/             # Login page
│   └── logout/            # Logout action
├── components/            # Reusable components
├── lib/
│   ├── auth.ts            # JWT auth helpers
│   ├── db.ts              # Prisma client
│   └── types.ts           # TypeScript types
└── middleware.ts          # Auth middleware
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: JWT (jose) + bcryptjs
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
