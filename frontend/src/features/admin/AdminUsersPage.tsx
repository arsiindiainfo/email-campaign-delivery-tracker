// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { useToast } from '../../components/ToastContext';
import { apiDelete, apiGet, apiPatch, ApiError } from '../../lib/apiClient';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  emailVerified: boolean;
  isBlocked: boolean;
  isPlatformAdmin: boolean;
  createdAt: string;
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => apiGet<{ items: AdminUserRow[]; total: number }>('/admin/users'),
  });

  const toggleBlock = async (row: AdminUserRow) => {
    try {
      await apiPatch(row.isBlocked ? `/admin/users/${row.id}/unblock` : `/admin/users/${row.id}/block`);
      showToast(row.isBlocked ? `Unblocked ${row.email}` : `Blocked ${row.email}`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Action failed');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await apiDelete(`/admin/users/${pendingDelete.id}`);
      showToast(`Deleted ${pendingDelete.email}`);
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };

  if (isError) {
    return <ErrorState message="Failed to load users" onRetry={() => void refetch()} />;
  }

  const columns: Column<AdminUserRow>[] = [
    {
      header: 'Name',
      render: (row) => (
        <>
          {row.name} {row.isPlatformAdmin && <span className="ml-1 rounded bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700">admin</span>}
        </>
      ),
    },
    { header: 'Email', render: (row) => row.email },
    { header: 'Organization', render: (row) => row.organizationName },
    { header: 'Role', render: (row) => row.role },
    {
      header: 'Verified',
      render: (row) => (row.emailVerified ? <span className="text-emerald-600">Yes</span> : <span className="text-amber-600">No</span>),
    },
    {
      header: 'Status',
      render: (row) => (row.isBlocked ? <span className="text-red-600">Blocked</span> : <span className="text-slate-500">Active</span>),
    },
    { header: 'Joined', render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: (row) =>
        row.isPlatformAdmin ? (
          <span className="text-xs text-slate-400">&mdash;</span>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => void toggleBlock(row)} className="text-sm text-indigo-600 hover:underline">
              {row.isBlocked ? 'Unblock' : 'Block'}
            </button>
            <button onClick={() => setPendingDelete(row)} className="text-sm text-red-600 hover:underline">
              Delete
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">All users (platform admin)</h1>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyState={<EmptyState title="No users yet" />}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete ${pendingDelete?.email}?`}
        description="This permanently removes the user's login. Their organization and data are not deleted."
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
