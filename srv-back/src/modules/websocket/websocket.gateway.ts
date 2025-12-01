import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TimeService } from '../time/time.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HeartbeatSchema } from '@cellblock/contracts';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  // Track connected users and their socket IDs
  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private timeService: TimeService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract JWT from handshake auth
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store userId in socket data
      client.data.userId = userId;
      client.data.deviceId = client.handshake.auth.deviceId;

      // Track connection
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      // Store WebSocket connection ID in session
      await this.prisma.session.updateMany({
        where: { userId },
        data: { websocketConnectionId: client.id },
      });

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);

      // Send initial time status
      const timeStatus = await this.timeService.getTimeStatus(userId);
      client.emit('time_update', timeStatus);
    } catch (error) {
      this.logger.error(`Connection error: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }

      this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (unauthenticated)`);
    }
  }

  /**
   * Handle heartbeat from client
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Validate heartbeat data
      const heartbeat = HeartbeatSchema.parse(data);

      // Process heartbeat and update time budget
      const timeStatus = await this.timeService.processHeartbeat(
        userId,
        heartbeat.deviceId,
        heartbeat
      );

      // Send time update back to client
      client.emit('time_update', timeStatus);

      // If user is locked, send lock command
      if (timeStatus.isLocked && !timeStatus.activeParole) {
        client.emit('lock_command', {
          reason: 'budget_exhausted',
          message: 'Your screen time has expired for today.',
        });

        this.logger.warn(`Lock command sent to user ${userId}`);
      }

      // Check for warnings (15 min and 5 min)
      if (timeStatus.remainingSeconds === 900) {
        this.sendToUser(userId, 'warning', {
          type: '15_minute',
          message: 'You have 15 minutes of screen time left today.',
          remainingSeconds: 900,
        });

        // Send push notification if user is not connected
        this.sendPushIfOffline(userId, {
          title: 'Time Warning',
          body: 'You have 15 minutes of screen time left today.',
          category: 'time_warning',
          priority: 'high',
        });
      } else if (timeStatus.remainingSeconds === 300) {
        this.sendToUser(userId, 'warning', {
          type: '5_minute',
          message: 'Your screen time will expire in 5 minutes.',
          remainingSeconds: 300,
        });

        // Send push notification if user is not connected
        this.sendPushIfOffline(userId, {
          title: 'Time Warning',
          body: 'Your screen time will expire in 5 minutes.',
          category: 'time_warning',
          priority: 'high',
        });
      }
    } catch (error) {
      this.logger.error(`Heartbeat error: ${(error as Error).message}`);
      client.emit('error', { message: 'Failed to process heartbeat' });
    }
  }

  /**
   * Send message to all connected sockets for a user
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send lock command to user (called by warden lockdown)
   */
  sendLockCommand(userId: string, reason: string, message: string) {
    this.sendToUser(userId, 'lock_command', { reason, message });
  }

  /**
   * Send unlock command to user (called by parole grant)
   */
  sendUnlockCommand(userId: string, reason: string, message: string) {
    this.sendToUser(userId, 'unlock_command', { reason, message });
  }

  /**
   * Send configuration update to user
   */
  sendConfigUpdate(userId: string, config: any) {
    this.sendToUser(userId, 'config_update', config);
  }

  /**
   * Send whitelist change notification
   */
  sendWhitelistChange(userId: string, action: 'added' | 'removed', item: any) {
    this.sendToUser(userId, 'whitelist_change', { action, item });
  }

  /**
   * Send push notification if user is not connected via WebSocket
   */
  private async sendPushIfOffline(
    userId: string,
    notification: {
      title: string;
      body: string;
      category?: string;
      priority?: 'high' | 'normal';
    }
  ) {
    // Check if user has any active WebSocket connections
    const isOnline = this.connectedUsers.has(userId);

    if (!isOnline) {
      // User is offline, send push notification
      await this.notificationsService.sendPushNotification({
        userId,
        title: notification.title,
        body: notification.body,
        category: notification.category,
        priority: notification.priority,
      });
    }
  }
}
