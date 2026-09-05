// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useQuery } from '@tanstack/react-query';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
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

  const columns: Column<AdminSendLogRow>[] = [
    { header: 'Sent', render: (row) => new Date(row.sentAt).toLocaleString() },
    {
      header: 'User',
      render: (row) => (
        <>
          <div className="font-medium text-slate-800">{row.userName}</div>
          <div className="text-xs text-slate-400">{row.userEmail}</div>
        </>
      ),
    },
    { header: 'Organization', render: (row) => row.organizationName },
    {
      header: 'Subject',
      render: (row) => (
        <span className="block max-w-[220px] truncate" title={row.subject}>
          {row.subject ?? '—'}
        </span>
      ),
    },
    {
      header: 'Recipients',
      render: (row) => <span className="line-clamp-2 block max-w-[260px] break-words">{row.recipients.join(', ')}</span>,
    },
    { header: 'Count', render: (row) => row.count },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Send audit log (platform admin)</h1>
      <p className="mb-4 text-xs text-slate-500">Who sent mail, when, and what — across every organization on this demo.</p>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyState={<EmptyState title="No sends recorded yet" />}
      />
    </div>
  );
}
