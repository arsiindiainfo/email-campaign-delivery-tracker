// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import type { ReactNode } from 'react';
import type { PaginationMeta } from '../types/api';
import { Button } from './Button';
import { SkeletonRow } from './Skeleton';

export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  emptyState?: ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, isLoading, meta, onPageChange, emptyState }: DataTableProps<T>) {
  if (!isLoading && rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} columns={columns.length} />)
              : rows.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-slate-50">
                    {columns.map((col) => (
                      <td key={col.header} className={`px-4 py-3 text-slate-700 ${col.className ?? ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5">
          <span className="text-xs text-slate-500">
            Page {meta.page} of {meta.totalPages} — {meta.total} total
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
