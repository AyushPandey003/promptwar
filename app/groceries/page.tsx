import { ProtectedHeader } from '@/app/components/protected-header';
import { requireSession } from '@/lib/auth';
import { getRecentPlans } from '@/lib/repository';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function GroceriesPage() {
  const session = await requireSession();
  const recentPlans = await getRecentPlans();
  const latest = recentPlans[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <ProtectedHeader
        title="Groceries and budget"
        subtitle="A focused grocery list view with spend estimates, categories, and substitution guidance."
        displayName={session.displayName}
      />

      {!latest ? (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center text-stone-500 shadow-sm">
          Generate a plan from the dashboard first to unlock groceries and budget tracking.
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#334f2b]">Latest grocery list</h2>
                <p className="mt-1 text-sm text-stone-500">Generated from: {latest.plan.title}</p>
              </div>
              <span className="rounded-full bg-[#cae9bc] px-3 py-1 text-xs font-bold text-[#334f2b]">{latest.plan.groceries.length} items</span>
            </div>
            <div className="mt-5 divide-y divide-stone-200">
              {latest.plan.groceries.map((grocery) => (
                <div key={`${grocery.item}-${grocery.quantity}`} className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-stone-950">{grocery.item}</p>
                    <p className="text-stone-500">{grocery.quantity} · {grocery.category}</p>
                  </div>
                  <strong>{formatCurrency(grocery.estimatedCost)}</strong>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-[#c3c8bd] bg-[#f6f3f2] p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#334f2b]">Budget feasibility</h3>
              <p className="mt-2 text-sm leading-6 text-stone-700">{latest.plan.budgetStatus.reasoning}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
                  <span className="block text-xs text-stone-500">Budget</span>
                  <strong>{formatCurrency(latest.plan.budgetStatus.budget)}</strong>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-3">
                  <span className="block text-xs text-stone-500">Estimate</span>
                  <strong>{formatCurrency(latest.plan.budgetStatus.estimatedCost)}</strong>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-[#334f2b]">Substitution notes</h3>
              <div className="mt-3 space-y-3 text-sm">
                {latest.plan.substitutions.map((substitution) => (
                  <div key={`${substitution.ifMissing}-${substitution.useInstead}`} className="rounded-2xl bg-stone-50 p-3">
                    <p className="font-semibold text-stone-900">{substitution.ifMissing} → {substitution.useInstead}</p>
                    <p className="mt-1 text-stone-600">{substitution.impact}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
