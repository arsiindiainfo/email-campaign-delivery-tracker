// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { StateBadge } from '../../components/StateBadge';
import { TextField } from '../../components/TextField';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import type { Contact } from '../../types/domain';
import { useAddContact, useContacts, useImportJob, useList, useRemoveContact, uploadCsvAndImport } from './api';

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const { data: list } = useList(id);
  const { data, isLoading, isError, refetch } = useContacts(id, { page, limit: 20 });
  const addContact = useAddContact(id ?? '');
  const removeContact = useRemoveContact(id ?? '');
  const { data: importJob } = useImportJob(id, importJobId);

  const columns: Column<Contact>[] = [
    { header: 'Email', render: (c) => c.email },
    { header: 'Name', render: (c) => [c.firstName, c.lastName].filter(Boolean).join(' ') || '—' },
    { header: 'Status', render: (c) => <StateBadge status={c.status} /> },
    {
      header: 'Actions',
      render: (c) => (
        <button
          onClick={() => void removeContact.mutateAsync(c.id).then(() => showToast('Contact removed from list'))}
          className="text-sm text-red-600 hover:underline"
        >
          Remove
        </button>
      ),
    },
  ];

  const handleAdd = async () => {
    setAddError(null);
    try {
      await addContact.mutateAsync({ email });
      showToast('Contact added');
      setEmail('');
      setShowAddForm(false);
    } catch (e) {
      setAddError(e instanceof ApiError ? e.message : 'Failed to add contact');
    }
  };

  const handleFileSelected = async (file: File) => {
    setUploading(true);
    try {
      const { importJobId: jobId } = await uploadCsvAndImport(id!, file);
      setImportJobId(jobId);
    } catch {
      showToast('Failed to upload CSV', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (isError) {
    return <ErrorState message="Failed to load this list" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">{list?.name ?? 'Loading…'}</h1>
      <p className="mb-4 text-sm text-slate-500">{list?.contactCount ?? 0} contacts</p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => setShowAddForm((v) => !v)}>Add contact</Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} isLoading={uploading}>
          Import CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelected(file);
            e.target.value = '';
          }}
        />
      </div>

      {importJob && importJob.status !== 'COMPLETED' && importJob.status !== 'FAILED' && (
        <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Importing… usually takes under a minute.
        </div>
      )}
      {importJob?.status === 'COMPLETED' && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {importJob.importedCount} imported, {importJob.skippedCount} skipped
          {importJob.skippedSamples.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs text-green-700">
              {importJob.skippedSamples.slice(0, 5).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {importJob?.status === 'FAILED' && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Import failed: {importJob.errorMessage}
        </div>
      )}

      {showAddForm && (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={addError ?? undefined} />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 sm:flex-none" onClick={() => void handleAdd()} isLoading={addContact.isPending}>
              Add
            </Button>
            <Button className="flex-1 sm:flex-none" variant="secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyState={
          <EmptyState title="Import your first contacts" description="Add contacts one at a time or import a CSV file." />
        }
      />
    </div>
  );
}
