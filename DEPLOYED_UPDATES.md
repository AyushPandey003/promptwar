# Deployed Version Updates

## Summary
Built **SpiceRoute Planner**, a multi-page AI cooking micro-app inspired by the **Herb & Hearth** design system.

## What Was Added
- Secure **username/password login**
- **JWT-based protected routes**
- A protected **dashboard** for generating personalized cooking plans
- Separate **Meals** and **Groceries** pages
- **Neon Postgres** persistence with **Drizzle ORM**
- Seeded **planner**, **profile**, and **ingredient** data
- **Saved plan history**
- **Grocery estimation**
- **Ingredient substitutions**
- **Budget feasibility logic**

## Architecture and Code Quality Improvements
- Switched key flows to **Server Actions** for:
  - login
  - plan generation
- Added a **deterministic fallback** when AI is unavailable
- Refactored the app into modular layers for better maintainability:
  - `auth`
  - `planner`
  - `repository`
  - `schema`
  - shared UI components

## Outcome
The deployed version is more secure, more modular, easier to maintain, and better aligned with the challenge requirements for dynamic behavior, code quality, and reliability.
