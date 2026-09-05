// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '../../components/EmptyState';
import { apiGet } from '../../lib/apiClient';

interface AdminSendLogRow {
  id: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  count: number;
  subject?: string;
  recipients: string[];
  sentAt: string;
}

export function AdminSendLogPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'send-log'],
    queryFn: () => apiGet<{ items: AdminSendLogRow[]; total: number }>('/admin/send-log'),
  });

  if (isError) {
    return <ErrorState message="Failed to load the send log" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Send audit log (platform admin)</h1>
      <p className="mb-4 text-xs text-slate-500">Who sent mail, when, and what — across every organization on this demo.</p>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Sent</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Organization</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Recipients</th>
              <th className="px-4 py-2">Count</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading&hellip;
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No sends recorded yet
                </td>
              </tr>
            )}
            {data?.items.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                  {new Date(row.sentAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-800">{row.userName}</div>
                  <div className="text-xs text-slate-400">{row.userEmail}</div>
                </td>
                <td className="px-4 py-2 text-slate-600">{row.organizationName}</td>
                <td className="max-w-[220px] truncate px-4 py-2 text-slate-600" title={row.subject}>
                  {row.subject ?? '—'}
                </td>
                <td className="max-w-[260px] px-4 py-2 text-slate-600">
                  <span className="line-clamp-2 break-words">{row.recipients.join(', ')}</span>
                </td>
                <td className="px-4 py-2 text-slate-600">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
