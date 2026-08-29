// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGetPaginated, apiPost } from '../../lib/apiClient';
import type { PaginationParams } from '../../types/api';
import type { Suppression } from '../../types/domain';

export function useSuppressions(params: PaginationParams) {
  return useQuery({
    queryKey: ['suppressions', params],
    queryFn: () => apiGetPaginated<Suppression>('/suppressions', { params }),
    placeholderData: (prev) => prev,
  });
}

export function useAddSuppression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string }) => apiPost<Suppression>('/suppressions', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppressions'] });
    },
  });
}

export function useRemoveSuppression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/suppressions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppressions'] });
    },
  });
}
