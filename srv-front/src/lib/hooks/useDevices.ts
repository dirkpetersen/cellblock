/**
 * Device management hooks for CellBlock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { RegisterDeviceInput } from '@cellblock/contracts';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => apiClient.getDevices(),
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterDeviceInput) => apiClient.registerDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useRemoveDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => apiClient.removeDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
