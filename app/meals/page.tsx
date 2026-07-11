import { ProtectedHeader } from '@/app/components/protected-header';
import { requireSession } from '@/lib/auth';
import { getRecentPlans } from '@/lib/repository';

export default async function MealsPage() {
  const session = await requireSession();
  const recentPlans = await getRecentPlans();
  const latest = recentPlans[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <ProtectedHeader
        title="Meal cards"
        subtitle="A dedicated view of the generated breakfast, lunch, and dinner cards with timing and rationale."
        displayName={session.displayName}
      />

      {!latest ? (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500 shadow-sm">
          Generate a plan from the dashboard first to unlock the meals page.
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {latest.plan.meals.map((meal) => (
            <article key={`${meal.slot}-${meal.name}`} className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#496640]">{meal.slot}</p>
              <h2 className="mt-2 text-2xl font-bold text-[#334f2b]">{meal.name}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{meal.why}</p>
              <div className="mt-4 rounded-2xl bg-[#f6f3f2] p-3 text-sm font-medium text-stone-700">{meal.memoryHook}</div>
              <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                <span>Prep time</span>
                <strong>{meal.prepMinutes} min</strong>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-700">
                {meal.tasks.map((task) => (
                  <li key={task} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#334f2b]" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
