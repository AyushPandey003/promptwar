import { desc, eq, sql } from "drizzle-orm";
import profileSeed from "@/data/seed/profile.json";
import optionsSeed from "@/data/seed/options.json";
import ingredientsSeed from "@/data/seed/ingredients.json";
import { getDb } from "./db";
import { buildInitialInput, type PlannerBootData } from "./planner";
import { appUsers, ingredientCatalog, mealPlans, plannerOptions, profiles, type IngredientCatalogItem, type MealPlan, type PlannerInput, type PlannerOption, type SavedMealPlan, type UserProfile } from "./schema";

let schemaReady: Promise<void> | null = null;

async function ensureSchema() {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const db = getDb();
    if (!db) return;

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

    await db.execute(sql`
      create table if not exists meal_plans (
        id uuid primary key default gen_random_uuid(),
        created_at timestamptz not null default now(),
        source text not null default 'gemini',
        day_type text not null,
        budget integer not null,
        estimated_cost integer not null,
        input jsonb not null,
        plan jsonb not null
      )
    `);
  })();

  return schemaReady;
}

function toSavedPlans(rows: Array<typeof mealPlans.$inferSelect>): SavedMealPlan[] {
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    input: row.input,
    plan: row.plan,
    source: row.source,
  }));
}

function fallbackProfile(): UserProfile {
  return {
    id: "seed-profile",
    ...(profileSeed as Omit<UserProfile, "id">),
  };
}

function fallbackOptions(): PlannerOption[] {
  return optionsSeed.map((option, index) => ({
    id: `seed-option-${index + 1}`,
    ...(option as Omit<PlannerOption, "id">),
  }));
}

function fallbackIngredients(): IngredientCatalogItem[] {
  return ingredientsSeed.map((item, index) => ({
    id: `seed-ingredient-${index + 1}`,
    ...(item as Omit<IngredientCatalogItem, "id">),
  }));
}

export async function getBootData(): Promise<PlannerBootData> {
  const db = getDb();

  if (!db) {
    const profile = fallbackProfile();
    const optionGroups = groupOptions(fallbackOptions());
    const bootData: PlannerBootData = {
      profile,
      optionGroups,
      ingredientCatalog: fallbackIngredients(),
      initialInput: {
        dayType: optionGroups[0]?.options.find((item) => item.isDefault)?.value ?? optionGroups[0]?.options[0]?.value ?? "Busy weekday",
        appetite: optionGroups[1]?.options.find((item) => item.isDefault)?.value ?? optionGroups[1]?.options[0]?.value ?? "Comfort food, but not too heavy",
        cookingSkill: optionGroups[2]?.options.find((item) => item.isDefault)?.value ?? optionGroups[2]?.options[0]?.value ?? "Learning cook",
        dietaryPreference: optionGroups[3]?.options.find((item) => item.isDefault)?.value ?? optionGroups[3]?.options[0]?.value ?? "Flexible vegetarian with egg option",
        budget: 320,
        timeMinutes: 75,
        pantry: profile.defaultPantry,
        meals: ["Breakfast", "Lunch", "Dinner"],
      },
      recentPlans: [],
    };
    bootData.initialInput = buildInitialInput(bootData);
    return bootData;
  }

  await ensureSchema();

  const [profileRow] = await db.select().from(profiles).limit(1);
  const optionRows = await db.select().from(plannerOptions).orderBy(plannerOptions.groupKey, plannerOptions.sortOrder);
  const ingredientRows = await db.select().from(ingredientCatalog).orderBy(ingredientCatalog.category, ingredientCatalog.name);
  const planRows = await db.select().from(mealPlans).orderBy(desc(mealPlans.createdAt)).limit(6);

  const profile = profileRow ?? fallbackProfile();
  const optionGroups = groupOptions(optionRows.length ? optionRows : fallbackOptions());
  const catalog = ingredientRows.length ? ingredientRows : fallbackIngredients();

  const bootData: PlannerBootData = {
    profile,
    optionGroups,
    ingredientCatalog: catalog,
    initialInput: {
      dayType: optionGroups[0]?.options[0]?.value ?? "",
      appetite: optionGroups[1]?.options[0]?.value ?? "",
      cookingSkill: optionGroups[2]?.options[0]?.value ?? "",
      dietaryPreference: optionGroups[3]?.options[0]?.value ?? "",
      budget: 320,
      timeMinutes: 75,
      pantry: profile.defaultPantry,
      meals: ["Breakfast", "Lunch", "Dinner"],
    },
    recentPlans: toSavedPlans(planRows),
  };

  bootData.initialInput = buildInitialInput(bootData);
  return bootData;
}

export async function savePlan(input: PlannerInput, plan: MealPlan, source: string) {
  const db = getDb();
  if (!db) return;

  await ensureSchema();
  await db.insert(mealPlans).values({
    source,
    dayType: input.dayType,
    budget: input.budget,
    estimatedCost: plan.budgetStatus.estimatedCost,
    input,
    plan,
  });
}

export async function getRecentPlans() {
  const db = getDb();
  if (!db) return [] as SavedMealPlan[];

  await ensureSchema();
  const rows = await db.select().from(mealPlans).orderBy(desc(mealPlans.createdAt)).limit(6);
  return toSavedPlans(rows);
}

export async function getProfileBySlug(slug: string) {
  const db = getDb();
  if (!db) return fallbackProfile();

  await ensureSchema();
  const [row] = await db.select().from(profiles).where(eq(profiles.slug, slug)).limit(1);
  return row ?? fallbackProfile();
}

export async function getIngredientCatalog() {
  const db = getDb();
  if (!db) return fallbackIngredients();

  await ensureSchema();
  const rows = await db.select().from(ingredientCatalog).orderBy(ingredientCatalog.category, ingredientCatalog.name);
  return rows.length ? rows : fallbackIngredients();
}

export async function getUserByUsername(username: string) {
  const db = getDb();
  if (!db) return null;

  await ensureSchema();
  const [user] = await db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1);
  return user ?? null;
}

function groupOptions(options: PlannerOption[]) {
  const labels = {
    dayType: { label: "Day mode", helper: "Shape the plan around how the day feels." },
    appetite: { label: "Appetite", helper: "Tell the planner how comforting or light the food should feel." },
    cookingSkill: { label: "Skill level", helper: "Keep the flow realistic for your current confidence level." },
    dietaryPreference: { label: "Diet", helper: "Respect the ingredients you actually want to cook with." },
  } as const;

  return (["dayType", "appetite", "cookingSkill", "dietaryPreference"] as const).map((key) => ({
    key,
    label: labels[key].label,
    helper: labels[key].helper,
    options: options.filter((option) => option.groupKey === key).sort((left, right) => left.sortOrder - right.sortOrder),
  }));
}
