/**
 * WebSocket Client for CellBlock Frontend
 * Handles real-time communication with backend via Socket.io
 */

import { io, Socket } from 'socket.io-client';
import type { HeartbeatInput } from '@cellblock/contracts';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to WebSocket server
   */
  connect(accessToken: string, deviceId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      auth: {
        token: accessToken,
        deviceId,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 16000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        // TODO: Show error UI with "Report Issue" button
      } else {
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 16000);
      }
    });

    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Send heartbeat to server
   */
  sendHeartbeat(deviceId: string, isWhitelistedApp: boolean) {
    if (!this.socket?.connected) {
      console.warn('Cannot send heartbeat: WebSocket not connected');
      return;
    }

    const heartbeat: HeartbeatInput = {
      deviceId,
      isWhitelistedApp,
      timestamp: Date.now(),
    };

    this.socket.emit('heartbeat', heartbeat);
  }

  /**
   * Listen for time updates
   */
  onTimeUpdate(callback: (data: any) => void) {
    this.socket?.on('time_update', callback);
  }

  /**
   * Listen for lock commands
   */
  onLockCommand(callback: (data: any) => void) {
    this.socket?.on('lock_command', callback);
  }

  /**
   * Listen for unlock commands
   */
  onUnlockCommand(callback: (data: any) => void) {
    this.socket?.on('unlock_command', callback);
  }

  /**
   * Listen for warnings
   */
  onWarning(callback: (data: any) => void) {
    this.socket?.on('warning', callback);
  }

  /**
   * Listen for config updates
   */
  onConfigUpdate(callback: (data: any) => void) {
    this.socket?.on('config_update', callback);
  }

  /**
   * Listen for whitelist changes
   */
  onWhitelistChange(callback: (data: any) => void) {
    this.socket?.on('whitelist_change', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketClient = new WebSocketClient();
