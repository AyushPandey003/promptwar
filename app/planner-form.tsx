'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { generatePlanAction } from '@/app/actions';
import type { PlannerActionState, PlannerBootData } from '@/lib/planner';
import type { MealPlan, MealSlot, PlannerInput, SavedMealPlan } from '@/lib/schema';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function budgetTone(status: MealPlan['budgetStatus']['status']) {
  if (status === 'feasible') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (status === 'tight') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-rose-200 bg-rose-50 text-rose-950';
}

function SectionLabel({ title, helper }: { title: string; helper?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b55428]">{title}</p>
      {helper ? <p className="mt-1 text-sm text-stone-500">{helper}</p> : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-2xl bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
    >
      {pending ? 'Generating with Gemini...' : 'Generate cooking to-do list'}
    </button>
  );
}

function MealSelector({ selectedMeals, onToggle }: { selectedMeals: MealSlot[]; onToggle: (meal: MealSlot) => void }) {
  const mealOptions: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner'];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-stone-900">Meals needed</legend>
      <div className="grid grid-cols-3 gap-2">
        {mealOptions.map((meal) => {
          const selected = selectedMeals.includes(meal);
          return (
            <label
              key={meal}
              className={`flex cursor-pointer items-center justify-center rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? 'border-[#c4491f] bg-[#c4491f] text-white'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
              }`}
            >
              <input
                type="checkbox"
                name="meals"
                value={meal}
                checked={selected}
                onChange={() => onToggle(meal)}
                className="sr-only"
              />
              {meal}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ReadOnlyPlan({ plan, source }: { plan: MealPlan; source: string }) {
  const groceryTotal = useMemo(() => plan.groceries.reduce((sum, item) => sum + item.estimatedCost, 0), [plan.groceries]);

  return (
    <>
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b55428]">Current plan</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-950 sm:text-3xl">{plan.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{plan.summary}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${budgetTone(plan.budgetStatus.status)}`}>
              {plan.budgetStatus.status.toUpperCase()} · {formatCurrency(plan.budgetStatus.estimatedCost)}
            </span>
            <span className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
              Source: <strong className="capitalize text-stone-900">{source}</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {plan.meals.map((meal) => (
          <article key={`${meal.slot}-${meal.name}`} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b55428]">{meal.slot}</p>
                <h3 className="mt-2 text-lg font-bold leading-snug text-stone-950">{meal.name}</h3>
              </div>
              <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">{meal.prepMinutes} min</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">{meal.why}</p>
            <div className="mt-4 rounded-2xl bg-[#fff7ef] p-3 text-sm font-medium text-stone-700">{meal.memoryHook}</div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-700">
              {meal.tasks.map((task) => (
                <li key={task} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4491f]" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              {meal.ingredients.map((ingredient) => (
                <span key={ingredient} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {ingredient}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-stone-950">Grocery list</h3>
              <p className="mt-1 text-sm text-stone-500">Estimated fresh spend: {formatCurrency(groceryTotal)}</p>
            </div>
            <span className="rounded-full bg-[#4f8a3d] px-3 py-1 text-xs font-bold text-white">{plan.groceries.length} items</span>
          </div>
          <div className="mt-4 divide-y divide-stone-200">
            {plan.groceries.map((grocery) => (
              <div key={`${grocery.item}-${grocery.quantity}`} className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-stone-950">
                    {grocery.item} {grocery.optional ? <span className="text-stone-400">optional</span> : null}
                  </p>
                  <p className="text-stone-500">{grocery.quantity} · {grocery.category}</p>
                </div>
                <strong>{formatCurrency(grocery.estimatedCost)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className={`rounded-3xl border p-4 shadow-sm ${budgetTone(plan.budgetStatus.status)}`}>
            <h3 className="text-lg font-bold">Budget feasibility</h3>
            <p className="mt-2 text-sm leading-6">{plan.budgetStatus.reasoning}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl border border-current/15 bg-white/70 p-3">
                <span className="block text-xs opacity-70">Budget</span>
                <strong>{formatCurrency(plan.budgetStatus.budget)}</strong>
              </div>
              <div className="rounded-2xl border border-current/15 bg-white/70 p-3">
                <span className="block text-xs opacity-70">Estimated spend</span>
                <strong>{formatCurrency(plan.budgetStatus.estimatedCost)}</strong>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-bold text-stone-950">Substitutions</h3>
            <div className="mt-3 divide-y divide-stone-200">
              {plan.substitutions.map((substitution) => (
                <div key={`${substitution.ifMissing}-${substitution.useInstead}`} className="py-3 text-sm">
                  <p className="font-semibold text-stone-950">If missing {substitution.ifMissing}, use {substitution.useInstead}.</p>
                  <p className="mt-1 leading-6 text-stone-600">{substitution.impact}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-bold text-stone-950">Timeline</h3>
            <ol className="mt-3 space-y-3 text-sm leading-6 text-stone-700">
              {plan.timeline.map((step, index) => (
                <li key={step} className="grid grid-cols-[32px_1fr] gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3c76a] text-xs font-bold text-stone-950">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
    </>
  );
}

export function PlannerForm({
  bootData,
  initialState,
  compactHeader = false,
}: {
  bootData: PlannerBootData;
  initialState: PlannerActionState;
  compactHeader?: boolean;
}) {
  const [state, formAction] = useActionState(generatePlanAction, initialState);
  const [draft, setDraft] = useState<PlannerInput>(initialState.input);
  const [previewPlan, setPreviewPlan] = useState<SavedMealPlan | null>(null);

  const profile = bootData.profile;

  const selectedCatalog = useMemo(() => bootData.ingredientCatalog.slice(0, 8), [bootData.ingredientCatalog]);

  function updateField<Key extends keyof PlannerInput>(key: Key, value: PlannerInput[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleMeal(meal: MealSlot) {
    setDraft((current) => {
      const exists = current.meals.includes(meal);
      const nextMeals = exists ? current.meals.filter((item) => item !== meal) : [...current.meals, meal];
      return { ...current, meals: nextMeals.length ? nextMeals : [meal] };
    });
  }

  function loadSavedPlan(saved: SavedMealPlan) {
    setDraft(saved.input);
    setPreviewPlan(saved);
  }

  const activePlan = previewPlan?.plan ?? state.plan;
  const activeSource = previewPlan?.source ?? state.source;
  const activeHistory = state.recentPlans;

  async function submitAction(formData: FormData) {
    setPreviewPlan(null);
    await formAction(formData);
  }

  return (
    <main className={compactHeader ? 'text-stone-950' : 'min-h-screen bg-[#fbfaf7] text-stone-950'}>
      <div className={compactHeader ? 'flex flex-col gap-6' : 'mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8'}>
        {compactHeader ? null : (
          <header className="rounded-[2rem] border border-stone-200 bg-white px-5 py-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-sm font-semibold text-[#c4491f]">SpiceRoute Planner</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">
                  Build a personal cooking to-do list that finally beats boring PG food.
                </h1>
                <p className="mt-4 text-base leading-7 text-stone-600">
                  Inspired by {profile.hometown}, shaped by {profile.collegeCity}, and made practical for life in {profile.currentCity}. The app generates breakfast, lunch, dinner, groceries, substitutions, and budget logic with Gemini plus a seeded fallback.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <span className="block text-xs uppercase tracking-[0.12em] text-stone-500">Budget</span>
                  <strong className="mt-1 block text-lg">{formatCurrency(draft.budget)}</strong>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <span className="block text-xs uppercase tracking-[0.12em] text-stone-500">Cook time</span>
                  <strong className="mt-1 block text-lg">{draft.timeMinutes} min</strong>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <span className="block text-xs uppercase tracking-[0.12em] text-stone-500">Source</span>
                  <strong className="mt-1 block text-lg capitalize">{activeSource}</strong>
                </div>
              </div>
            </div>
          </header>
        )}

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_330px]">
          <form action={submitAction} className="space-y-5 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-stone-950">Plan inputs</h2>
              <p className="mt-1 text-sm leading-6 text-stone-500">Tell the server action what kind of day you are cooking for.</p>
            </div>

            {bootData.optionGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <SectionLabel title={group.label} helper={group.helper} />
                {group.key === 'appetite' ? (
                  <div className="space-y-2">
                    <input
                      name={group.key}
                      list="appetite-options"
                      value={draft[group.key]}
                      onChange={(event) => updateField(group.key, event.target.value)}
                      className="h-12 w-full rounded-2xl border border-stone-300 px-3 text-sm outline-none transition focus:border-[#c4491f]"
                    />
                    <datalist id="appetite-options">
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <select
                    name={group.key}
                    value={draft[group.key]}
                    onChange={(event) => updateField(group.key, event.target.value)}
                    className="h-12 w-full rounded-2xl border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-[#c4491f]"
                  >
                    {group.options.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <SectionLabel title="Budget (₹)" helper="Daily fresh spend target." />
                <input
                  type="number"
                  name="budget"
                  min={80}
                  max={1500}
                  value={draft.budget}
                  onChange={(event) => updateField('budget', Number(event.target.value))}
                  className="h-12 w-full rounded-2xl border border-stone-300 px-3 text-sm outline-none transition focus:border-[#c4491f]"
                />
              </div>
              <div className="space-y-2">
                <SectionLabel title="Cook time" helper="Total minutes for the day." />
                <input
                  type="number"
                  name="timeMinutes"
                  min={20}
                  max={240}
                  value={draft.timeMinutes}
                  onChange={(event) => updateField('timeMinutes', Number(event.target.value))}
                  className="h-12 w-full rounded-2xl border border-stone-300 px-3 text-sm outline-none transition focus:border-[#c4491f]"
                />
              </div>
            </div>

            <MealSelector selectedMeals={draft.meals} onToggle={toggleMeal} />

            <div className="space-y-2">
              <SectionLabel title="Pantry" helper="Mention what is already in the PG or kitchen so the planner buys less." />
              <textarea
                name="pantry"
                value={draft.pantry}
                onChange={(event) => updateField('pantry', event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-stone-300 px-3 py-3 text-sm outline-none transition focus:border-[#c4491f]"
              />
            </div>

            <div aria-live="polite" className={`rounded-2xl border p-3 text-sm ${state.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
              {state.message}
            </div>

            <SubmitButton />
          </form>

          <section className="space-y-5">
            {activePlan ? (
              <ReadOnlyPlan plan={activePlan} source={activeSource} />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500 shadow-sm">
                Generate your first plan to see meals, groceries, substitutions, and budget feasibility.
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-stone-950">Food story</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{profile.story}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-stone-900">Roots</dt>
                  <dd className="text-stone-600">{profile.hometown} → {profile.collegeCity} → {profile.currentCity}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-stone-900">Why this app fits</dt>
                  <dd className="text-stone-600">{profile.cookingReason}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-stone-950">Seeded market prices</h2>
              <div className="mt-3 space-y-2 text-sm">
                {selectedCatalog.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-stone-900">{item.name}</strong>
                      <span className="text-stone-500">₹{item.estimatedCost}</span>
                    </div>
                    <p className="mt-1 text-stone-500">{item.category} · {item.unit}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-stone-950">Saved plans</h2>
              {activeHistory.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-stone-500">Run `pnpm seed` and generate a plan to start building meal history in Neon.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {activeHistory.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => loadSavedPlan(saved)}
                      className="w-full rounded-2xl border border-stone-200 bg-white p-3 text-left text-sm transition hover:border-[#c4491f] hover:bg-[#fff8ef]"
                    >
                      <span className="block font-semibold text-stone-950">{saved.plan.title}</span>
                      <span className="mt-1 block text-xs text-stone-500">
                        {new Date(saved.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
