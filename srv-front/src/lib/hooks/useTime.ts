/**
 * Time tracking hooks for CellBlock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useTimeStatus() {
  return useQuery({
    queryKey: ['time', 'status'],
    queryFn: () => apiClient.getTimeStatus(),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useUsageLogs(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['time', 'usage', params],
    queryFn: () => apiClient.getUsageLogs(params),
  });
}

export function useWebSocketHeartbeat(deviceId: string) {
  // TODO: Implement WebSocket heartbeat hook
  // This will send heartbeats every 30-60 seconds automatically
}
