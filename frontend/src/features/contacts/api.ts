// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiDelete, apiGet, apiGetPaginated, apiPost } from '../../lib/apiClient';
import type { PaginationParams } from '../../types/api';
import type { Contact, ContactList, ImportJob } from '../../types/domain';

export function useLists(params: PaginationParams) {
  return useQuery({
    queryKey: ['lists', params],
    queryFn: () => apiGetPaginated<ContactList>('/lists', { params }),
    placeholderData: (prev) => prev,
  });
}

export function useList(id: string | undefined) {
  return useQuery({
    queryKey: ['lists', id],
    queryFn: () => apiGet<ContactList>(`/lists/${id}`),
    enabled: !!id,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string }) => apiPost<ContactList>('/lists', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/lists/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
    },
  });
}

export function useContacts(listId: string | undefined, params: PaginationParams) {
  return useQuery({
    queryKey: ['lists', listId, 'contacts', params],
    queryFn: () => apiGetPaginated<Contact>(`/lists/${listId}/contacts`, { params }),
    enabled: !!listId,
    placeholderData: (prev) => prev,
  });
}

export function useAddContact(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; firstName?: string; lastName?: string; override?: boolean }) =>
      apiPost<Contact>(`/lists/${listId}/contacts`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists', listId] });
    },
  });
}

export function useRemoveContact(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => apiDelete(`/lists/${listId}/contacts/${contactId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists', listId] });
    },
  });
}

export async function uploadCsvAndImport(listId: string, file: File): Promise<{ importJobId: string }> {
  const presign = await apiPost<{ uploadUrl: string; s3Key: string }>(`/lists/${listId}/imports/presign`, {
    filename: file.name,
  });
  // Uploads directly to S3 with the presigned URL — must bypass our apiClient's
  // interceptor so we don't attach an Authorization header the signature doesn't cover.
  await axios.put(presign.uploadUrl, file, { headers: { 'Content-Type': 'text/csv' } });
  return apiPost<{ importJobId: string }>(`/lists/${listId}/import`, { s3Key: presign.s3Key });
}

export function useImportJob(listId: string | undefined, jobId: string | null) {
  return useQuery({
    queryKey: ['lists', listId, 'imports', jobId],
    queryFn: () => apiGet<ImportJob>(`/lists/${listId}/imports/${jobId}`),
    enabled: !!listId && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'PROCESSING' ? 1500 : false;
    },
  });
}
