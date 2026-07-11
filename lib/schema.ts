import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export type MealSlot = "Breakfast" | "Lunch" | "Dinner";

export type SignatureMeal = {
  slot: MealSlot;
  name: string;
  why: string;
  tasks: string[];
  ingredients: string[];
  memoryHook: string;
};

export type UserProfile = {
  id: string;
  slug: string;
  displayName: string;
  story: string;
  hometown: string;
  collegeCity: string;
  currentCity: string;
  cookingReason: string;
  defaultPantry: string;
  signatureMeals: Record<MealSlot, SignatureMeal>;
};

export type PlannerOptionGroupKey = "dayType" | "appetite" | "cookingSkill" | "dietaryPreference";

export type PlannerOption = {
  id: string;
  groupKey: PlannerOptionGroupKey;
  value: string;
  label: string;
  description: string;
  sortOrder: number;
  isDefault: boolean;
};

export type IngredientCatalogItem = {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  unit: string;
  estimatedCost: number;
  substitutions: string[];
};

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  displayName: text("display_name").notNull(),
  story: text("story").notNull(),
  hometown: text("hometown").notNull(),
  collegeCity: text("college_city").notNull(),
  currentCity: text("current_city").notNull(),
  cookingReason: text("cooking_reason").notNull(),
  defaultPantry: text("default_pantry").notNull(),
  signatureMeals: jsonb("signature_meals").$type<Record<MealSlot, SignatureMeal>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plannerOptions = pgTable("planner_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupKey: varchar("group_key", { length: 40 }).$type<PlannerOptionGroupKey>().notNull(),
  value: varchar("value", { length: 80 }).notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
});

export const ingredientCatalog = pgTable("ingredient_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
  category: varchar("category", { length: 40 }).notNull(),
  unit: varchar("unit", { length: 40 }).notNull(),
  estimatedCost: integer("estimated_cost").notNull(),
  substitutions: jsonb("substitutions").$type<string[]>().notNull().default([]),
});

export type PlannerInput = {
  dayType: string;
  appetite: string;
  cookingSkill: string;
  budget: number;
  timeMinutes: number;
  pantry: string;
  meals: MealSlot[];
  dietaryPreference: string;
};

export type MealPlan = {
  title: string;
  summary: string;
  budgetStatus: {
    status: "feasible" | "tight" | "over";
    estimatedCost: number;
    budget: number;
    reasoning: string;
  };
  meals: Array<{
    slot: MealSlot;
    name: string;
    why: string;
    prepMinutes: number;
    tasks: string[];
    ingredients: string[];
    memoryHook: string;
  }>;
  groceries: Array<{
    item: string;
    quantity: string;
    estimatedCost: number;
    category: string;
    optional?: boolean;
  }>;
  substitutions: Array<{
    ifMissing: string;
    useInstead: string;
    impact: string;
  }>;
  timeline: string[];
};

export type SavedMealPlan = {
  id: string;
  createdAt: string;
  input: PlannerInput;
  plan: MealPlan;
  source: string;
};

export const appUsers = pgTable("app_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  source: text("source").notNull().default("gemini"),
  dayType: text("day_type").notNull(),
  budget: integer("budget").notNull(),
  estimatedCost: integer("estimated_cost").notNull(),
  input: jsonb("input").$type<PlannerInput>().notNull(),
  plan: jsonb("plan").$type<MealPlan>().notNull(),
});
