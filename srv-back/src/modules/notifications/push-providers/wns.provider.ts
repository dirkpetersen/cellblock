import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PushProvider,
  PushNotificationPayload,
  PushSendResult,
} from './push-provider.interface';
import * as https from 'https';

/**
 * Windows Notification Service (WNS) Provider
 * Uses OAuth 2.0 authentication
 */
@Injectable()
export class WnsProvider extends PushProvider {
  private readonly logger = new Logger(WnsProvider.name);
  readonly platform = 'windows';

  private clientId?: string;
  private clientSecret?: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    super();

    // Check if WNS is enabled (requires client ID and secret)
    const clientId = this.configService.get<string>('WNS_CLIENT_ID');
    const clientSecret = this.configService.get<string>('WNS_CLIENT_SECRET');

    this.enabled = !!(clientId && clientSecret);

    if (this.enabled) {
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.logger.log('WNS provider enabled');
    } else {
      this.logger.warn(
        'WNS provider disabled - missing configuration (WNS_CLIENT_ID or WNS_CLIENT_SECRET)'
      );
    }
  }

  /**
   * Initialize WNS provider by authenticating
   */
  async initialize(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // Authenticate and get access token
      await this.authenticate();
      this.logger.log('WNS provider initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize WNS provider: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Send push notification to a single channel URI
   */
  async sendToToken(
    channelUri: string,
    payload: PushNotificationPayload
  ): Promise<PushSendResult> {
    if (!this.enabled) {
      return {
        success: false,
        token: channelUri,
        platform: this.platform,
        error: 'WNS provider not initialized',
        shouldDeactivateToken: false,
      };
    }

    try {
      // Ensure we have a valid access token
      await this.ensureAccessToken();

      // Build WNS toast notification XML
      const toastXml = this.buildToastXml(payload);

      // Send to WNS
      const response = await this.sendToWns(channelUri, toastXml, 'wns/toast');

      if (response.success) {
        this.logger.debug(
          `Push sent to Windows device: ${channelUri.substring(0, 30)}...`
        );
        return {
          success: true,
          token: channelUri,
          platform: this.platform,
        };
      } else {
        this.logger.warn(
          `Failed to send push to Windows device: ${response.error}`
        );
        return {
          success: false,
          token: channelUri,
          platform: this.platform,
          error: response.error,
          shouldDeactivateToken: response.shouldDeactivateToken,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error sending push to Windows device: ${(error as Error).message}`
      );
      return {
        success: false,
        token: channelUri,
        platform: this.platform,
        error: (error as Error).message,
        shouldDeactivateToken: false,
      };
    }
  }

  /**
   * Send to multiple channel URIs
   */
  async sendToTokens(
    channelUris: string[],
    payload: PushNotificationPayload
  ): Promise<PushSendResult[]> {
    // Ensure access token before batch
    await this.ensureAccessToken();
    const toastXml = this.buildToastXml(payload);

    const results = await Promise.allSettled(
      channelUris.map((channelUri) => this.sendToWns(channelUri, toastXml, 'wns/toast'))
    );

    return results.map((result, index) => {
      const channelUri = channelUris[index];
      if (result.status === 'fulfilled') {
        return {
          success: result.value.success,
          token: channelUri,
          platform: this.platform,
          error: result.value.error,
          shouldDeactivateToken: result.value.shouldDeactivateToken,
        };
      } else {
        return {
          success: false,
          token: channelUri,
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
   * Authenticate with WNS OAuth 2.0
   */
  private async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      const postData = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        scope: 'notify.windows.com',
      }).toString();

      const options: https.RequestOptions = {
        hostname: 'login.microsoftonline.com',
        path: '/common/oauth2/v2.0/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(responseBody);

            if (data.access_token) {
              this.accessToken = data.access_token;
              // Token expires in seconds, cache it
              this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Refresh 1 min early
              resolve(data.access_token);
            } else {
              reject(new Error('No access token in response'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse WNS auth response: ${(error as Error).message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`WNS authentication failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAccessToken(): Promise<void> {
    // Check if token is expired or will expire soon
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  /**
   * Build WNS toast notification XML
   */
  private buildToastXml(payload: PushNotificationPayload): string {
    // Build toast notification in WNS XML format
    const titleEscaped = this.escapeXml(payload.title);
    const bodyEscaped = this.escapeXml(payload.body);

    let xml = `<?xml version="1.0" encoding="utf-8"?>`;
    xml += `<toast>`;
    xml += `<visual>`;
    xml += `<binding template="ToastText02">`;
    xml += `<text id="1">${titleEscaped}</text>`;
    xml += `<text id="2">${bodyEscaped}</text>`;
    xml += `</binding>`;
    xml += `</visual>`;

    // Add audio if specified
    if (payload.sound) {
      xml += `<audio src="ms-winsoundevent:Notification.Default"/>`;
    }

    xml += `</toast>`;

    return xml;
  }

  /**
   * Build WNS badge notification XML
   */
  private buildBadgeXml(badge: number): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<badge value="${badge}"/>`;
  }

  /**
   * Send notification to WNS
   */
  private sendToWns(
    channelUri: string,
    content: string,
    notificationType: 'wns/toast' | 'wns/badge' | 'wns/tile'
  ): Promise<{ success: boolean; error?: string; shouldDeactivateToken?: boolean }> {
    return new Promise((resolve) => {
      const url = new URL(channelUri);

      const options: https.RequestOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(content),
          'Authorization': `Bearer ${this.accessToken}`,
          'X-WNS-Type': notificationType,
        },
      };

      const req = https.request(options, (res) => {
        const statusCode = res.statusCode || 500;
        const notificationStatus = res.headers['x-wns-notificationstatus'];
        const deviceConnectionStatus = res.headers['x-wns-deviceconnectionstatus'];

        if (statusCode === 200) {
          resolve({ success: true });
        } else {
          let shouldDeactivate = false;
          let errorMsg = `WNS error (${statusCode})`;

          // Check if channel URI is expired or invalid
          if (
            statusCode === 404 ||
            statusCode === 410 ||
            notificationStatus === 'dropped' ||
            deviceConnectionStatus === 'disconnected'
          ) {
            shouldDeactivate = true;
            errorMsg = 'Channel URI expired or invalid';
          } else if (statusCode === 401 || statusCode === 403) {
            errorMsg = 'WNS authentication error';
            // Try to refresh token for next attempt
            this.accessToken = null;
            this.tokenExpiry = 0;
          }

          resolve({
            success: false,
            error: errorMsg,
            shouldDeactivateToken: shouldDeactivate,
          });
        }
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request failed: ${error.message}`,
          shouldDeactivateToken: false,
        });
      });

      req.write(content);
      req.end();
    });
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Send badge notification (update app icon badge)
   */
  async sendBadge(channelUri: string, badge: number): Promise<PushSendResult> {
    if (!this.enabled) {
      return {
        success: false,
        token: channelUri,
        platform: this.platform,
        error: 'WNS provider not initialized',
        shouldDeactivateToken: false,
      };
    }

    try {
      await this.ensureAccessToken();
      const badgeXml = this.buildBadgeXml(badge);
      const response = await this.sendToWns(channelUri, badgeXml, 'wns/badge');

      return {
        success: response.success,
        token: channelUri,
        platform: this.platform,
        error: response.error,
        shouldDeactivateToken: response.shouldDeactivateToken,
      };
    } catch (error) {
      return {
        success: false,
        token: channelUri,
        platform: this.platform,
        error: (error as Error).message,
        shouldDeactivateToken: false,
      };
    }
  }
}
