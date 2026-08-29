// Copyright (c) 2026 Arsi India Info. Licensed under the MIT License. See LICENSE and TRADEMARK.md.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiGetPaginated, apiPost, apiPut } from '../../lib/apiClient';
import type { PaginationParams } from '../../types/api';
import type { Organization, Role, User } from '../../types/domain';

export function useOrganization() {
  return useQuery({ queryKey: ['organization'], queryFn: () => apiGet<Organization>('/organizations/me') });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { senderDomain?: string; senderEmail?: string; name?: string }) =>
      apiPut<Organization>('/organizations/me', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
}

export function useVerifySender() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<Organization>('/organizations/me/verify-sender'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
  });
}

export function useCurrentUser() {
  return useQuery({ queryKey: ['users', 'me'], queryFn: () => apiGet<User>('/users/me') });
}

export function useTeamMembers(params: PaginationParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiGetPaginated<User>('/users', { params }),
    placeholderData: (prev) => prev,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; role: Role }) =>
      apiPost<{ user: User; tempPassword: string }>('/users/invite', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
