// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import type { LucideIcon } from 'lucide-react';

const TONE_CLASSES = {
  indigo: 'bg-indigo-100 text-indigo-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  blue: 'bg-blue-100 text-blue-600',
  red: 'bg-red-100 text-red-600',
} as const;

type Tone = keyof typeof TONE_CLASSES;

export function StatCard({
  label,
  value,
  suffix,
  loading,
  icon: Icon,
  tone = 'indigo',
}: {
  label: string;
  value: string | number | null;
  suffix?: string;
  loading?: boolean;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          {loading ? (
            <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-slate-200" />
          ) : (
            <div className="text-xl font-semibold text-slate-900">
              {value === null ? '—' : value}
              {suffix && value !== null && <span className="ml-0.5 text-sm font-medium text-slate-500">{suffix}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
