import { getInitialPlannerState } from '@/app/actions';
import { ProtectedHeader } from '@/app/components/protected-header';
import { PlannerForm } from '@/app/planner-form';
import { requireSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await requireSession();
  const { bootData, initialState } = await getInitialPlannerState();

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <ProtectedHeader
        title="SpiceRoute Dashboard"
        subtitle="Plan your day, generate a smarter cooking flow, and keep the experience rooted in Herb & Hearth's soft culinary design system."
        displayName={session.displayName}
      />
      <PlannerForm bootData={bootData} initialState={initialState} compactHeader />
    </div>
  );
}
