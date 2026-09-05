// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import {
  Ban,
  Home,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Menu,
  ScrollText,
  Send,
  Settings as SettingsIcon,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import logoFull from '../assets/logo-full.png';
import { BrandFooter } from '../components/BrandFooter';
import { useAuth } from '../features/auth/AuthContext';

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/campaigns', label: 'Campaigns', icon: Send },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/lists', label: 'Lists', icon: ListChecks },
  { to: '/suppressions', label: 'Suppressions', icon: Ban },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const ADMIN_NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/admin/users', label: 'Admin: Users', icon: Users },
  { to: '/admin/contacts', label: 'Admin: Contacts', icon: UserCheck },
  { to: '/admin/send-log', label: 'Admin: Send Log', icon: ScrollText },
];

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-sky-600',
];

function initialsOf(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function avatarColorFor(seed: string | undefined): string {
  if (!seed) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

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
          <Menu size={20} />
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
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={17} className="shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 border-t border-slate-200 p-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColorFor(user?.email)}`}
          >
            {initialsOf(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-slate-700">{user?.name}</div>
            <div className="truncate text-xs text-slate-400">{user?.email}</div>
            <button
              onClick={logout}
              className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
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
