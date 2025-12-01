# Push Notifications System

Complete push notification implementation for CellBlock with support for iOS (APNs) and Windows (WNS).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Push Providers](#push-providers)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Notification Types](#notification-types)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The push notification system allows CellBlock to send real-time alerts to users' devices even when the app is not actively running. This is crucial for:

- Time warnings (15 min, 5 min remaining)
- Lockdown notifications
- Parole grants
- Warden request responses
- Break glass alerts
- Configuration changes

## Architecture

```
┌─────────────────────┐
│ NotificationsService│
└──────────┬──────────┘
           │
           ├──► ApnsProvider (iOS)
           ├──► WnsProvider (Windows)
           └──► ConsoleProvider (Dev)
                      │
                      ▼
              ┌───────────────┐
              │ Push Tokens DB│
              └───────────────┘
```

### Key Components

1. **NotificationsService** - Main service that orchestrates push notifications
2. **Push Providers** - Platform-specific implementations (APNs, WNS, Console)
3. **DevicesService** - Manages push token registration and cleanup
4. **WebSocketGateway** - Sends push notifications when users are offline
5. **WardenService** - Sends notifications for warden actions

## Push Providers

### 1. APNs Provider (iOS)

**Features:**
- JWT-based authentication using .p8 key file
- Automatic token caching and refresh
- Batch notification support
- Automatic token expiration handling
- Support for badge, sound, and categories
- Production and sandbox mode

**Configuration:**
```env
APNS_KEY_ID=ABC123XYZ
APNS_TEAM_ID=DEF456UVW
APNS_TOPIC=com.cellblock.app
APNS_KEY_PATH=/app/keys/apns-key.p8
APNS_PRODUCTION=false
```

**Setup Steps:**
1. Create an APNs key in Apple Developer Portal
2. Download the .p8 key file
3. Place it in `/app/keys/` or specify custom path
4. Configure environment variables
5. Restart server

**Token Format:**
- 64-character hex string (e.g., `abcd1234...`)

### 2. WNS Provider (Windows)

**Features:**
- OAuth 2.0 authentication
- Access token caching
- Toast and badge notifications
- XML payload formatting
- Channel URI validation
- Automatic expired URI cleanup

**Configuration:**
```env
WNS_CLIENT_ID=ms-app://s-1-15-2-...
WNS_CLIENT_SECRET=your-secret-key
```

**Setup Steps:**
1. Register app in Windows Dev Center
2. Get Package SID (Client ID)
3. Generate client secret
4. Configure environment variables
5. Restart server

**Token Format:**
- Full channel URI (e.g., `https://notify.windows.com/...`)

### 3. Console Provider (Development)

**Features:**
- Logs notifications to console instead of sending
- Enabled automatically in development mode
- No configuration required
- Great for testing notification logic

**Configuration:**
```env
PUSH_CONSOLE_ENABLED=true
NODE_ENV=development
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# Enable console provider (for dev/testing)
PUSH_CONSOLE_ENABLED=false

# APNs (iOS)
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_TOPIC=com.cellblock.app
APNS_KEY_PATH=/app/keys/apns-key.p8
APNS_PRODUCTION=false

# WNS (Windows)
WNS_CLIENT_ID=your-wns-package-sid
WNS_CLIENT_SECRET=your-wns-client-secret
```

### APNs Key File Location

The APNs provider will search for the .p8 key file in these locations (in order):

1. Path specified in `APNS_KEY_PATH`
2. `/app/keys/apns-key.p8`
3. `/app/keys/AuthKey_{APNS_KEY_ID}.p8`
4. `./keys/apns-key.p8`
5. `./keys/AuthKey_{APNS_KEY_ID}.p8`

## API Endpoints

### Register Push Token

```http
POST /devices/:deviceId/push-token
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "platform": "ios",
  "token": "device-token-here"
}
```

**Platform values:**
- `ios` - For APNs (iOS devices)
- `windows` - For WNS (Windows devices)
- `console` - For console provider (testing)

**Response:**
```json
{
  "id": "token-uuid",
  "userId": "user-uuid",
  "deviceId": "device-uuid",
  "platform": "ios",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

### Remove Push Token

```http
DELETE /devices/:deviceId/push-token/:platform
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Push token removed successfully"
}
```

### Get Device Push Tokens

```http
GET /devices/:deviceId/push-tokens
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": "token-uuid",
    "platform": "ios",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

## Notification Types

### 1. Time Warnings

Sent when user's screen time is running low.

**15-minute warning:**
```json
{
  "title": "Time Warning",
  "body": "You have 15 minutes of screen time left today.",
  "category": "time_warning",
  "priority": "high"
}
```

**5-minute warning:**
```json
{
  "title": "Time Warning",
  "body": "Your screen time will expire in 5 minutes.",
  "category": "time_warning",
  "priority": "high"
}
```

### 2. Warden Requests

**Request Approved:**
```json
{
  "title": "Request Approved",
  "body": "Your request has been approved by your warden.",
  "category": "warden_request",
  "priority": "high"
}
```

**Request Denied:**
```json
{
  "title": "Request Denied",
  "body": "Your request was denied. <reason>",
  "category": "warden_request",
  "priority": "high"
}
```

### 3. Parole Granted

```json
{
  "title": "Parole Granted",
  "body": "You have been granted 30 minutes of emergency time. Reason: <reason>",
  "category": "parole_granted",
  "priority": "high"
}
```

### 4. Lockdown

**With grace period:**
```json
{
  "title": "Lockdown Warning",
  "body": "Your warden has initiated a lockdown. You have 10 minutes remaining.",
  "category": "lockdown",
  "priority": "high"
}
```

**Immediate:**
```json
{
  "title": "Lockdown",
  "body": "Your warden has initiated an immediate lockdown.",
  "category": "lockdown",
  "priority": "high"
}
```

### 5. Break Glass Alert

Sent to wardens when inmate activates break glass.

```json
{
  "title": "Break Glass Alert",
  "body": "<inmate-name> has activated Break Glass. <reason>",
  "category": "break_glass",
  "priority": "high"
}
```

## Testing

### Testing Without Real Devices

#### 1. Console Provider

Enable console provider to see notifications in logs:

```env
PUSH_CONSOLE_ENABLED=true
NODE_ENV=development
```

Then trigger a notification and check server logs:

```
[NotificationsService] Push notification service initialized with 1 provider(s)
[ConsoleProvider] ================================================
[ConsoleProvider] PUSH NOTIFICATION (Console Provider)
[ConsoleProvider] ================================================
[ConsoleProvider] Token: fake-token-123...
[ConsoleProvider] Title: Time Warning
[ConsoleProvider] Body: You have 15 minutes of screen time left today.
[ConsoleProvider] Category: time_warning
[ConsoleProvider] Priority: high
[ConsoleProvider] ================================================
```

#### 2. Mock Push Tokens

Register a fake push token with platform `console`:

```bash
curl -X POST http://localhost:3000/devices/{device-id}/push-token \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "console",
    "token": "fake-token-for-testing"
  }'
```

#### 3. Notification Database Logs

Check the `notifications` table in the database to see all push notifications (sent and failed):

```sql
SELECT * FROM notifications
WHERE type = 'push'
ORDER BY created_at DESC
LIMIT 10;
```

### Testing With Real Devices

#### iOS (APNs)

1. Build app with production or development provisioning profile
2. Get device token from app (usually in `didRegisterForRemoteNotificationsWithDeviceToken`)
3. Register token via API
4. Trigger notification from backend
5. Check device for notification

**Troubleshooting:**
- Use sandbox mode (`APNS_PRODUCTION=false`) for development builds
- Use production mode (`APNS_PRODUCTION=true`) for TestFlight/App Store builds
- Verify device token format (64 hex characters)
- Check APNs key permissions in Apple Developer Portal

#### Windows (WNS)

1. Build app with Windows Store association
2. Request notification permission
3. Get channel URI from `PushNotificationChannelManager`
4. Register URI via API
5. Trigger notification from backend
6. Check device for toast notification

**Troubleshooting:**
- Ensure app is associated with Windows Store
- Verify Package SID matches WNS_CLIENT_ID
- Check channel URI hasn't expired (they expire every 30 days)
- Test with Windows Notification Visualizer tool

### Manual Testing

#### Send Test Notification

```typescript
// In NotificationsService or test script
await this.notificationsService.sendPushNotification({
  userId: 'user-uuid-here',
  title: 'Test Notification',
  body: 'This is a test push notification',
  category: 'test',
  priority: 'high',
  badge: 1,
  sound: 'default'
});
```

#### Check Provider Status

```typescript
// In NotificationsService.onModuleInit
this.logger.log(`APNs enabled: ${this.apnsProvider.enabled}`);
this.logger.log(`WNS enabled: ${this.wnsProvider.enabled}`);
this.logger.log(`Console enabled: ${this.consoleProvider.enabled}`);
```

## Troubleshooting

### Common Issues

#### 1. APNs Provider Not Initializing

**Error:** `APNs key file not found`

**Solutions:**
- Check APNS_KEY_PATH is correct
- Verify .p8 file exists and is readable
- Try placing file in `/app/keys/apns-key.p8`
- Check file permissions

#### 2. WNS Authentication Failing

**Error:** `WNS authentication failed`

**Solutions:**
- Verify WNS_CLIENT_ID is correct Package SID
- Check WNS_CLIENT_SECRET is valid
- Ensure no extra whitespace in environment variables
- Test credentials with WNS test tool

#### 3. Tokens Not Being Deactivated

**Issue:** Expired tokens still receiving notifications

**Solutions:**
- Check `shouldDeactivateToken` logic in providers
- Verify database unique constraint on `deviceId_platform`
- Run cleanup job: `devicesService.cleanupExpiredPushTokens()`

#### 4. Notifications Not Sending

**Checklist:**
- [ ] Push provider is enabled (`provider.enabled === true`)
- [ ] Push token is registered and active
- [ ] User has active push tokens in database
- [ ] No errors in provider initialization
- [ ] Network connectivity to APNs/WNS servers
- [ ] Credentials are correct

#### 5. Console Provider Not Working

**Solutions:**
- Set `PUSH_CONSOLE_ENABLED=true`
- Set `NODE_ENV=development`
- Restart server to reload config
- Check logs for "Console push provider enabled"

### Debug Mode

Enable verbose logging:

```typescript
// In push provider
this.logger.debug(`Sending to token: ${token}`);
this.logger.debug(`Payload: ${JSON.stringify(payload)}`);
```

### Health Check

Create a health check endpoint:

```typescript
@Get('push/health')
async getPushHealth() {
  return {
    apns: this.apnsProvider.enabled,
    wns: this.wnsProvider.enabled,
    console: this.consoleProvider.enabled,
    totalActiveTokens: await this.prisma.pushToken.count({
      where: { isActive: true }
    })
  };
}
```

## Best Practices

1. **Token Management**
   - Register tokens on app launch
   - Update tokens when they change
   - Remove tokens on logout
   - Clean up expired tokens regularly

2. **Notification Content**
   - Keep titles short (< 40 chars)
   - Keep body concise (< 100 chars)
   - Include actionable information
   - Use appropriate priority levels

3. **Error Handling**
   - Log all push failures
   - Deactivate invalid tokens
   - Retry transient failures
   - Alert on provider initialization failures

4. **Performance**
   - Batch notifications when possible
   - Cache provider authentication tokens
   - Use async/await for parallel sends
   - Monitor push notification latency

5. **Security**
   - Never log full push tokens
   - Secure APNs .p8 key file
   - Rotate WNS client secrets regularly
   - Validate all push token inputs

## Maintenance

### Periodic Tasks

**Daily:**
```typescript
// Clean up expired push tokens
await devicesService.cleanupExpiredPushTokens();
```

**Weekly:**
- Review failed notification logs
- Check provider error rates
- Monitor token activation rates

**Monthly:**
- Rotate WNS client secrets (if needed)
- Review APNs certificate expiration
- Audit push notification performance

## Resources

### APNs (iOS)
- [APNs Overview](https://developer.apple.com/documentation/usernotifications)
- [Establishing a Token-Based Connection to APNs](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_token-based_connection_to_apns)
- [Generating a Remote Notification](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/generating_a_remote_notification)

### WNS (Windows)
- [WNS Overview](https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/windows-push-notification-services--wns--overview)
- [Request, create, and save a notification channel](https://docs.microsoft.com/en-us/windows/uwp/design/shell/tiles-and-notifications/request-create-save-notification-channel)
- [Authenticating your service](https://docs.microsoft.com/en-us/previous-versions/windows/apps/hh465407(v=win.10))

### Testing Tools
- [APNs Tester](https://github.com/onmyway133/PushNotifications) (macOS app)
- [WNS Test Tool](https://apps.microsoft.com/store/detail/windows-notification-tester/9NBLGGH4R58J)
- [Pusher](https://github.com/noodlewerk/NWPusher) (APNs testing tool)
