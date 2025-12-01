import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, EmailMessage, EmailSendResult } from './email-provider.interface';

/**
 * Console email provider for development/testing
 * Logs emails to console instead of actually sending them
 */
@Injectable()
export class ConsoleEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const recipients = Array.isArray(message.to) ? message.to.join(', ') : message.to;

    this.logger.log('\n' + '='.repeat(80));
    this.logger.log('EMAIL (Console Provider - Development Mode)');
    this.logger.log('='.repeat(80));
    this.logger.log(`To: ${recipients}`);
    this.logger.log(`From: ${message.from || 'noreply@cellblock.app'}`);
    if (message.replyTo) {
      this.logger.log(`Reply-To: ${message.replyTo}`);
    }
    this.logger.log(`Subject: ${message.subject}`);
    this.logger.log('-'.repeat(80));

    if (message.text) {
      this.logger.log('Text Content:');
      this.logger.log(message.text);
      this.logger.log('-'.repeat(80));
    }

    this.logger.log('HTML Content:');
    this.logger.log(message.html.substring(0, 500) + (message.html.length > 500 ? '...' : ''));
    this.logger.log('='.repeat(80) + '\n');

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  async verifyConnection(): Promise<boolean> {
    this.logger.log('Console email provider is active (development mode)');
    return true;
  }

  getProviderName(): string {
    return 'Console (Development)';
  }
}
