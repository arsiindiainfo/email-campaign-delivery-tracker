// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
export function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonBlock({ className = 'h-24' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}
