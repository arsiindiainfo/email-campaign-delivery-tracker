// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { useToast } from '../../components/ToastContext';
import type { TemplateSummary } from '../../types/domain';
import { useDeleteTemplate, useTemplates } from './api';

export function TemplatesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<TemplateSummary | null>(null);
  const { showToast } = useToast();

  const { data, isLoading, isError, refetch } = useTemplates({ page, limit: 20, search: search || undefined });
  const deleteTemplate = useDeleteTemplate();

  const columns: Column<TemplateSummary>[] = [
    { header: 'Name', render: (t) => <Link to={`/templates/${t.id}`} className="font-medium text-indigo-600 hover:underline">{t.name}</Link> },
    { header: 'Subject', render: (t) => t.subject },
    { header: 'Updated', render: (t) => new Date(t.updatedAt).toLocaleDateString() },
    {
      header: 'Actions',
      render: (t) => (
        <div className="flex gap-3">
          <Link to={`/templates/${t.id}`} className="text-sm text-indigo-600 hover:underline">
            Edit
          </Link>
          <button onClick={() => setPendingDelete(t)} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTemplate.mutateAsync(pendingDelete.id);
      showToast(`Template "${pendingDelete.name}" deleted`);
      setPendingDelete(null);
    } catch {
      showToast('Could not delete this template — it may be in use by a campaign', 'error');
    }
  };

  if (isError) {
    return <ErrorState message="Failed to load templates" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Templates</h1>
        <Link to="/templates/new" className="sm:shrink-0">
          <Button className="w-full sm:w-auto">New template</Button>
        </Link>
      </div>
      <input
        placeholder="Search templates…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="mb-4 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 sm:max-w-xs"
      />
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyState={
          search ? (
            <EmptyState title="No templates match your filters" action={<button onClick={() => setSearch('')} className="text-sm text-indigo-600 hover:underline">Clear filters</button>} />
          ) : (
            <EmptyState
              title="No templates yet"
              description="Create a reusable HTML template to start building campaigns."
              action={
                <Link to="/templates/new">
                  <Button>Create your first template</Button>
                </Link>
              }
            />
          )
        }
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This can't be undone."
        danger
        confirmLabel="Delete"
        isLoading={deleteTemplate.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
