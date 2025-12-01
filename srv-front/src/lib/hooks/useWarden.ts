/**
 * Warden management hooks for CellBlock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type {
  InviteWardenInput,
  ApproveRequestInput,
  GrantParoleInput,
  TriggerLockdownInput,
} from '@cellblock/contracts';

export function useInmates() {
  return useQuery({
    queryKey: ['warden', 'inmates'],
    queryFn: () => apiClient.getInmates(),
  });
}

export function useMyWardens() {
  return useQuery({
    queryKey: ['warden', 'my-wardens'],
    queryFn: () => apiClient.getMyWardens(),
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: ['warden', 'requests', 'pending'],
    queryFn: () => apiClient.getPendingRequests(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useInviteWarden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteWardenInput) => apiClient.inviteWarden(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warden', 'my-wardens'] });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveRequestInput) => apiClient.approveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warden', 'requests'] });
    },
  });
}

export function useGrantParole() {
  return useMutation({
    mutationFn: (data: GrantParoleInput) => apiClient.grantParole(data),
  });
}

export function useTriggerLockdown() {
  return useMutation({
    mutationFn: (data: TriggerLockdownInput) => apiClient.triggerLockdown(data),
  });
}

export function useResignAsWarden() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inmateId: string) => apiClient.resignAsWarden(inmateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warden', 'inmates'] });
    },
  });
}

export function useBreakGlass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment?: string) => apiClient.breakGlass(comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warden'] });
    },
  });
}
