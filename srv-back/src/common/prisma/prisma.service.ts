import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  /**
   * Clean up expired data (run via cron jobs)
   */
  async cleanupExpiredData() {
    this.logger.log('Starting cleanup of expired data...');

    // Delete usage logs older than 12 months
    const deletedLogs = await this.usageLog.deleteMany({
      where: {
        createdAt: {
          lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        },
      },
    });
    this.logger.log(`Deleted ${deletedLogs.count} usage logs older than 12 months`);

    // Expire pending requests older than 3 days
    const expiredRequests = await this.request.updateMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'expired',
        updatedAt: new Date(),
      },
    });
    this.logger.log(`Expired ${expiredRequests.count} pending requests`);

    // Delete expired sessions
    const deletedSessions = await this.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    this.logger.log(`Deleted ${deletedSessions.count} expired sessions`);

    // Purge soft-deleted users after 30 days
    const purgedUsers = await this.user.deleteMany({
      where: {
        deletedAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    this.logger.log(`Purged ${purgedUsers.count} soft-deleted users`);

    // Delete sent notifications older than 30 days
    const deletedNotifications = await this.notification.deleteMany({
      where: {
        status: 'sent',
        sentAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    this.logger.log(`Deleted ${deletedNotifications.count} old sent notifications`);

    this.logger.log('Cleanup completed successfully');
  }
}
