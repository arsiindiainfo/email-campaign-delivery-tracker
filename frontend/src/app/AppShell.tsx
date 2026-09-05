// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logoFull from '../assets/logo-full.png';
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

const ADMIN_NAV_ITEMS = [
  { to: '/admin/users', label: 'Admin: Users' },
  { to: '/admin/contacts', label: 'Admin: Contacts' },
  { to: '/admin/send-log', label: 'Admin: Send Log' },
];

export function AppShell() {
  const { user, organization, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navItems = user?.isPlatformAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <img src={logoFull} alt="Arsi India Info" className="h-6 w-auto" />
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="rounded-md border border-slate-200 p-2 text-slate-600"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:z-auto md:w-56 md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <img src={logoFull} alt="Arsi India Info" className="mb-2 h-6 w-auto" />
            <div className="text-sm font-semibold text-slate-900">{organization?.name ?? 'Email Campaign Tracker'}</div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            className="text-slate-400 md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
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
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <BrandFooter />
      </div>
    </div>
  );
}
