# Lockeroom Schedule Builder

A staff scheduling dashboard for Lockeroom gym operations. Managers build weekly session schedules by creating class time slots and assigning coaches.

## Features

- **Schedule Grid** — Weekly view by day. Create sessions, assign/remove coaches per slot. Collapsed day columns. Leave overlays. Locked period detection.
- **Staff Summary Strip** — Live session count vs. target per coach with bracket warnings.
- **Preferences View** — Read-only preference submissions with compliance cards.
- **Coaches Roster** — Card grid with filters, leave status, session counts.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3
- Supabase JS v2 (anon key, direct client queries)
- TanStack Query v5
- React Router v6
- date-fns

## Local Development

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — `vercel.json` handles SPA routing automatically

## Database Tables (New)

Three tables are created by migrations:
- `system_session_types` — Class type lookup (Perform, VO2, Box, Squad, VO2 Box)
- `system_session_gym_capacity` — Per-gym max coach overrides per class type
- `schedule_sessions` — Individual session slots per week/day/time/gym
- `schedule_session_coaches` — Coach assignments per session (many-to-many)

## Business Rules

- **Spots** = `coaches_assigned × clients_per_coach` (dynamic, not stored)
- **Session count** = actual class appearances in `schedule_session_coaches` for the week
- **Bracket warning** = assigned count outside `[min, max]` from session bracket
- **Locked period** = `view_schedule_periods_effective.is_locked_effective = true`
- **Period phases**: Build (>6wks), Booking (4–6wks), Manage (<4wks)
