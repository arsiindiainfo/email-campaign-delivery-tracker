// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import type { Column } from '../../components/DataTable';
import { DataTable } from '../../components/DataTable';
import { ErrorState } from '../../components/EmptyState';
import { SkeletonBlock } from '../../components/Skeleton';
import { StateBadge } from '../../components/StateBadge';
import { useToast } from '../../components/ToastContext';
import { ApiError } from '../../lib/apiClient';
import type { Campaign, Recipient } from '../../types/domain';
import { useCampaignAnalytics } from '../analytics/api';
import { useCancelCampaign, usePauseCampaign, useRecipients, useResumeCampaign } from './api';

const FUNNEL_STEPS: { key: keyof Campaign['stats']; label: string }[] = [
  { key: 'queued', label: 'Queued' },
  { key: 'sent', label: 'Sent' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'opened', label: 'Opened' },
  { key: 'clicked', label: 'Clicked' },
];

export function CampaignDetailPage({ campaign }: { campaign: Campaign }) {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<'cancel' | null>(null);

  const isLive = campaign.status === 'SENDING';
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch } = useCampaignAnalytics(campaign.id, isLive);
  const { data: recipientsPage, isLoading: recipientsLoading } = useRecipients(campaign.id, { page, limit: 20 });

  const pauseCampaign = usePauseCampaign(campaign.id);
  const resumeCampaign = useResumeCampaign(campaign.id);
  const cancelCampaign = useCancelCampaign(campaign.id);

  const columns: Column<Recipient>[] = [
    { header: 'Email', render: (r) => r.email },
    { header: 'Status', render: (r) => <StateBadge status={r.status} /> },
    { header: 'Last event', render: (r) => (r.lastEventAt ? new Date(r.lastEventAt).toLocaleString() : '—') },
  ];

  const handleAction = async (action: 'pause' | 'resume' | 'cancel') => {
    try {
      if (action === 'pause') await pauseCampaign.mutateAsync();
      if (action === 'resume') await resumeCampaign.mutateAsync();
      if (action === 'cancel') await cancelCampaign.mutateAsync();
      showToast(`Campaign ${action === 'cancel' ? 'cancelled' : action + 'd'}`);
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : `Failed to ${action} campaign`, 'error');
    }
    setConfirmAction(null);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-slate-900">{campaign.name}</h1>
          <p className="truncate text-sm text-slate-500">{campaign.subject}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StateBadge status={campaign.status} live={isLive} />
          {campaign.status === 'SENDING' && (
            <Button variant="secondary" size="sm" onClick={() => void handleAction('pause')} isLoading={pauseCampaign.isPending}>
              Pause
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button variant="secondary" size="sm" onClick={() => void handleAction('resume')} isLoading={resumeCampaign.isPending}>
              Resume
            </Button>
          )}
          {['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status) && (
            <Button variant="danger" size="sm" onClick={() => setConfirmAction('cancel')}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {analyticsError && <ErrorState message="Analytics temporarily unavailable" onRetry={() => void refetch()} />}

      {!analyticsError && (
        <>
          <div className="mb-6 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            {analyticsLoading ? (
              <SkeletonBlock className="h-20" />
            ) : (
              <div className="flex min-w-max items-center gap-6">
                {FUNNEL_STEPS.map((step) => (
                  <div key={step.key} className="text-center">
                    <div className="text-xs font-medium uppercase text-slate-500">{step.label}</div>
                    <div className="text-xl font-semibold text-slate-900">{campaign.stats[step.key].toLocaleString()}</div>
                  </div>
                ))}
                <div className="ml-auto flex gap-6 border-l border-slate-100 pl-6 text-center">
                  <div>
                    <div className="text-xs font-medium uppercase text-red-500">Bounced</div>
                    <div className="text-lg font-semibold text-slate-700">{campaign.stats.bounced}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-red-500">Complained</div>
                    <div className="text-lg font-semibold text-slate-700">{campaign.stats.complained}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-amber-500">Unsubscribed</div>
                    <div className="text-lg font-semibold text-slate-700">{campaign.stats.unsubscribed}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {analytics && analytics.series.length > 0 && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Opens & clicks — first 48h</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tickFormatter={(h: number) => `${h}h`} fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="opened" stroke="#4f46e5" strokeWidth={2} dot={false} name="Opened" />
                  <Line type="monotone" dataKey="clicked" stroke="#0d9488" strokeWidth={2} dot={false} name="Clicked" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Recipients</h2>
      <DataTable
        columns={columns}
        rows={recipientsPage?.data ?? []}
        rowKey={(r) => r.id}
        isLoading={recipientsLoading}
        meta={recipientsPage?.meta}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={confirmAction === 'cancel'}
        title="Cancel this campaign?"
        description="Already-dispatched sends can't be recalled — only not-yet-sent recipients will be dropped."
        danger
        confirmLabel="Cancel campaign"
        isLoading={cancelCampaign.isPending}
        onConfirm={() => void handleAction('cancel')}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
