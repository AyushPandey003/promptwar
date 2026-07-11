# Deployed Version Updates

## Describe the changes/updates made in the deployed version
Built **SpiceRoute Planner**, a multi-page AI cooking micro-app inspired by the Herb & Hearth Stitch theme. Added secure username/password login with JWT-based route protection, a protected dashboard for generating breakfast/lunch/dinner cooking plans, separate meals and groceries pages, Neon Postgres persistence with Drizzle ORM, seeded planner options/profile/ingredient pricing, saved plan history, substitutions, grocery estimation, and budget feasibility logic. The app uses Server Actions for login and plan generation, includes seeded fallback planning when AI is unavailable, and improves modularity through shared auth, repository, planner, and UI component layers.

## Mention the Gen AI services utilized in the submission, and where did you utilize it?
Used **Google Gemini API (gemini-2.5-flash)** in the server-side plan generation flow. Gemini is used to generate the structured daily cooking plan, including breakfast/lunch/dinner suggestions, grocery list, substitutions, budget reasoning, and cooking timeline based on user inputs, pantry, budget, and regional food preferences.
