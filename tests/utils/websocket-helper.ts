/**
 * WebSocket Helper for Tests
 * Provides utilities to test Socket.io WebSocket connections
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export interface WebSocketOptions {
  accessToken: string;
  userId?: string;
  deviceId?: string;
}

/**
 * Create a WebSocket client connection
 */
export function createWebSocketClient(options: WebSocketOptions): Socket {
  const socket = io(WS_URL, {
    auth: {
      token: options.accessToken,
    },
    query: {
      userId: options.userId,
      deviceId: options.deviceId,
    },
    transports: ['websocket'],
  });

  return socket;
}

/**
 * Wait for WebSocket to connect
 */
export async function waitForConnection(socket: Socket, timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('WebSocket connection timeout'));
    }, timeout);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * Wait for a specific WebSocket event
 */
export async function waitForEvent<T = any>(
  socket: Socket,
  eventName: string,
  timeout: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    socket.once(eventName, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/**
 * Send a heartbeat and wait for response
 */
export async function sendHeartbeat(
  socket: Socket,
  data: {
    deviceId: string;
    timestamp: string;
    isWhitelistedApp?: boolean;
  }
): Promise<any> {
  return new Promise((resolve, reject) => {
    socket.emit('heartbeat', data, (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });

    setTimeout(() => {
      reject(new Error('Heartbeat timeout'));
    }, 5000);
  });
}

/**
 * Listen for lockdown command
 */
export async function waitForLockdown(socket: Socket, timeout: number = 10000): Promise<any> {
  return waitForEvent(socket, 'lockdown', timeout);
}

/**
 * Listen for time budget update
 */
export async function waitForBudgetUpdate(socket: Socket, timeout: number = 5000): Promise<any> {
  return waitForEvent(socket, 'budget-update', timeout);
}

/**
 * Listen for parole grant
 */
export async function waitForParoleGrant(socket: Socket, timeout: number = 5000): Promise<any> {
  return waitForEvent(socket, 'parole-granted', timeout);
}

/**
 * Listen for whitelist update
 */
export async function waitForWhitelistUpdate(socket: Socket, timeout: number = 5000): Promise<any> {
  return waitForEvent(socket, 'whitelist-update', timeout);
}

/**
 * Disconnect WebSocket client
 */
export function disconnectWebSocket(socket: Socket): void {
  socket.disconnect();
}

/**
 * Clean up all WebSocket connections in a test
 */
export function cleanupWebSockets(sockets: Socket[]): void {
  sockets.forEach((socket) => {
    if (socket.connected) {
      socket.disconnect();
    }
  });
}
