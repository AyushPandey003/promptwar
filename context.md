# SpiceRoute Planner Context

## Challenge
Build a simple AI micro-app that generates a personal cooking to-do list based on the user's day. Required outputs: breakfast/lunch/dinner plan, grocery list, substitutions, and budget feasibility logic.

## Current Delivery
SpiceRoute Planner is now a **multi-page, authenticated, AI-powered cooking planner** aligned to the PromptWars scoring priorities of code quality, security, dynamic behavior, efficiency, testing, accessibility, and problem-statement alignment.

## Major Updates
- Shifted the app to **Server Actions** for plan generation and login.
- Added **JWT cookie authentication** with protected routes via `proxy.ts`.
- Added **username/password login** page and demo seeded user.
- Added protected pages:
  - `/dashboard` for planner generation
  - `/meals` for generated meal cards
  - `/groceries` for grocery and budget view
- Refactored to a more modular structure with shared auth, planner, repository, schema, and UI components.
- Applied a **Herb & Hearth / Stitch-inspired** visual system with soft eggshell surfaces, herb-green accents, rounded cards, and spacious dashboard layouts.
- Added database-backed seed content so planner profile, options, ingredient pricing, and demo login are not embedded as ad-hoc UI data.

## Data / Persistence
- Uses **Neon Postgres** via `DATABASE_URL`.
- Uses **Drizzle ORM** schema for:
  - `profiles`
  - `planner_options`
  - `ingredient_catalog`
  - `app_users`
  - `meal_plans`
- Added working seed script: `pnpm seed`.

## GenAI Usage
- Uses **Google Gemini API** (`GEMINI_API_KEY`, optional `GEMINI_MODEL`) in the server-side generation flow.
- Gemini produces the structured meal plan JSON including meals, groceries, substitutions, budget reasoning, and timeline.
- If Gemini is unavailable, the app falls back to a deterministic seeded planner.

## Security Notes
- JWT stored in an **HttpOnly** cookie.
- Protected pages are guarded server-side.
- Passwords are stored as **scrypt hashes**.
- Secrets remain server-only.
- User input is validated and normalized before model/database use.
- Gemini output is parsed and normalized before rendering.

## Seeded Demo Login
- Username: `chefayush`
- Password: `SEED_DEMO_PASSWORD` or default `PromptWars@123`

## Key Files
- `app/actions.ts`
- `app/dashboard/page.tsx`
- `app/groceries/page.tsx`
- `app/meals/page.tsx`
- `app/login/page.tsx`
- `app/login/login-form.tsx`
- `app/planner-form.tsx`
- `app/components/protected-header.tsx`
- `lib/auth.ts`
- `lib/planner.ts`
- `lib/repository.ts`
- `lib/schema.ts`
- `scripts/seed.ts`
- `data/seed/profile.json`
- `data/seed/options.json`
- `data/seed/ingredients.json`
- `README.md`
- `DESIGN.md`
- `SUBMISSION_NOTES.md`

## Verification
- `pnpm seed` passed.
- `pnpm lint` passed.
- `pnpm test` passed.
- `pnpm build` passed.
