// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState } from '../../components/EmptyState';
import { StateBadge } from '../../components/StateBadge';
import { StatCard } from '../../components/StatCard';
import { useAnalyticsOverview } from '../analytics/api';
import { useCampaigns } from '../campaigns/api';
import type { CampaignSummary } from '../../types/domain';

export function DashboardPage() {
  const { data: overview, isLoading: overviewLoading, isError: overviewError, refetch: refetchOverview } = useAnalyticsOverview();
  const { data: recentCampaigns, isLoading: campaignsLoading, isError: campaignsError, refetch: refetchCampaigns } = useCampaigns({
    limit: 5,
    sort: 'createdAt',
    direction: 'desc',
  });

  const columns: Column<CampaignSummary>[] = [
    { header: 'Name', render: (c) => <Link to={`/campaigns/${c.id}`} className="font-medium text-indigo-600 hover:underline">{c.name}</Link> },
    { header: 'Status', render: (c) => <StateBadge status={c.status} live={c.status === 'SENDING'} /> },
    { header: 'Open rate', render: (c) => (c.status === 'SENT' || c.status === 'SENDING' ? `${c.openRate}%` : '—') },
  ];

  const hasNoCampaigns = !campaignsLoading && (recentCampaigns?.data.length ?? 0) === 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <Link to="/campaigns/new">
          <Button>+ New campaign</Button>
        </Link>
      </div>

      {overviewError ? (
        <ErrorState message="Failed to load analytics" onRetry={() => void refetchOverview()} />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Sent" value={overviewLoading ? null : (overview?.totalSent ?? 0)} loading={overviewLoading} />
          <StatCard label="Delivery rate" value={overviewLoading ? null : overview?.deliveryRate ?? 0} suffix="%" loading={overviewLoading} />
          <StatCard label="Open rate" value={overviewLoading ? null : overview?.openRate ?? 0} suffix="%" loading={overviewLoading} />
          <StatCard label="Click rate" value={overviewLoading ? null : overview?.clickRate ?? 0} suffix="%" loading={overviewLoading} />
          <StatCard label="Bounce rate" value={overviewLoading ? null : overview?.bounceRate ?? 0} suffix="%" loading={overviewLoading} />
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Recent campaigns</h2>
      {campaignsError ? (
        <ErrorState message="Failed to load campaigns" onRetry={() => void refetchCampaigns()} />
      ) : hasNoCampaigns ? (
        <EmptyState
          title="You haven't sent a campaign yet"
          description="Create your first campaign to start tracking delivery."
          action={
            <Link to="/campaigns/new">
              <Button>Create your first campaign</Button>
            </Link>
          }
        />
      ) : (
        <DataTable columns={columns} rows={recentCampaigns?.data ?? []} rowKey={(c) => c.id} isLoading={campaignsLoading} />
      )}
    </div>
  );
}
