// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/apiClient';
import type { AnalyticsOverview, CampaignAnalytics } from '../../types/domain';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiGet<AnalyticsOverview>('/analytics/overview'),
  });
}

export function useCampaignAnalytics(campaignId: string | undefined, live: boolean) {
  return useQuery({
    queryKey: ['analytics', 'campaigns', campaignId],
    queryFn: () => apiGet<CampaignAnalytics>(`/analytics/campaigns/${campaignId}`),
    enabled: !!campaignId,
    refetchInterval: live ? 15_000 : false,
  });
}
