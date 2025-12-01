/**
 * Whitelist management hooks for CellBlock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { AddWhitelistItemInput } from '@cellblock/contracts';

export function useWhitelist() {
  return useQuery({
    queryKey: ['whitelist'],
    queryFn: () => apiClient.getWhitelist(),
  });
}

export function useEnabledWhitelist(platform?: string) {
  return useQuery({
    queryKey: ['whitelist', 'enabled', platform],
    queryFn: () => apiClient.getEnabledWhitelist(platform),
  });
}

export function useAddWhitelistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddWhitelistItemInput) => apiClient.addWhitelistItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
}

export function useRemoveWhitelistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, comment }: { itemId: string; comment?: string }) =>
      apiClient.removeWhitelistItem(itemId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
}

export function useToggleHealthyApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, enabled, comment }: { itemId: string; enabled: boolean; comment?: string }) =>
      apiClient.toggleHealthyApp(itemId, enabled, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
    },
  });
}
