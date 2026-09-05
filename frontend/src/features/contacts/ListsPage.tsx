// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import type { ContactList } from '../../types/domain';
import { useCreateList, useDeleteList, useLists } from './api';

export function ListsPage() {
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactList | null>(null);
  const { showToast } = useToast();

  const { data, isLoading, isError, refetch } = useLists({ page, limit: 20 });
  const createList = useCreateList();
  const deleteList = useDeleteList();

  const columns: Column<ContactList>[] = [
    { header: 'Name', render: (l) => <Link to={`/lists/${l.id}`} className="font-medium text-indigo-600 hover:underline">{l.name}</Link> },
    { header: 'Contacts', render: (l) => l.contactCount.toLocaleString() },
    { header: 'Created', render: (l) => new Date(l.createdAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: (l) => (
        <button onClick={() => setPendingDelete(l)} className="text-sm text-red-600 hover:underline">
          Delete
        </button>
      ),
    },
  ];

  const handleCreate = async () => {
    setCreateError(null);
    try {
      await createList.mutateAsync({ name: newName });
      showToast('List created');
      setNewName('');
      setCreating(false);
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : 'Failed to create list');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteList.mutateAsync(pendingDelete.id);
      showToast(`List "${pendingDelete.name}" deleted`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Could not delete this list', 'error');
    }
    setPendingDelete(null);
  };

  if (isError) {
    return <ErrorState message="Failed to load lists" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Recipient lists</h1>
        <Button className="w-full sm:w-auto" onClick={() => setCreating(true)}>New list</Button>
      </div>

      {creating && (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField label="List name" value={newName} onChange={(e) => setNewName(e.target.value)} error={createError ?? undefined} />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 sm:flex-none" onClick={() => void handleCreate()} isLoading={createList.isPending}>
              Create
            </Button>
            <Button className="flex-1 sm:flex-none" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(l) => l.id}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            title="No recipient lists yet"
            description="Create a list, then import contacts to start sending campaigns."
            action={<Button onClick={() => setCreating(true)}>Create your first list</Button>}
          />
        }
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This can't be undone."
        danger
        confirmLabel="Delete"
        isLoading={deleteList.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
