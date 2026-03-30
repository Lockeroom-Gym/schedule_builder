# Lockeroom Schedule Builder - Architecture & State

This document serves as the source of truth for the Lockeroom Schedule Builder application's architecture, design patterns, and business logic. It should be referenced before building new features to ensure consistency.

## 1. System Overview
**Purpose:** A staff scheduling dashboard for Lockeroom gym operations. Managers use this app to build weekly class schedules and assign coaches to specific slots based on capacities, roles, and staff preferences.
**Target Audience:** Internal Gym Managers and Operations Staff.
**Deployment:** Vercel (Single Page Application).

## 2. Tech Stack
- **Framework:** React 18
- **Language:** TypeScript (Strict Mode)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v3
- **Database / Backend:** Supabase (PostgreSQL)
- **Data Fetching & State:** `@tanstack/react-query` v5
- **Routing:** React Router v6
- **Date Manipulation:** `date-fns`

## 3. Project Structure
The `src/` directory is strictly organized by technical concern and domain:

```
src/
├── components/          # React components
│   ├── coaches/         # Domain: Coach roster UI
│   ├── layout/          # Global layout (AppShell, Header)
│   ├── preferences/     # Domain: Preference & compliance UI
│   ├── schedule/        # Domain: The main calendar grid & session UI
│   └── ui/              # Generic, reusable UI (Badge, Modal, Dropdown)
├── hooks/               # Custom React hooks (TanStack Query + Supabase)
├── lib/                 # Pure utility functions and constants
│   ├── constants.ts     # Global static data (GYMS, ROLE_SENIORITY_ORDER)
│   ├── dateUtils.ts     # Date math and formatting
│   ├── scheduleUtils.ts # Domain logic (sorting, bracket parsing)
│   └── supabase.ts      # Supabase client initialization
├── pages/               # Top-level route components
└── types/               # Global TypeScript definitions
    ├── database.ts      # Supabase schema definitions (1:1 with DB)
    └── schedule.ts      # Frontend-specific composite types
```

## 4. Design Patterns

### Data Fetching (Server State)
- **Direct Supabase Queries:** We query Supabase directly from the client. No intermediate Node.js backend.
- **Custom Hooks:** All queries and mutations are wrapped in custom hooks inside `src/hooks/` (e.g., `useStaff`, `useMutateSession`). **Components never call Supabase directly.**
- **TanStack Query:** We use `useQuery` for fetching (caching, deduping) and `useMutation` for writing. Cache invalidation ensures optimistic-like UI updates (e.g., `queryClient.invalidateQueries({ queryKey: ['session-coaches'] })`).

### Component State (Client State)
- Local state (`useState`, `useMemo`) is used for UI toggles (collapsed days, show/hide coaches, filters).
- Global state libraries (Redux/Zustand) are **avoided**. Server state lives in TanStack Query, UI state lives in React.

### Styling
- **Utility-First:** Tailwind CSS is used exclusively. Avoid custom CSS files unless defining global utilities (like `@layer utilities` for custom scrollbars in `index.css`).
- **Dynamic Styling:** Inline styles are used ONLY for dynamic data-driven values (e.g., coach avatar hex colors: `style={{ backgroundColor: coach.rgb_colour }}`).

## 5. Core Business Logic & Rules

### Schedule Grid
- **Axes:** Days run left-to-right (Mon-Sat). Time slots run top-to-bottom.
- **Gyms:** Filterable by Bligh, Bridge, and Collins. Represented by color-coded borders (Bligh: Amber, Bridge: Purple, Collins: Grey).
- **Session Types:** Perform, VO2, Box, Squad, VO2 Box. Each has an assigned color and a `clients_per_coach` ratio.

### Spot Calculation
- **Dynamic Capacity:** The total spots available for members in a class is not a hardcoded number. It is computed dynamically:
  `Spots = (Number of Assigned Coaches) × (session_type.clients_per_coach)`
- *Example:* If Perform has a ratio of 2, assigning 3 coaches creates 6 spots.

### Coach Seniority & Sorting
Coaches are universally sorted by a strict hierarchy defined in `ROLE_SENIORITY_ORDER`:
1. Head of Exercise
2. Gym Manager
3. Senior Coach
4. Advanced Coach
5. Coach
6. Casual Coach
*Ties are broken alphabetically by `coach_name`.*

### Staff Summaries & Brackets
- **Count:** Actual class appearances in `schedule_session_coaches` for the active week.
- **Target:** The coach's `rm_ceiling` (target volume).
- **Bracket Warning:** If a coach's assigned session count falls outside their `[min, max]` string (parsed from `session_bracket_name`), a warning is flagged.

### Scheduling Phases & Locks
Based on `week_start` vs Today (aligned to start of week):
- **Draft Window:** > 4 weeks out. Full editing allowed for schedule and staff preferences.
- **Live (Booking Open):** 0–4 weeks out. Schedule is active and members can book in. Staff preferences are locked.
- **Locked:** Past weeks (< 0 weeks out). All past schedules are locked and cannot be changed.
- **Hard Lock:** Controlled by `view_schedule_periods_effective.is_locked_effective`. When true, all UI mutations (Add, Remove, Assign, Delete) are disabled, overriding the phase.
