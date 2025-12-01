import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { DevicesService } from '../../modules/devices/devices.service';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private devicesService: DevicesService
  ) {}

  /**
   * Daily cleanup job - runs at 3 AM UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async dailyCleanup() {
    this.logger.log('Running daily cleanup job...');

    try {
      await this.prisma.cleanupExpiredData();
      this.logger.log('Daily cleanup completed successfully');
    } catch (error) {
      this.logger.error(`Daily cleanup failed: ${error.message}`);
    }
  }

  /**
   * Check for offline devices - runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkOfflineDevices() {
    this.logger.log('Checking for offline devices...');

    try {
      const result = await this.devicesService.checkOfflineDevices();
      this.logger.log(`Found ${result.offlineDevices} offline devices`);
    } catch (error) {
      this.logger.error(`Offline device check failed: ${error.message}`);
    }
  }

  /**
   * Retry failed notifications - runs every 15 minutes
   */
  @Cron(CronExpression.EVERY_15_MINUTES)
  async retryFailedNotifications() {
    this.logger.log('Retrying failed notifications...');

    try {
      await this.notificationsService.retryFailedNotifications();
    } catch (error) {
      this.logger.error(`Notification retry failed: ${error.message}`);
    }
  }

  /**
   * Send monthly reports to wardens - runs on 1st of each month at 9 AM UTC
   */
  @Cron('0 9 1 * *')
  async sendMonthlyReports() {
    this.logger.log('Sending monthly reports to wardens...');

    try {
      // Get all active warden relationships
      const relationships = await this.prisma.wardenRelationship.findMany({
        where: { status: 'active' },
        include: {
          warden: {
            select: { email: true },
          },
          inmate: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      });

      for (const rel of relationships) {
        // TODO: Get usage data for inmate
        // TODO: Send monthly report email
        this.logger.log(`Monthly report sent for inmate ${rel.inmate.email} to warden ${rel.warden.email}`);
      }

      this.logger.log(`Sent ${relationships.length} monthly reports`);
    } catch (error) {
      this.logger.error(`Monthly reports failed: ${error.message}`);
    }
  }

  /**
   * Send "add warden" reminders - runs daily at 10 AM UTC
   */
  @Cron('0 10 * * *')
  async sendWardenReminders() {
    this.logger.log('Sending warden reminders...');

    try {
      // Find users without active wardens
      const usersWithoutWardens = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          wardenRelationshipsAsInmate: {
            none: {
              status: 'active',
            },
          },
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      const now = new Date();

      for (const user of usersWithoutWardens) {
        const daysSinceSignup = Math.floor(
          (now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)
        );

        // Daily reminders for first 7 days
        if (daysSinceSignup <= 7) {
          // TODO: Send daily reminder email
          this.logger.log(`Daily warden reminder sent to ${user.email} (day ${daysSinceSignup})`);
        }
        // Weekly reminders after 7 days
        else if (daysSinceSignup % 7 === 0) {
          // TODO: Send weekly reminder email
          this.logger.log(`Weekly warden reminder sent to ${user.email}`);
        }
      }

      this.logger.log(`Sent warden reminders to ${usersWithoutWardens.length} users`);
    } catch (error) {
      this.logger.error(`Warden reminders failed: ${error.message}`);
    }
  }

  /**
   * Deactivate expired parole grants - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async deactivateExpiredParole() {
    const now = new Date();

    const result = await this.prisma.paroleGrant.updateMany({
      where: {
        isActive: true,
        OR: [
          {
            type: 'minutes',
            expiresAt: {
              lt: now,
            },
          },
          {
            type: 'until',
            validUntil: {
              lt: now,
            },
          },
        ],
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Deactivated ${result.count} expired parole grants`);
    }
  }
}
