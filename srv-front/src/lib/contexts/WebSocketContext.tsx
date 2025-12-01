/**
 * WebSocket Context Provider
 * Manages WebSocket connection and real-time updates
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketClient } from '../api/websocket';
import { useAuth } from '../hooks/useAuth';

interface WebSocketContextValue {
  isConnected: boolean;
  sendHeartbeat: (deviceId: string, isWhitelistedApp: boolean) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get or create device fingerprint
    const getDeviceId = () => {
      let id = localStorage.getItem('cellblock_device_id');
      if (!id) {
        id = `web_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('cellblock_device_id', id);
      }
      return id;
    };

    if (user) {
      const devId = getDeviceId();

      // Get access token from localStorage or session
      const accessToken = localStorage.getItem('cellblock_access_token');
      if (accessToken) {
        // Connect to WebSocket
        websocketClient.connect(accessToken, devId);
        setIsConnected(true);

        // Set up event listeners
        setupEventListeners();

        // Start heartbeat interval (every 60 seconds)
        const heartbeatInterval = setInterval(() => {
          websocketClient.sendHeartbeat(devId, false);
        }, 60000);

        return () => {
          clearInterval(heartbeatInterval);
          websocketClient.disconnect();
          setIsConnected(false);
        };
      }
    }

    return () => {
      websocketClient.disconnect();
      setIsConnected(false);
    };
  }, [user, queryClient]);

  const setupEventListeners = () => {
    // Time update event
    websocketClient.onTimeUpdate((data) => {
      console.log('Time update received:', data);
      queryClient.invalidateQueries({ queryKey: ['time', 'status'] });
    });

    // Lock command event
    websocketClient.onLockCommand((data) => {
      console.log('Lock command received:', data);
      queryClient.invalidateQueries({ queryKey: ['time', 'status'] });
      // TODO: Show notification to user
    });

    // Unlock command event
    websocketClient.onUnlockCommand((data) => {
      console.log('Unlock command received:', data);
      queryClient.invalidateQueries({ queryKey: ['time', 'status'] });
      // TODO: Show notification to user
    });

    // Warning event
    websocketClient.onWarning((data) => {
      console.log('Warning received:', data);
      // TODO: Show warning notification to user
    });

    // Config update event
    websocketClient.onConfigUpdate((data) => {
      console.log('Config update received:', data);
      queryClient.invalidateQueries({ queryKey: ['time', 'status'] });
      // TODO: Show notification to user
    });

    // Whitelist change event
    websocketClient.onWhitelistChange((data) => {
      console.log('Whitelist change received:', data);
      queryClient.invalidateQueries({ queryKey: ['whitelist'] });
      // TODO: Show notification to user
    });
  };

  const sendHeartbeat = (deviceId: string, isWhitelistedApp: boolean) => {
    websocketClient.sendHeartbeat(deviceId, isWhitelistedApp);
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendHeartbeat }}>
      {children}
    </WebSocketContext.Provider>
  );
}
