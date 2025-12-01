/**
 * Push notification provider interface
 * Defines the contract for all push notification providers (APNs, WNS, etc.)
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  category?: string;
  priority?: 'high' | 'normal';
}

export interface PushSendResult {
  success: boolean;
  token: string;
  platform: string;
  error?: string;
  shouldDeactivateToken?: boolean; // True if token is expired/invalid
}

export interface PushProviderConfig {
  enabled: boolean;
}

export abstract class PushProvider {
  abstract readonly platform: string;
  abstract readonly enabled: boolean;

  /**
   * Send push notification to a single device token
   */
  abstract sendToToken(
    token: string,
    payload: PushNotificationPayload
  ): Promise<PushSendResult>;

  /**
   * Send push notification to multiple device tokens
   */
  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<PushSendResult[]> {
    // Default implementation: send individually
    const results = await Promise.allSettled(
      tokens.map((token) => this.sendToToken(token, payload))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          token: tokens[index],
          platform: this.platform,
          error: result.reason?.message || 'Unknown error',
          shouldDeactivateToken: false,
        };
      }
    });
  }

  /**
   * Initialize the provider (e.g., authenticate, load credentials)
   */
  abstract initialize(): Promise<void>;
}
