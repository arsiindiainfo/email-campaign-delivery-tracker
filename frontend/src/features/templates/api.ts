// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGetPaginated, apiGet, apiPost, apiPut } from '../../lib/apiClient';
import type { PaginationParams } from '../../types/api';
import type { Template, TemplateSummary } from '../../types/domain';

export function useTemplates(params: PaginationParams) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => apiGetPaginated<TemplateSummary>('/templates', { params }),
    placeholderData: (prev) => prev,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => apiGet<Template>(`/templates/${id}`),
    enabled: !!id,
  });
}

export interface TemplateInput {
  name: string;
  subject: string;
  htmlBody: string;
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TemplateInput) => apiPost<Template>('/templates', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<TemplateInput>) => apiPut<Template>(`/templates/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/templates/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
