import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PushProvider,
  PushNotificationPayload,
  PushSendResult,
} from './push-provider.interface';

/**
 * Console Push Provider
 * Logs push notifications to console instead of sending them
 * Useful for development and testing
 */
@Injectable()
export class ConsoleProvider extends PushProvider {
  private readonly logger = new Logger(ConsoleProvider.name);
  readonly platform = 'console';

  readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    super();

    // Enable console provider in development mode or if explicitly enabled
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const explicitlyEnabled =
      this.configService.get<string>('PUSH_CONSOLE_ENABLED') === 'true';

    this.enabled = nodeEnv === 'development' || explicitlyEnabled;

    if (this.enabled) {
      this.logger.log('Console push provider enabled (development mode)');
    }
  }

  /**
   * Initialize console provider (no-op)
   */
  async initialize(): Promise<void> {
    if (this.enabled) {
      this.logger.log('Console push provider initialized');
    }
  }

  /**
   * Send push notification to console
   */
  async sendToToken(
    token: string,
    payload: PushNotificationPayload
  ): Promise<PushSendResult> {
    if (!this.enabled) {
      return {
        success: false,
        token,
        platform: this.platform,
        error: 'Console provider not enabled',
        shouldDeactivateToken: false,
      };
    }

    // Log to console with nice formatting
    this.logger.log('================================================');
    this.logger.log('PUSH NOTIFICATION (Console Provider)');
    this.logger.log('================================================');
    this.logger.log(`Token: ${token.substring(0, 20)}...`);
    this.logger.log(`Title: ${payload.title}`);
    this.logger.log(`Body: ${payload.body}`);

    if (payload.badge !== undefined) {
      this.logger.log(`Badge: ${payload.badge}`);
    }

    if (payload.sound) {
      this.logger.log(`Sound: ${payload.sound}`);
    }

    if (payload.category) {
      this.logger.log(`Category: ${payload.category}`);
    }

    if (payload.priority) {
      this.logger.log(`Priority: ${payload.priority}`);
    }

    if (payload.data && Object.keys(payload.data).length > 0) {
      this.logger.log(`Data: ${JSON.stringify(payload.data, null, 2)}`);
    }

    this.logger.log('================================================');

    return {
      success: true,
      token,
      platform: this.platform,
    };
  }

  /**
   * Send to multiple tokens (logs each individually)
   */
  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<PushSendResult[]> {
    this.logger.log(
      `Sending push notification to ${tokens.length} device(s) (console)`
    );

    const results = await Promise.all(
      tokens.map((token) => this.sendToToken(token, payload))
    );

    return results;
  }
}
