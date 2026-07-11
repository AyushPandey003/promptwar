# SpiceRoute Planner Context

## Challenge
Build a simple AI micro-app that generates a personal cooking to-do list based on the user's day. Required output: breakfast/lunch/dinner plan, grocery list, substitutions, and budget feasibility logic.

## User Context
- Food lover from Jodhpur, Rajasthan.
- Studied in Bhopal.
- Currently living in Bengaluru and cooking more because PG rice meals became boring.
- Wants the submission optimized for PromptWars-style scoring: code quality, security, dynamic behavior, efficiency, testing, accessibility, and close alignment with the challenge.

## Implementation Notes
- Replaced the starter Next screen with a responsive cooking planner called SpiceRoute Planner.
- Added an interactive client workflow for day type, appetite, skill, dietary preference, budget, cook time, pantry, and selected meals.
- Added `/api/meal-plans` route handler for generation and history.
- Added Gemini generation through the REST API using `GEMINI_API_KEY` and optional `GEMINI_MODEL` environment variables.
- Added Drizzle ORM with Neon serverless Postgres using `DATABASE_URL`.
- Added a Drizzle schema for `meal_plans` with JSONB input/output storage and budget metadata.
- Added defensive validation/normalization for user input and model output.
- Added deterministic fallback planning so the app remains usable when Gemini or the database is unavailable locally.
- Added `.env.example` only; real secrets must stay in local/Vercel environment variables and must not be committed.

## Files Changed
- `app/page.tsx`: full interactive planner UI.
- `app/layout.tsx`: app metadata and clean root body.
- `app/globals.css`: global theme and focus styles.
- `app/api/meal-plans/route.ts`: Gemini generation, Drizzle persistence, recent plan history.
- `lib/planner.ts`: shared planner types, input validation, model-output normalization, fallback generator.
- `lib/db.ts`: Neon/Drizzle database client helper.
- `lib/schema.ts`: Drizzle `meal_plans` table schema.
- `.env.example`: required environment variable names without secrets.
- `package.json` and `pnpm-lock.yaml`: added `drizzle-orm` and `@neondatabase/serverless`.

## Security Notes
- Database URL and Gemini API key are read only on the server.
- No secret is exposed through `NEXT_PUBLIC_*` variables.
- Client calls only the internal route handler.
- User text fields are length-limited and normalized before being sent to Gemini or stored.
- Gemini output is parsed as JSON and normalized before rendering.
## Verification Notes
- Removed Next Google font loading to avoid build-time network dependency; the app now uses system fonts.
- pnpm lint passed.
- pnpm build passed after rerunning outside the sandbox because the TypeScript worker hit a Windows sandbox spawn permission issue.
