import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

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
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

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

    // TODO: Implement actual email sending with SendGrid/AWS SES
    // For now, just mark as sent
    await this.markNotificationSent(notification.id);

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
      return;
    }

    // Queue push notifications
    for (const token of tokens) {
      await this.prisma.notification.create({
        data: {
          userId: pushData.userId,
          type: 'push',
          channel: token.platform,
          recipient: token.token,
          subject: pushData.title,
          body: pushData.body,
          data: pushData.data,
          status: 'pending',
        },
      });
    }

    this.logger.log(`Push notifications queued for ${tokens.length} devices (user: ${pushData.userId})`);

    // TODO: Implement actual push notification sending (APNs, WNS)
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    const html = this.getEmailTemplate('verification', {
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

    const html = this.getEmailTemplate('password-reset', {
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

    const html = this.getEmailTemplate('warden-invitation', {
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
  async sendBreakGlassNotification(wardenEmails: string[], inmateName: string, comment?: string) {
    for (const email of wardenEmails) {
      const html = this.getEmailTemplate('break-glass', {
        inmateName,
        comment: comment || 'No reason provided',
      });

      await this.sendEmail({
        to: email,
        subject: `🚨 ${inmateName} has activated Break Glass`,
        html,
      });
    }
  }

  /**
   * Send monthly usage report to warden
   */
  async sendMonthlyReport(wardenEmail: string, inmateName: string, usageData: any) {
    const dashboardUrl = this.configService.get('FRONTEND_URL');

    const html = this.getEmailTemplate('monthly-report', {
      inmateName,
      usageData,
      dashboardUrl,
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
            failedReason: error.message,
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
   * Get email template HTML
   */
  private getEmailTemplate(template: string, data: any): string {
    // TODO: Implement proper email templates with HTML
    // For now, return simple HTML

    const baseStyles = `
      <style>
        body { font-family: Inter, sans-serif; line-height: 1.6; color: #27272A; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0D9488; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #FAFAFA; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #0D9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .footer { text-align: center; margin-top: 20px; color: #71717A; font-size: 14px; }
      </style>
    `;

    switch (template) {
      case 'verification':
        return `
          ${baseStyles}
          <div class="container">
            <div class="header"><h1>Verify Your Email</h1></div>
            <div class="content">
              <p>Welcome to CellBlock! Please verify your email address to complete registration.</p>
              <p><a href="${data.verifyUrl}" class="button">Verify Email</a></p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div class="footer">CellBlock - Digital Wellbeing with Accountability</div>
          </div>
        `;

      case 'warden-invitation':
        return `
          ${baseStyles}
          <div class="container">
            <div class="header"><h1>Warden Invitation</h1></div>
            <div class="content">
              <p><strong>${data.inmateName}</strong> has invited you to be their CellBlock Warden.</p>
              <p>As a Warden, you'll help them stay accountable by approving changes to their time budget and whitelist.</p>
              <p>
                <a href="${data.acceptUrl}" class="button">Accept Invitation</a>
                <a href="${data.declineUrl}" class="button" style="background: #6B7280;">Decline</a>
              </p>
            </div>
            <div class="footer">CellBlock - Digital Wellbeing with Accountability</div>
          </div>
        `;

      case 'break-glass':
        return `
          ${baseStyles}
          <div class="container">
            <div class="header" style="background: #F43F5E;"><h1>🚨 Break Glass Activated</h1></div>
            <div class="content">
              <p><strong>${data.inmateName}</strong> has activated Break Glass and is no longer under your supervision.</p>
              <p><strong>Reason:</strong> ${data.comment}</p>
              <p>Your warden relationship has been terminated. They can re-invite you if needed.</p>
            </div>
            <div class="footer">CellBlock - Digital Wellbeing with Accountability</div>
          </div>
        `;

      default:
        return `<html><body><p>${data.message || 'Notification from CellBlock'}</p></body></html>`;
    }
  }

  /**
   * Mark notification as sent
   */
  private async markNotificationSent(notificationId: string) {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

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
