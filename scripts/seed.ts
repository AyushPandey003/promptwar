import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";
import ingredients from "@/data/seed/ingredients.json";
import options from "@/data/seed/options.json";
import profile from "@/data/seed/profile.json";

async function main() {
  const db = getDb();

  if (!db) {
    throw new Error("DATABASE_URL is missing. Add it to your environment before seeding.");
  }

  await db.execute(sql`create extension if not exists pgcrypto`);

  await db.execute(sql`
    create table if not exists profiles (
      id uuid primary key default gen_random_uuid(),
      slug varchar(80) not null unique,
      display_name text not null,
      story text not null,
      hometown text not null,
      college_city text not null,
      current_city text not null,
      cooking_reason text not null,
      default_pantry text not null,
      signature_meals jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await db.execute(sql`
    create table if not exists planner_options (
      id uuid primary key default gen_random_uuid(),
      group_key varchar(40) not null,
      value varchar(80) not null,
      label text not null,
      description text not null,
      sort_order integer not null default 0,
      is_default boolean not null default false
    )
  `);

  await db.execute(sql`
    create table if not exists ingredient_catalog (
      id uuid primary key default gen_random_uuid(),
      name varchar(120) not null unique,
      aliases jsonb not null default '[]'::jsonb,
      category varchar(40) not null,
      unit varchar(40) not null,
      estimated_cost integer not null,
      substitutions jsonb not null default '[]'::jsonb
    )
  `);

  await db.execute(sql`
    create table if not exists app_users (
      id uuid primary key default gen_random_uuid(),
      username varchar(80) not null unique,
      password_hash text not null,
      display_name text not null,
      created_at timestamptz not null default now()
    )
  `);

  await db.execute(sql`truncate table planner_options restart identity cascade`);
  await db.execute(sql`truncate table ingredient_catalog restart identity cascade`);

  await db.execute(sql`
    insert into profiles (slug, display_name, story, hometown, college_city, current_city, cooking_reason, default_pantry, signature_meals)
    values (
      ${profile.slug},
      ${profile.displayName},
      ${profile.story},
      ${profile.hometown},
      ${profile.collegeCity},
      ${profile.currentCity},
      ${profile.cookingReason},
      ${profile.defaultPantry},
      ${JSON.stringify(profile.signatureMeals)}::jsonb
    )
    on conflict (slug) do update set
      display_name = excluded.display_name,
      story = excluded.story,
      hometown = excluded.hometown,
      college_city = excluded.college_city,
      current_city = excluded.current_city,
      cooking_reason = excluded.cooking_reason,
      default_pantry = excluded.default_pantry,
      signature_meals = excluded.signature_meals,
      updated_at = now()
  `);

  for (const option of options) {
    await db.execute(sql`
      insert into planner_options (group_key, value, label, description, sort_order, is_default)
      values (${option.groupKey}, ${option.value}, ${option.label}, ${option.description}, ${option.sortOrder}, ${option.isDefault})
    `);
  }

  for (const ingredient of ingredients) {
    await db.execute(sql`
      insert into ingredient_catalog (name, aliases, category, unit, estimated_cost, substitutions)
      values (
        ${ingredient.name},
        ${JSON.stringify(ingredient.aliases)}::jsonb,
        ${ingredient.category},
        ${ingredient.unit},
        ${ingredient.estimatedCost},
        ${JSON.stringify(ingredient.substitutions)}::jsonb
      )
      on conflict (name) do update set
        aliases = excluded.aliases,
        category = excluded.category,
        unit = excluded.unit,
        estimated_cost = excluded.estimated_cost,
        substitutions = excluded.substitutions
    `);
  }

  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? 'PromptWars@123';
  await db.execute(sql`
    insert into app_users (username, password_hash, display_name)
    values ('chefayush', ${hashPassword(demoPassword)}, 'Ayush')
    on conflict (username) do update set
      password_hash = excluded.password_hash,
      display_name = excluded.display_name
  `);

  console.log(`Seeded profile, ${options.length} planner options, ${ingredients.length} ingredient price references, and demo login chefayush.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
