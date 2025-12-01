import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushProvider, PushNotificationPayload, PushSendResult } from './push-provider.interface';
import * as jwt from 'jsonwebtoken';
import * as https from 'https';
import * as fs from 'fs';

/**
 * Apple Push Notification Service (APNs) Provider
 * Uses JWT-based authentication with .p8 key file
 */
@Injectable()
export class ApnsProvider extends PushProvider {
  private readonly logger = new Logger(ApnsProvider.name);
  readonly platform = 'ios';

  private keyId?: string;
  private teamId?: string;
  private topic?: string;
  private authKey?: string;
  private production: boolean = false;
  private apnsHost: string = 'api.sandbox.push.apple.com';
  private tokenCache: string | null = null;
  private tokenExpiry: number = 0;

  readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    super();

    // Check if APNs is enabled (requires key ID, team ID, and topic)
    const keyId = this.configService.get<string>('APNS_KEY_ID');
    const teamId = this.configService.get<string>('APNS_TEAM_ID');
    const topic = this.configService.get<string>('APNS_TOPIC');

    this.enabled = !!(keyId && teamId && topic);

    if (this.enabled) {
      this.keyId = keyId;
      this.teamId = teamId;
      this.topic = topic;
      this.production = this.configService.get<string>('APNS_PRODUCTION') === 'true';
      this.apnsHost = this.production ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';

      this.logger.log(`APNs provider enabled (${this.production ? 'production' : 'sandbox'})`);
    } else {
      this.logger.warn(
        'APNs provider disabled - missing configuration (APNS_KEY_ID, APNS_TEAM_ID, or APNS_TOPIC)'
      );
    }
  }

  /**
   * Initialize APNs provider by loading the .p8 key file
   */
  async initialize(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Try multiple possible locations for the .p8 key file
      const keyPaths = [
        this.configService.get<string>('APNS_KEY_PATH'),
        `/app/keys/apns-key.p8`,
        `/app/keys/AuthKey_${this.keyId}.p8`,
        `./keys/apns-key.p8`,
        `./keys/AuthKey_${this.keyId}.p8`,
      ].filter(Boolean) as string[];

      let keyLoaded = false;

      for (const keyPath of keyPaths) {
        if (fs.existsSync(keyPath)) {
          this.authKey = fs.readFileSync(keyPath, 'utf8');
          this.logger.log(`APNs key loaded from: ${keyPath}`);
          keyLoaded = true;
          break;
        }
      }

      if (!keyLoaded) {
        this.logger.error(`APNs key file not found. Tried: ${keyPaths.join(', ')}`);
        throw new Error('APNs key file not found');
      }

      // Test JWT generation
      this.generateToken();
      this.logger.log('APNs provider initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize APNs provider: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Send push notification to a single device token
   */
  async sendToToken(token: string, payload: PushNotificationPayload): Promise<PushSendResult> {
    if (!this.enabled || !this.authKey) {
      return {
        success: false,
        token,
        platform: this.platform,
        error: 'APNs provider not initialized',
        shouldDeactivateToken: false,
      };
    }

    try {
      // Generate JWT token (reuse if not expired)
      const authToken = this.generateToken();

      // Build APNs payload
      const apnsPayload = this.buildApnsPayload(payload);

      // Send to APNs
      const response = await this.sendToApns(token, apnsPayload, authToken);

      if (response.success) {
        this.logger.debug(`Push sent to iOS device: ${token.substring(0, 8)}...`);
        return {
          success: true,
          token,
          platform: this.platform,
        };
      } else {
        this.logger.warn(`Failed to send push to iOS device: ${response.error}`);
        return {
          success: false,
          token,
          platform: this.platform,
          error: response.error,
          shouldDeactivateToken: response.shouldDeactivateToken,
        };
      }
    } catch (error) {
      this.logger.error(`Error sending push to iOS device: ${(error as Error).message}`);
      return {
        success: false,
        token,
        platform: this.platform,
        error: (error as Error).message,
        shouldDeactivateToken: false,
      };
    }
  }

  /**
   * Send to multiple tokens (batch send)
   */
  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<PushSendResult[]> {
    // APNs doesn't have a true batch API, so we send individually
    // But we can optimize by reusing the JWT token and sending in parallel
    const authToken = this.generateToken();
    const apnsPayload = this.buildApnsPayload(payload);

    const results = await Promise.allSettled(
      tokens.map((token) => this.sendToApns(token, apnsPayload, authToken))
    );

    return results.map((result, index) => {
      const token = tokens[index];
      if (result.status === 'fulfilled') {
        return {
          success: result.value.success,
          token,
          platform: this.platform,
          error: result.value.error,
          shouldDeactivateToken: result.value.shouldDeactivateToken,
        };
      } else {
        return {
          success: false,
          token,
          platform: this.platform,
          error: result.reason?.message || 'Unknown error',
          shouldDeactivateToken: false,
        };
      }
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate JWT token for APNs authentication
   */
  private generateToken(): string {
    // Reuse token if not expired (tokens are valid for 1 hour)
    const now = Math.floor(Date.now() / 1000);
    if (this.tokenCache && this.tokenExpiry > now + 300) {
      // Reuse if more than 5 minutes left
      return this.tokenCache;
    }

    const issuedAt = now;
    const expiresAt = now + 3600; // 1 hour

    const token = jwt.sign(
      {
        iss: this.teamId,
        iat: issuedAt,
      },
      this.authKey!,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: this.keyId,
        },
      }
    );

    this.tokenCache = token;
    this.tokenExpiry = expiresAt;

    return token;
  }

  /**
   * Build APNs payload from generic push notification payload
   */
  private buildApnsPayload(payload: PushNotificationPayload): any {
    return {
      aps: {
        alert: {
          title: payload.title,
          body: payload.body,
        },
        badge: payload.badge,
        sound: payload.sound || 'default',
        category: payload.category,
        'content-available': 1,
      },
      // Custom data
      ...(payload.data || {}),
    };
  }

  /**
   * Send notification to APNs HTTP/2 API
   */
  private sendToApns(
    deviceToken: string,
    payload: any,
    authToken: string
  ): Promise<{ success: boolean; error?: string; shouldDeactivateToken?: boolean }> {
    return new Promise((resolve) => {
      const payloadString = JSON.stringify(payload);

      const options: https.RequestOptions = {
        hostname: this.apnsHost,
        port: 443,
        path: `/3/device/${deviceToken}`,
        method: 'POST',
        headers: {
          authorization: `bearer ${authToken}`,
          'apns-topic': this.topic,
          'apns-push-type': 'alert',
          'apns-priority': payload.priority === 'high' ? '10' : '5',
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(payloadString),
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true });
          } else {
            let errorReason = 'Unknown error';
            let shouldDeactivate = false;

            try {
              const errorData = JSON.parse(responseBody);
              errorReason = errorData.reason || errorReason;

              // Check if token should be deactivated
              if (
                errorReason === 'BadDeviceToken' ||
                errorReason === 'Unregistered' ||
                errorReason === 'DeviceTokenNotForTopic'
              ) {
                shouldDeactivate = true;
              }
            } catch (e) {
              // Ignore JSON parse errors
            }

            resolve({
              success: false,
              error: `APNs error: ${errorReason} (${res.statusCode})`,
              shouldDeactivateToken: shouldDeactivate,
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request failed: ${error.message}`,
          shouldDeactivateToken: false,
        });
      });

      req.write(payloadString);
      req.end();
    });
  }
}
