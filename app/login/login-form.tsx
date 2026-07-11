'use client';

import { useActionState } from 'react';
import { loginAction } from '@/app/actions';

const initialState: { status: 'idle' | 'error'; message: string } = {
  status: 'idle',
  message: 'Use the seeded demo account to enter SpiceRoute.',
};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-[#c4491f]">SpiceRoute secure entry</p>
      <h1 className="mt-2 text-3xl font-bold text-stone-950">Login</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Protected pages use JWT cookies and server-side route guards.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="username" className="mb-2 block text-sm font-semibold text-stone-800">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="h-12 w-full rounded-2xl border border-stone-300 px-3 text-sm outline-none transition focus:border-[#c4491f]"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-stone-800">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-2xl border border-stone-300 px-3 text-sm outline-none transition focus:border-[#c4491f]"
          />
        </div>
      </div>

      <div aria-live="polite" className={`mt-4 rounded-2xl border p-3 text-sm ${state.status === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
        {state.message}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-12 w-full rounded-2xl bg-stone-950 px-4 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
