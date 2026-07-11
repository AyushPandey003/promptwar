import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcf9f8] px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="rounded-[2.5rem] border border-[#c3c8bd] bg-[#f6f3f2] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#496640]">Herb & Hearth inspired</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#334f2b]">AI meal planning for a Jodhpur-to-Bengaluru food story.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#434840]">
            Generate breakfast, lunch, dinner, groceries, substitutions, and budget feasibility with a secure JWT-protected workflow.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
              <strong className="block text-[#334f2b]">Multi-page app</strong>
              <span className="mt-1 block text-sm text-[#434840]">Dashboard, meals, groceries</span>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
              <strong className="block text-[#334f2b]">GenAI powered</strong>
              <span className="mt-1 block text-sm text-[#434840]">Gemini builds the day plan</span>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-4">
              <strong className="block text-[#334f2b]">Server-first security</strong>
              <span className="mt-1 block text-sm text-[#434840]">JWT cookies + protected routes</span>
            </div>
          </div>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
