import { describe, expect, it } from 'vitest';
import profileSeed from '../data/seed/profile.json';
import ingredientsSeed from '../data/seed/ingredients.json';
import { deterministicPlan, normalizeMealPlan, pantryTokens } from './planner';
import type { PlannerInput, UserProfile } from './schema';

const input: PlannerInput = {
  dayType: 'Busy weekday',
  appetite: 'Comfort food, but not too heavy',
  cookingSkill: 'Learning cook',
  budget: 320,
  timeMinutes: 75,
  pantry: 'rice, atta, onion, tomato, curd, eggs, masalas',
  meals: ['Breakfast', 'Lunch', 'Dinner'],
  dietaryPreference: 'Flexible vegetarian with egg option',
};

const profile: UserProfile = {
  id: 'test-profile',
  ...profileSeed,
};

describe('planner helpers', () => {
  it('creates a normalized set of pantry tokens', () => {
    expect(pantryTokens(' rice, atta, onion ')).toEqual(new Set(['rice', 'atta', 'onion']));
  });

  it('normalizes a generated plan while preserving requested slots', () => {
    const normalized = normalizeMealPlan(
      {
        title: 'Test plan',
        summary: 'Summary',
        budgetStatus: { status: 'feasible', estimatedCost: 210, budget: 320, reasoning: 'Works' },
        meals: [
          { slot: 'Breakfast', name: 'Meal 1', why: 'Good', prepMinutes: 20, tasks: ['Task'], ingredients: ['Item'], memoryHook: 'Hook' },
          { slot: 'Lunch', name: 'Meal 2', why: 'Good', prepMinutes: 20, tasks: ['Task'], ingredients: ['Item'], memoryHook: 'Hook' },
          { slot: 'Dinner', name: 'Meal 3', why: 'Good', prepMinutes: 20, tasks: ['Task'], ingredients: ['Item'], memoryHook: 'Hook' },
        ],
        groceries: [{ item: 'Paneer', quantity: '200 g', estimatedCost: 90, category: 'protein' }],
        substitutions: [{ ifMissing: 'Paneer', useInstead: 'Eggs', impact: 'Cheaper' }],
        timeline: ['Prep first'],
      },
      input,
    );

    expect(normalized.meals.map((meal) => meal.slot)).toEqual(['Breakfast', 'Lunch', 'Dinner']);
    expect(normalized.groceries[0]?.estimatedCost).toBe(90);
  });

  it('builds a deterministic fallback plan without exceeding structure limits', () => {
    const plan = deterministicPlan(input, profile, ingredientsSeed.map((item, index) => ({ id: `ingredient-${index}`, ...item })));

    expect(plan.meals).toHaveLength(3);
    expect(plan.substitutions.length).toBeGreaterThan(0);
    expect(plan.groceries.length).toBeLessThanOrEqual(14);
    expect(plan.timeline.length).toBeGreaterThan(0);
  });
});
