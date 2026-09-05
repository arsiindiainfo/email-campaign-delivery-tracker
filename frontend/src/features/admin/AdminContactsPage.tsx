// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { useToast } from '../../components/ToastContext';
import { apiGet, apiPatch, ApiError } from '../../lib/apiClient';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AdminContactRow {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  organizationName: string;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  PENDING: 'text-amber-600',
  APPROVED: 'text-emerald-600',
  REJECTED: 'text-red-600',
};

export function AdminContactsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>('PENDING');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'contacts', statusFilter],
    queryFn: () =>
      apiGet<{ items: AdminContactRow[]; total: number }>(
        statusFilter === 'ALL' ? '/admin/contacts' : `/admin/contacts?status=${statusFilter}`,
      ),
  });

  const setApproval = async (row: AdminContactRow, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiPatch(`/admin/contacts/${row.id}/${status === 'APPROVED' ? 'approve' : 'reject'}`);
      showToast(`${row.email} ${status === 'APPROVED' ? 'approved' : 'rejected'}`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] });
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Action failed');
    }
  };

  if (isError) {
    return <ErrorState message="Failed to load contacts" onRetry={() => void refetch()} />;
  }

  const columns: Column<AdminContactRow>[] = [
    { header: 'Email', render: (row) => row.email },
    { header: 'Name', render: (row) => [row.firstName, row.lastName].filter(Boolean).join(' ') || '—' },
    { header: 'Organization', render: (row) => row.organizationName },
    {
      header: 'Status',
      render: (row) => <span className={`font-medium ${STATUS_STYLES[row.approvalStatus]}`}>{row.approvalStatus}</span>,
    },
    { header: 'Added', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          {row.approvalStatus !== 'APPROVED' && (
            <button onClick={() => void setApproval(row, 'APPROVED')} className="text-sm text-emerald-600 hover:underline">
              Approve
            </button>
          )}
          {row.approvalStatus !== 'REJECTED' && (
            <button onClick={() => void setApproval(row, 'REJECTED')} className="text-sm text-red-600 hover:underline">
              Reject
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Contact approvals (platform admin)</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'ALL')}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All</option>
        </select>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Approving a contact lets it receive real email in this public demo (§ demo-send-guard.service.ts). Seeded
        @novamail.demo contacts never need approval.
      </p>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyState={<EmptyState title="Nothing here" />}
      />
    </div>
  );
}
