import Link from 'next/link';
import { logoutAction } from '@/app/actions';

type ProtectedHeaderProps = {
  title: string;
  subtitle: string;
  displayName: string;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/meals', label: 'Meals' },
  { href: '/groceries', label: 'Groceries' },
];

export function ProtectedHeader({ title, subtitle, displayName }: ProtectedHeaderProps) {
  return (
    <header className="rounded-[2rem] border border-stone-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#496640]">Welcome, {displayName}</p>
          <h1 className="mt-1 text-3xl font-bold text-[#334f2b]">{title}</h1>
          <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#334f2b] hover:text-[#334f2b]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction}>
            <button className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
