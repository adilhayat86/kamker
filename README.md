# Kamker

Kamker is a Pakistan service-directory marketplace for workers and professionals such as nurses, maids, teachers, handwriting teachers, artists, drivers, cooks, electricians, plumbers, tutors, beauticians, and guards.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- App Router
- shadcn/ui-style components
- Supabase client scaffold

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Vercel Deployment

Vercel auto-detects this as a Next.js project.

Build command:

```bash
npm run build
```

Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The app builds without these variables, but Supabase-backed features should set them in Vercel project settings.
