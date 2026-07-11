import { z } from "zod";
import type { IngredientCatalogItem, MealPlan, MealSlot, PlannerInput, PlannerOption, SavedMealPlan, SignatureMeal, UserProfile } from "./schema";

export type PlannerBootData = {
  profile: UserProfile;
  optionGroups: Array<{
    key: "dayType" | "appetite" | "cookingSkill" | "dietaryPreference";
    label: string;
    helper: string;
    options: PlannerOption[];
  }>;
  ingredientCatalog: IngredientCatalogItem[];
  initialInput: PlannerInput;
  recentPlans: SavedMealPlan[];
};

export type PlannerActionState = {
  status: "idle" | "success" | "error";
  message: string;
  source: string;
  input: PlannerInput;
  plan: MealPlan | null;
  recentPlans: SavedMealPlan[];
};

export const emptyActionState = (input: PlannerInput, recentPlans: SavedMealPlan[]): PlannerActionState => ({
  status: "idle",
  message: "Tell SpiceRoute about your day and generate a cooking plan.",
  source: "seeded",
  input,
  plan: recentPlans[0]?.plan ?? null,
  recentPlans,
});

const mealSlots: MealSlot[] = ["Breakfast", "Lunch", "Dinner"];

const plannerSchema = z.object({
  dayType: z.string().trim().min(2).max(80),
  appetite: z.string().trim().min(2).max(120),
  cookingSkill: z.string().trim().min(2).max(80),
  budget: z.coerce.number().int().min(80).max(1500),
  timeMinutes: z.coerce.number().int().min(20).max(240),
  pantry: z.string().trim().min(3).max(600),
  meals: z.array(z.enum(mealSlots)).min(1).max(3),
  dietaryPreference: z.string().trim().min(2).max(120),
});

function cleanText(value: unknown, fallback: string, maxLength = 240) {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const candidate = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(candidate)) return fallback;
  return Math.min(max, Math.max(min, Math.round(candidate)));
}

export function parsePlannerForm(formData: FormData): PlannerInput {
  const meals = formData
    .getAll("meals")
    .map((entry) => String(entry))
    .filter((entry): entry is MealSlot => mealSlots.includes(entry as MealSlot));

  return plannerSchema.parse({
    dayType: formData.get("dayType"),
    appetite: formData.get("appetite"),
    cookingSkill: formData.get("cookingSkill"),
    budget: formData.get("budget"),
    timeMinutes: formData.get("timeMinutes"),
    pantry: formData.get("pantry"),
    meals,
    dietaryPreference: formData.get("dietaryPreference"),
  });
}

export function buildInitialInput(bootData: PlannerBootData): PlannerInput {
  const pickDefault = (key: PlannerBootData["optionGroups"][number]["key"]) => {
    const group = bootData.optionGroups.find((optionGroup) => optionGroup.key === key);
    return group?.options.find((option) => option.isDefault)?.value ?? group?.options[0]?.value ?? "";
  };

  return {
    dayType: pickDefault("dayType"),
    appetite: pickDefault("appetite"),
    cookingSkill: pickDefault("cookingSkill"),
    dietaryPreference: pickDefault("dietaryPreference"),
    budget: 320,
    timeMinutes: 75,
    pantry: bootData.profile.defaultPantry,
    meals: ["Breakfast", "Lunch", "Dinner"],
  };
}

export function normalizeMealPlan(payload: unknown, input: PlannerInput): MealPlan {
  if (!payload || typeof payload !== "object") {
    throw new Error("Generated plan was not a valid object.");
  }

  const data = payload as Partial<MealPlan>;
  const requestedSlots = new Set(input.meals);
  const meals = Array.isArray(data.meals) ? data.meals : [];
  const groceries = Array.isArray(data.groceries) ? data.groceries : [];
  const substitutions = Array.isArray(data.substitutions) ? data.substitutions : [];

  const normalizedMeals = meals
    .map((meal) => {
      const candidate = meal as MealPlan["meals"][number];
      const slot = mealSlots.includes(candidate?.slot) ? candidate.slot : input.meals[0];
      return {
        slot,
        name: cleanText(candidate?.name, `${slot} idea`, 120),
        why: cleanText(candidate?.why, "Built around your day, budget, and pantry.", 260),
        prepMinutes: cleanNumber(candidate?.prepMinutes, Math.max(15, Math.round(input.timeMinutes / input.meals.length)), 5, 180),
        tasks: Array.isArray(candidate?.tasks)
          ? candidate.tasks.slice(0, 6).map((task) => cleanText(task, "Cook this step.", 180))
          : ["Prep ingredients.", "Cook the meal.", "Plate or pack it."],
        ingredients: Array.isArray(candidate?.ingredients)
          ? candidate.ingredients.slice(0, 8).map((item) => cleanText(item, "ingredient", 60))
          : ["pantry staples"],
        memoryHook: cleanText(candidate?.memoryHook, "Connects your Jodhpur, Bhopal, and Bengaluru food story.", 180),
      };
    })
    .filter((meal) => requestedSlots.has(meal.slot))
    .slice(0, input.meals.length);

  if (!normalizedMeals.length) {
    throw new Error("The generated plan did not include any requested meals.");
  }

  const normalizedGroceries = groceries.slice(0, 16).map((item) => {
    const grocery = item as MealPlan["groceries"][number];
    return {
      item: cleanText(grocery?.item, "ingredient", 80),
      quantity: cleanText(grocery?.quantity, "as needed", 60),
      estimatedCost: cleanNumber(grocery?.estimatedCost, 20, 0, 1000),
      category: cleanText(grocery?.category, "grocery", 60),
      optional: Boolean(grocery?.optional),
    };
  });

  const estimate = normalizedGroceries.reduce((sum, item) => sum + item.estimatedCost, 0);
  const status = data.budgetStatus?.status === "over" || data.budgetStatus?.status === "tight" || data.budgetStatus?.status === "feasible"
    ? data.budgetStatus.status
    : estimate > input.budget
      ? "over"
      : estimate > input.budget * 0.85
        ? "tight"
        : "feasible";

  return {
    title: cleanText(data.title, "SpiceRoute cooking to-do list", 100),
    summary: cleanText(data.summary, "A practical plan shaped around your day, pantry, and budget.", 400),
    budgetStatus: {
      status,
      estimatedCost: cleanNumber(data.budgetStatus?.estimatedCost, estimate, 0, 3000),
      budget: input.budget,
      reasoning: cleanText(data.budgetStatus?.reasoning, "Estimated against your pantry and stated budget.", 260),
    },
    meals: normalizedMeals,
    groceries: normalizedGroceries,
    substitutions: substitutions.slice(0, 8).map((item) => {
      const substitution = item as MealPlan["substitutions"][number];
      return {
        ifMissing: cleanText(substitution?.ifMissing, "ingredient", 80),
        useInstead: cleanText(substitution?.useInstead, "pantry alternative", 100),
        impact: cleanText(substitution?.impact, "Keeps the plan usable with a minor taste or cost tradeoff.", 180),
      };
    }),
    timeline: Array.isArray(data.timeline)
      ? data.timeline.slice(0, 8).map((item) => cleanText(item, "Cook one step.", 180))
      : ["Prep shared ingredients first.", "Cook the most reusable base next.", "Finish the quickest meal last."],
  };
}

export function pantryTokens(pantry: string) {
  return new Set(
    pantry
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function buildPrompt(input: PlannerInput, profile: UserProfile, catalog: IngredientCatalogItem[]) {
  const catalogSnapshot = catalog
    .slice(0, 20)
    .map((item) => `${item.name} (${item.category}, ~₹${item.estimatedCost}/${item.unit}) substitutions: ${item.substitutions.join(" / ") || "none"}`)
    .join("\n");

  return `You are building a production-quality cooking-planner answer for a food lover.

User story:
- Hometown: ${profile.hometown}
- College city: ${profile.collegeCity}
- Current city: ${profile.currentCity}
- Why cooking matters: ${profile.cookingReason}
- Food story: ${profile.story}

Planner input:
- Day type: ${input.dayType}
- Appetite: ${input.appetite}
- Cooking skill: ${input.cookingSkill}
- Budget: INR ${input.budget}
- Total cooking time: ${input.timeMinutes} minutes
- Pantry: ${input.pantry}
- Meals needed: ${input.meals.join(", ")}
- Dietary preference: ${input.dietaryPreference}

Ingredient price guide:
${catalogSnapshot}

Scoring priorities:
1. Code-quality-style precision in the plan structure and reasoning
2. Security/safety: no unsafe food handling, no risky storage advice, no misleading substitutions
3. Dynamic, practical cooking flow for a real day in a small kitchen
4. Strong alignment with the user's food story and the exact prompt requirements
5. Efficient reuse of prep, ingredients, and budget
6. Clear testing mindset: include edge-case-safe substitutions and budget logic
7. Accessibility: use plain, readable language and concise steps

Return only valid JSON with this exact shape:
{
  "title": "short plan name",
  "summary": "2 sentence overview",
  "budgetStatus": {
    "status": "feasible | tight | over",
    "estimatedCost": 0,
    "budget": ${input.budget},
    "reasoning": "budget logic in one sentence"
  },
  "meals": [
    {
      "slot": "Breakfast | Lunch | Dinner",
      "name": "meal name",
      "why": "why it fits the day",
      "prepMinutes": 25,
      "tasks": ["actionable cooking task"],
      "ingredients": ["ingredient"],
      "memoryHook": "specific Jodhpur, Bhopal, or Bengaluru connection"
    }
  ],
  "groceries": [
    { "item": "name", "quantity": "amount", "estimatedCost": 20, "category": "staple | vegetable | protein | dairy | flavour", "optional": false }
  ],
  "substitutions": [
    { "ifMissing": "ingredient", "useInstead": "alternative", "impact": "cost/time/taste impact" }
  ],
  "timeline": ["time-saving sequence step"]
}

Rules:
- Include exactly the requested meal slots and no extra meal slots.
- Respect the total cooking time across the day and keep each meal beginner-friendly.
- Reuse pantry items before adding groceries.
- Give at least 4 substitutions.
- Make budgetStatus compare estimatedCost against the user's budget.
- Keep the grocery list realistic for Bengaluru pricing.
- No markdown, no comments, no extra text.`;
}

export function extractGeminiText(payload: unknown) {
  const data = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}

export function parseModelJson(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(trimmed) as unknown;
}

function estimateGroceriesForSignatureMeal(
  meal: SignatureMeal,
  pantry: Set<string>,
  catalogMap: Map<string, IngredientCatalogItem>,
) {
  return meal.ingredients
    .map((ingredient) => {
      const lookup = ingredient.toLowerCase();
      const catalogItem = catalogMap.get(lookup);
      const aliases = catalogItem?.aliases ?? [];
      const pantryHasItem = pantry.has(lookup) || aliases.some((alias) => pantry.has(alias.toLowerCase()));
      if (pantryHasItem) return null;

      return {
        item: catalogItem?.name ?? ingredient,
        quantity: catalogItem ? `1 ${catalogItem.unit}` : "1 portion",
        estimatedCost: catalogItem?.estimatedCost ?? 25,
        category: catalogItem?.category ?? "grocery",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function deterministicPlan(input: PlannerInput, profile: UserProfile, catalog: IngredientCatalogItem[]): MealPlan {
  const pantry = pantryTokens(input.pantry);
  const catalogMap = new Map(
    catalog.flatMap((item) => [[item.name.toLowerCase(), item] as const, ...item.aliases.map((alias) => [alias.toLowerCase(), item] as const)]),
  );

  const selectedMeals = input.meals.map((slot) => {
    const template = profile.signatureMeals[slot];
    return {
      slot,
      name: template.name,
      why: `${template.why} Tailored for a ${input.dayType.toLowerCase()} with ${input.appetite.toLowerCase()}.`,
      prepMinutes: cleanNumber(Math.max(12, Math.round(input.timeMinutes / input.meals.length)), 25, 10, 90),
      tasks: template.tasks,
      ingredients: template.ingredients,
      memoryHook: template.memoryHook,
    };
  });

  const groceryMap = new Map<string, MealPlan["groceries"][number]>();
  selectedMeals.forEach((meal) => {
    const signature = profile.signatureMeals[meal.slot];
    estimateGroceriesForSignatureMeal(signature, pantry, catalogMap).forEach((grocery) => {
      const key = grocery.item.toLowerCase();
      if (!groceryMap.has(key)) groceryMap.set(key, grocery);
    });
  });

  const groceries = [...groceryMap.values()].slice(0, 14);
  const estimatedCost = groceries.reduce((sum, item) => sum + item.estimatedCost, 0);
  const substitutions = groceries.slice(0, 6).map((grocery) => {
    const source = catalogMap.get(grocery.item.toLowerCase());
    return {
      ifMissing: grocery.item,
      useInstead: source?.substitutions[0] ?? "Use the closest pantry alternative",
      impact: source?.substitutions[1] ?? "Keeps the meal workable with a small taste or texture change.",
    };
  });

  return {
    title: `${profile.hometown} to ${profile.currentCity} comfort plan`,
    summary: `A ${input.dayType.toLowerCase()} cooking list that blends ${profile.hometown}, ${profile.collegeCity}, and ${profile.currentCity} flavours while respecting your budget and pantry.`,
    budgetStatus: {
      status: estimatedCost > input.budget ? "over" : estimatedCost > input.budget * 0.85 ? "tight" : "feasible",
      estimatedCost,
      budget: input.budget,
      reasoning: "Estimated fresh spend is based on missing ingredients only, while assuming your pantry staples are already on hand.",
    },
    meals: selectedMeals,
    groceries,
    substitutions,
    timeline: [
      "Wash, chop, and sort vegetables once at the start of the day.",
      "Cook the longest base first so later meals reuse prep and masala.",
      "Keep one quick garnish or chutney ready to lift all three meals.",
      "Batch-soak or prep your protein early if your chosen meals need it.",
    ],
  };
}
