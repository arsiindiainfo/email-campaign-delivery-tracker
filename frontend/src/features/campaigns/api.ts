// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiGetPaginated, apiPost, apiPut } from '../../lib/apiClient';
import type { PaginationParams } from '../../types/api';
import type { Campaign, CampaignStatus, CampaignSummary, Recipient, RecipientStatus } from '../../types/domain';

export interface CampaignListParams extends PaginationParams {
  status?: CampaignStatus;
}

export function useCampaigns(params: CampaignListParams) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => apiGetPaginated<CampaignSummary>('/campaigns', { params }),
    placeholderData: (prev) => prev,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => apiGet<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 'SENDING' ? 15_000 : false),
  });
}

export interface CampaignInput {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  templateId: string;
  listIds: string[];
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CampaignInput) => apiPost<Campaign>('/campaigns', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CampaignInput> & { version: number }) => apiPut<Campaign>(`/campaigns/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/campaigns/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useSendTest(id: string) {
  return useMutation({
    mutationFn: (emails: string[]) => apiPost<{ sent: number }>(`/campaigns/${id}/send-test`, { emails }),
  });
}

function useCampaignAction(id: string, action: 'schedule' | 'pause' | 'resume' | 'cancel') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: { scheduledAt?: string }) => apiPost<Campaign>(`/campaigns/${id}/${action}`, body ?? {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useScheduleCampaign(id: string) {
  return useCampaignAction(id, 'schedule');
}
export function usePauseCampaign(id: string) {
  return useCampaignAction(id, 'pause');
}
export function useResumeCampaign(id: string) {
  return useCampaignAction(id, 'resume');
}
export function useCancelCampaign(id: string) {
  return useCampaignAction(id, 'cancel');
}

export function useRecipients(campaignId: string | undefined, params: PaginationParams & { status?: RecipientStatus }) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'recipients', params],
    queryFn: () => apiGetPaginated<Recipient>(`/campaigns/${campaignId}/recipients`, { params }),
    enabled: !!campaignId,
    placeholderData: (prev) => prev,
  });
}
