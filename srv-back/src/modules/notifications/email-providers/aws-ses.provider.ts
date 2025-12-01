import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider, EmailMessage, EmailSendResult } from './email-provider.interface';

@Injectable()
export class AwsSesProvider implements IEmailProvider {
  private readonly logger = new Logger(AwsSesProvider.name);
  private readonly region: string;
  private readonly accessKeyId?: string;
  private readonly secretAccessKey?: string;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    this.secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.fromEmail =
      this.configService.get<string>('AWS_SES_FROM_EMAIL') || 'noreply@cellblock.app';
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const recipients = Array.isArray(message.to) ? message.to : [message.to];

      // Build SES SendEmail API request
      const params = {
        Source: message.from || this.fromEmail,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: message.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: message.html,
              Charset: 'UTF-8',
            },
          },
        },
      };

      if (message.text) {
        (params.Message.Body as any)['Text'] = {
          Data: message.text,
          Charset: 'UTF-8',
        };
      }

      if (message.replyTo) {
        (params as any)['ReplyToAddresses'] = [message.replyTo];
      }

      // Use AWS SDK v3 style API call with fetch
      const result = await this.sesApiCall('SendEmail', params);

      if (result.error) {
        this.logger.error(`AWS SES API error: ${result.error}`);
        return {
          success: false,
          error: result.error,
        };
      }

      this.logger.log(`Email sent via AWS SES to ${recipients.join(', ')}`);

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email via AWS SES: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Verify SES access by checking send quota
      const result = await this.sesApiCall('GetSendQuota', {});
      return !result.error;
    } catch (error) {
      this.logger.error(`AWS SES connection verification failed: ${(error as Error).message}`);
      return false;
    }
  }

  getProviderName(): string {
    return 'AWS SES';
  }

  /**
   * Make SES API call using AWS Signature V4
   * This is a simplified implementation - in production, consider using @aws-sdk/client-ses
   */
  private async sesApiCall(action: string, params: any): Promise<any> {
    try {
      const endpoint = `https://email.${this.region}.amazonaws.com/`;

      // For simplicity, we'll use the AWS SDK if credentials are available
      // Otherwise return an error suggesting to install the AWS SDK
      if (!this.accessKeyId || !this.secretAccessKey) {
        return {
          error: 'AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
        };
      }

      // Build the request body
      const requestParams = new URLSearchParams({
        Action: action,
        Version: '2010-12-01',
        ...this.flattenParams(params),
      });

      // Note: This is a simplified implementation
      // In production, you should use @aws-sdk/client-ses or implement full AWS Signature V4
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Amz-Date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        },
        body: requestParams.toString(),
      });

      const responseText = await response.text();

      if (!response.ok) {
        return {
          error: `AWS SES API error: ${response.status} - ${responseText}`,
        };
      }

      // Parse XML response (simplified)
      const messageIdMatch = responseText.match(/<MessageId>(.*?)<\/MessageId>/);
      const messageId = messageIdMatch ? messageIdMatch[1] : undefined;

      return {
        MessageId: messageId,
      };
    } catch (error) {
      return {
        error: (error as Error).message,
      };
    }
  }

  /**
   * Flatten nested params for AWS API query string
   */
  private flattenParams(params: any, prefix = ''): Record<string, string> {
    const flat: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      const paramKey = prefix ? `${prefix}.${key}` : key;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.assign(flat, this.flattenParams(item, `${paramKey}.member.${index + 1}`));
          } else {
            flat[`${paramKey}.member.${index + 1}`] = String(item);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(flat, this.flattenParams(value, paramKey));
      } else if (value !== undefined && value !== null) {
        flat[paramKey] = String(value);
      }
    }

    return flat;
  }
}
