// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { NavLink, Outlet } from 'react-router-dom';
import { BrandFooter } from '../components/BrandFooter';
import { useAuth } from '../features/auth/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/templates', label: 'Templates' },
  { to: '/lists', label: 'Lists' },
  { to: '/suppressions', label: 'Suppressions' },
  { to: '/settings', label: 'Settings' },
];

export function AppShell() {
  const { user, organization, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-sm font-semibold text-slate-900">{organization?.name ?? 'Email Campaign Tracker'}</div>
          <div className="text-xs text-slate-400">Arsi India Info</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="truncate text-xs font-medium text-slate-700">{user?.name}</div>
          <div className="truncate text-xs text-slate-400">{user?.email}</div>
          <button onClick={logout} className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800">
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <BrandFooter />
      </div>
    </div>
  );
}
