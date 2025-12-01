import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider, EmailMessage, EmailSendResult } from './email-provider.interface';

@Injectable()
export class SendGridProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridProvider.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY') || '';
    this.fromEmail =
      this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@cellblock.app';
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const payload = {
        personalizations: [
          {
            to: Array.isArray(message.to)
              ? message.to.map((email) => ({ email }))
              : [{ email: message.to }],
            subject: message.subject,
          },
        ],
        from: {
          email: message.from || this.fromEmail,
        },
        content: [
          {
            type: 'text/html',
            value: message.html,
          },
        ],
      };

      if (message.text) {
        payload.content.unshift({
          type: 'text/plain',
          value: message.text,
        });
      }

      if (message.replyTo) {
        (payload as any)['reply_to'] = { email: message.replyTo };
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`SendGrid API error: ${response.status} - ${errorBody}`);
        return {
          success: false,
          error: `SendGrid API error: ${response.status}`,
        };
      }

      const messageId = response.headers.get('x-message-id') || undefined;

      this.logger.log(
        `Email sent via SendGrid to ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email via SendGrid: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Verify API key by making a simple request to get account details
      const response = await fetch('https://api.sendgrid.com/v3/user/account', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`SendGrid connection verification failed: ${(error as Error).message}`);
      return false;
    }
  }

  getProviderName(): string {
    return 'SendGrid';
  }
}
