// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export function StatCard({
  label,
  value,
  suffix,
  loading,
}: {
  label: string;
  value: string | number | null;
  suffix?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
      ) : (
        <div className="mt-1 text-2xl font-semibold text-slate-900">
          {value === null ? '—' : value}
          {suffix && value !== null && <span className="ml-0.5 text-base font-medium text-slate-500">{suffix}</span>}
        </div>
      )}
    </div>
  );
}
