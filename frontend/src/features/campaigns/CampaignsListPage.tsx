// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { StateBadge } from '../../components/StateBadge';
import type { CampaignStatus, CampaignSummary } from '../../types/domain';
import { useCampaigns } from './api';

const STATUS_FILTERS: (CampaignStatus | 'ALL')[] = ['ALL', 'DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED', 'SENT', 'CANCELLED'];

export function CampaignsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CampaignStatus | 'ALL'>('ALL');

  const { data, isLoading, isError, refetch } = useCampaigns({
    page,
    limit: 20,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  const columns: Column<CampaignSummary>[] = [
    { header: 'Name', render: (c) => <Link to={`/campaigns/${c.id}`} className="font-medium text-indigo-600 hover:underline">{c.name}</Link> },
    { header: 'Status', render: (c) => <StateBadge status={c.status} live={c.status === 'SENDING'} /> },
    { header: 'Date', render: (c) => (c.sentAt ? new Date(c.sentAt).toLocaleDateString() : c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString() : '—') },
    { header: 'Open rate', render: (c) => (c.status === 'SENT' || c.status === 'SENDING' ? `${c.openRate}%` : '—') },
    { header: 'Click rate', render: (c) => (c.status === 'SENT' || c.status === 'SENDING' ? `${c.clickRate}%` : '—') },
    {
      header: 'Actions',
      render: (c) => (
        <div className="flex gap-3">
          {c.status === 'DRAFT' && (
            <Link to={`/campaigns/${c.id}`} className="text-sm text-indigo-600 hover:underline">
              Edit
            </Link>
          )}
          <Link to={`/campaigns/${c.id}`} className="text-sm text-indigo-600 hover:underline">
            Analytics
          </Link>
        </div>
      ),
    },
  ];

  if (isError) {
    return <ErrorState message="Failed to load campaigns" onRetry={() => void refetch()} />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Campaigns</h1>
        <Link to="/campaigns/new">
          <Button>New campaign</Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
        <input
          placeholder="Search campaigns…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="ml-auto w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        meta={data?.meta}
        onPageChange={setPage}
        emptyState={
          search || status !== 'ALL' ? (
            <EmptyState
              title="No campaigns match your filters"
              action={
                <button
                  onClick={() => {
                    setSearch('');
                    setStatus('ALL');
                  }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              title="You haven't sent a campaign yet"
              description="Create your first campaign to start tracking delivery."
              action={
                <Link to="/campaigns/new">
                  <Button>Create your first campaign</Button>
                </Link>
              }
            />
          )
        }
      />
    </div>
  );
}
