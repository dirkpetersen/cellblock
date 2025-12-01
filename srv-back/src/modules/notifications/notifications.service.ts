import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApnsProvider } from './push-providers/apns.provider';
import { WnsProvider } from './push-providers/wns.provider';
import { ConsoleProvider } from './push-providers/console.provider';
import { PushProvider, PushNotificationPayload } from './push-providers';
import { IEmailProvider } from './email-providers/email-provider.interface';
import { SendGridProvider } from './email-providers/sendgrid.provider';
import { AwsSesProvider } from './email-providers/aws-ses.provider';
import { ConsoleEmailProvider } from './email-providers/console.provider';
import { EmailTemplateService } from './email-template.service';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  category?: string;
  priority?: 'high' | 'normal';
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private pushProviders: Map<string, PushProvider> = new Map();
  private emailProvider!: IEmailProvider;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private apnsProvider: ApnsProvider,
    private wnsProvider: WnsProvider,
    private consoleProvider: ConsoleProvider,
    private emailTemplateService: EmailTemplateService
  ) {}

  /**
   * Initialize providers on module init
   */
  async onModuleInit() {
    // Initialize email provider
    await this.initializeEmailProvider();

    // Initialize push providers
    this.logger.log('Initializing push notification providers...');

    const providers = [this.apnsProvider, this.wnsProvider, this.consoleProvider];

    for (const provider of providers) {
      if (provider.enabled) {
        try {
          await provider.initialize();
          this.pushProviders.set(provider.platform, provider);
          this.logger.log(`${provider.platform} push provider registered`);
        } catch (error) {
          this.logger.error(
            `Failed to initialize ${provider.platform} provider: ${(error as Error).message}`
          );
        }
      }
    }

    this.logger.log(
      `Push notification service initialized with ${this.pushProviders.size} provider(s)`
    );
  }

  /**
   * Initialize email provider based on environment configuration
   */
  private async initializeEmailProvider() {
    const nodeEnv = this.configService.get('NODE_ENV');
    const sendgridKey = this.configService.get('SENDGRID_API_KEY');
    const awsAccessKey = this.configService.get('AWS_ACCESS_KEY_ID');

    // Auto-detect provider based on environment variables
    if (nodeEnv === 'development' || nodeEnv === 'test') {
      // Use console provider in development/test
      this.emailProvider = new ConsoleEmailProvider();
      this.logger.log('Email provider: Console (Development)');
    } else if (sendgridKey) {
      // Prefer SendGrid if configured
      this.emailProvider = new SendGridProvider(this.configService);
      const verified = await this.emailProvider.verifyConnection();
      if (verified) {
        this.logger.log('Email provider: SendGrid (verified)');
      } else {
        this.logger.warn('SendGrid verification failed, falling back to Console provider');
        this.emailProvider = new ConsoleEmailProvider();
      }
    } else if (awsAccessKey) {
      // Use AWS SES if configured
      this.emailProvider = new AwsSesProvider(this.configService);
      const verified = await this.emailProvider.verifyConnection();
      if (verified) {
        this.logger.log('Email provider: AWS SES (verified)');
      } else {
        this.logger.warn('AWS SES verification failed, falling back to Console provider');
        this.emailProvider = new ConsoleEmailProvider();
      }
    } else {
      // Fallback to console provider
      this.emailProvider = new ConsoleEmailProvider();
      this.logger.log('Email provider: Console (no email service configured)');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(emailData: EmailData) {
    // Queue email in database
    const notification = await this.prisma.notification.create({
      data: {
        userId: (await this.getUserIdByEmail(emailData.to)) || 'system',
        type: 'email',
        channel: 'email',
        recipient: emailData.to,
        subject: emailData.subject,
        body: emailData.html,
        status: 'pending',
      },
    });

    this.logger.log(`Email queued: ${notification.id} to ${emailData.to}`);

    // Send email via provider
    try {
      const result = await this.emailProvider.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
      });

      if (result.success) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });
        this.logger.log(`Email sent successfully: ${notification.id}`);
      } else {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            failedReason: result.error,
            retryCount: 0,
          },
        });
        this.logger.error(`Email failed to send: ${notification.id} - ${result.error}`);
      }
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          failedReason: (error as Error).message,
          retryCount: 0,
        },
      });
      this.logger.error(`Email exception: ${notification.id} - ${(error as Error).message}`);
    }

    return notification;
  }

  /**
   * Send push notification to user's devices
   */
  async sendPushNotification(pushData: PushNotificationData) {
    // Get all active push tokens for user
    const tokens = await this.prisma.pushToken.findMany({
      where: {
        userId: pushData.userId,
        isActive: true,
      },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No push tokens found for user ${pushData.userId}`);
      return { sent: 0, failed: 0 };
    }

    this.logger.log(
      `Sending push notifications to ${tokens.length} device(s) for user ${pushData.userId}`
    );

    // Group tokens by platform
    const tokensByPlatform = new Map<string, { token: string; tokenId: string }[]>();

    for (const tokenRecord of tokens) {
      if (!tokensByPlatform.has(tokenRecord.platform)) {
        tokensByPlatform.set(tokenRecord.platform, []);
      }
      tokensByPlatform.get(tokenRecord.platform)!.push({
        token: tokenRecord.token,
        tokenId: tokenRecord.id,
      });
    }

    // Build push payload
    const payload: PushNotificationPayload = {
      title: pushData.title,
      body: pushData.body,
      data: pushData.data,
      badge: pushData.badge,
      sound: pushData.sound,
      category: pushData.category,
      priority: pushData.priority || 'high',
    };

    let totalSent = 0;
    let totalFailed = 0;
    const tokensToDeactivate: string[] = [];

    // Send to each platform
    for (const [platform, platformTokens] of tokensByPlatform.entries()) {
      const provider = this.pushProviders.get(platform);

      if (!provider) {
        this.logger.warn(`No push provider available for platform: ${platform}`);
        totalFailed += platformTokens.length;
        continue;
      }

      try {
        // Send to all tokens for this platform
        const results = await provider.sendToTokens(
          platformTokens.map((t) => t.token),
          payload
        );

        // Process results
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const tokenRecord = platformTokens[i];

          if (result.success) {
            totalSent++;

            // Log successful notification
            await this.prisma.notification.create({
              data: {
                userId: pushData.userId,
                type: 'push',
                channel: platform,
                recipient: tokenRecord.token,
                subject: pushData.title,
                body: pushData.body,
                data: pushData.data,
                status: 'sent',
                sentAt: new Date(),
              },
            }).catch((err) => {
              this.logger.error(`Failed to log notification: ${err.message}`);
            });
          } else {
            totalFailed++;

            // Log failed notification
            await this.prisma.notification.create({
              data: {
                userId: pushData.userId,
                type: 'push',
                channel: platform,
                recipient: tokenRecord.token,
                subject: pushData.title,
                body: pushData.body,
                data: pushData.data,
                status: 'failed',
                failedReason: result.error,
                retryCount: 0,
              },
            }).catch((err) => {
              this.logger.error(`Failed to log notification: ${err.message}`);
            });

            // Mark token for deactivation if expired
            if (result.shouldDeactivateToken) {
              tokensToDeactivate.push(tokenRecord.tokenId);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error sending push to ${platform}: ${(error as Error).message}`
        );
        totalFailed += platformTokens.length;
      }
    }

    // Deactivate expired tokens
    if (tokensToDeactivate.length > 0) {
      await this.prisma.pushToken.updateMany({
        where: { id: { in: tokensToDeactivate } },
        data: { isActive: false },
      });

      this.logger.log(
        `Deactivated ${tokensToDeactivate.length} expired push token(s)`
      );
    }

    this.logger.log(
      `Push notifications sent: ${totalSent} succeeded, ${totalFailed} failed (user: ${pushData.userId})`
    );

    return { sent: totalSent, failed: totalFailed };
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    const html = await this.emailTemplateService.renderTemplate('verification', {
      verifyUrl,
    });

    return this.sendEmail({
      to: email,
      subject: 'Verify your CellBlock email',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    const html = await this.emailTemplateService.renderTemplate('password-reset', {
      resetUrl,
    });

    return this.sendEmail({
      to: email,
      subject: 'Reset your CellBlock password',
      html,
    });
  }

  /**
   * Send warden invitation email
   */
  async sendWardenInvitation(email: string, inmateName: string, token: string) {
    const acceptUrl = `${this.configService.get('FRONTEND_URL')}/warden/accept?token=${token}`;
    const declineUrl = `${this.configService.get('FRONTEND_URL')}/warden/decline?token=${token}`;

    const html = await this.emailTemplateService.renderTemplate('warden-invitation', {
      inmateName,
      acceptUrl,
      declineUrl,
    });

    return this.sendEmail({
      to: email,
      subject: `${inmateName} invited you to be their CellBlock Warden`,
      html,
    });
  }

  /**
   * Send break glass notification to wardens
   */
  async sendBreakGlassNotification(
    wardenEmails: string[],
    inmateName: string,
    comment?: string
  ) {
    const html = await this.emailTemplateService.renderTemplate('break-glass', {
      inmateName,
      comment: comment || 'No reason provided',
    });

    // Send email to all wardens
    for (const email of wardenEmails) {
      await this.sendEmail({
        to: email,
        subject: `Break Glass Alert: ${inmateName}`,
        html,
      });
    }

    // Send push notifications to all wardens
    for (const email of wardenEmails) {
      const wardenUserId = await this.getUserIdByEmail(email);
      if (wardenUserId) {
        await this.sendPushNotification({
          userId: wardenUserId,
          title: 'Break Glass Alert',
          body: `${inmateName} has activated Break Glass. ${comment || 'No reason provided'}`,
          category: 'break_glass',
          priority: 'high',
        });
      }
    }
  }

  /**
   * Send monthly usage report to warden
   */
  async sendMonthlyReport(wardenEmail: string, inmateName: string, usageData: any) {
    const html = await this.emailTemplateService.renderTemplate('monthly-report', {
      inmateName,
      ...usageData,
    });

    return this.sendEmail({
      to: wardenEmail,
      subject: `Monthly Report: ${inmateName}'s CellBlock usage`,
      html,
    });
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    const failedNotifications = await this.prisma.notification.findMany({
      where: {
        status: 'failed',
        retryCount: {
          lt: 3, // Max 3 retries
        },
      },
      take: 100,
    });

    this.logger.log(`Retrying ${failedNotifications.length} failed notifications`);

    for (const notification of failedNotifications) {
      try {
        // TODO: Implement actual retry logic based on channel
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            retryCount: notification.retryCount + 1,
          },
        });
      } catch (error) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: 'failed',
            failedReason: (error as Error).message,
            retryCount: notification.retryCount + 1,
          },
        });
      }
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get user ID by email
   */
  private async getUserIdByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return user?.id || null;
  }
}
