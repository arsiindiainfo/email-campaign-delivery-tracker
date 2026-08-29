// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { StateBadge } from '../../components/StateBadge';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import type { Suppression } from '../../types/domain';
import { useAddSuppression, useRemoveSuppression, useSuppressions } from './api';

export function SuppressionsPage() {
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<Suppression | null>(null);
  const { showToast } = useToast();

  const { data, isLoading, isError, refetch } = useSuppressions({ page, limit: 20 });
  const addSuppression = useAddSuppression();
  const removeSuppression = useRemoveSuppression();

  const columns: Column<Suppression>[] = [
    { header: 'Email', render: (s) => s.email },
    { header: 'Reason', render: (s) => <StateBadge status={s.reason.toUpperCase()} /> },
    { header: 'Added', render: (s) => new Date(s.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: (s) =>
        s.reason === 'manual' ? (
          <button onClick={() => setPendingRemove(s)} className="text-sm text-red-600 hover:underline">
            Remove
          </button>
        ) : (
          <span className="text-xs text-slate-400">Permanent</span>
        ),
    },
  ];

  const handleAdd = async () => {
    setAddError(null);
    try {
      await addSuppression.mutateAsync({ email });
      showToast('Address suppressed');
      setEmail('');
      setAdding(false);
    } catch (e) {
      setAddError(e instanceof ApiError ? e.message : 'Failed to suppress this address');
    }
  };

  const handleRemove = async () => {
    if (!pendingRemove) return;
    await removeSuppression.mutateAsync(pendingRemove.id);
    showToast(`Removed ${pendingRemove.email} from suppression list`);
    setPendingRemove(null);
  };

  if (isError) {
    return <ErrorState message="Failed to load suppressions" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Suppression list</h1>
        <Button onClick={() => setAdding(true)}>Suppress an address</Button>
      </div>

      {adding && (
        <div className="mb-4 rounded-md border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm text-amber-700">
            This will silently exclude this address from all future sends.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={addError ?? undefined} />
            </div>
            <Button onClick={() => void handleAdd()} isLoading={addSuppression.isPending}>
              Suppress
            </Button>
            <Button variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyState={<EmptyState title="No suppressed addresses" description="Bounces, complaints, and unsubscribes will appear here automatically." />}
      />

      <ConfirmDialog
        open={!!pendingRemove}
        title={`Remove ${pendingRemove?.email}?`}
        description="This address will become eligible to receive campaigns again."
        confirmLabel="Remove"
        isLoading={removeSuppression.isPending}
        onConfirm={() => void handleRemove()}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
