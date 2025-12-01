/**
 * Example Test Script for Push Notifications
 *
 * This is a reference example showing how to test push notifications.
 * Copy this file and adapt it to your testing needs.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications.service';
import { ApnsProvider } from './apns.provider';
import { WnsProvider } from './wns.provider';
import { ConsoleProvider } from './console.provider';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('Push Notifications Test', () => {
  let notificationsService: NotificationsService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        NotificationsService,
        ApnsProvider,
        WnsProvider,
        ConsoleProvider,
        PrismaService,
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Initialize providers
    await notificationsService.onModuleInit();
  });

  it('should send push notification using console provider', async () => {
    // Create test user
    const testUser = await prismaService.user.create({
      data: {
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });

    // Create test device
    const testDevice = await prismaService.device.create({
      data: {
        userId: testUser.id,
        deviceFingerprint: 'test-device-123',
        platform: 'console',
        deviceName: 'Test Device',
      },
    });

    // Register push token
    await prismaService.pushToken.create({
      data: {
        userId: testUser.id,
        deviceId: testDevice.id,
        platform: 'console',
        token: 'console-test-token',
        isActive: true,
      },
    });

    // Send push notification
    const result = await notificationsService.sendPushNotification({
      userId: testUser.id,
      title: 'Test Notification',
      body: 'This is a test push notification',
      category: 'test',
      priority: 'high',
      badge: 1,
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);

    // Cleanup
    await prismaService.pushToken.deleteMany({ where: { userId: testUser.id } });
    await prismaService.device.deleteMany({ where: { userId: testUser.id } });
    await prismaService.user.delete({ where: { id: testUser.id } });
  });

  it('should handle expired tokens correctly', async () => {
    // Create test user
    const testUser = await prismaService.user.create({
      data: {
        email: 'test2@example.com',
        displayName: 'Test User 2',
      },
    });

    // Create test device
    const testDevice = await prismaService.device.create({
      data: {
        userId: testUser.id,
        deviceFingerprint: 'test-device-456',
        platform: 'ios',
        deviceName: 'Test iOS Device',
      },
    });

    // Register invalid push token (will fail with APNs)
    await prismaService.pushToken.create({
      data: {
        userId: testUser.id,
        deviceId: testDevice.id,
        platform: 'ios',
        token: 'invalid-token-that-will-fail',
        isActive: true,
      },
    });

    // Send push notification (will fail and deactivate token)
    const result = await notificationsService.sendPushNotification({
      userId: testUser.id,
      title: 'Test Notification',
      body: 'This notification will fail',
      category: 'test',
      priority: 'high',
    });

    expect(result.failed).toBe(1);

    // Check that token was deactivated
    const token = await prismaService.pushToken.findFirst({
      where: { userId: testUser.id },
    });

    // Token should be deactivated if APNs is configured and returned error
    // Otherwise it will remain active (no provider available)

    // Cleanup
    await prismaService.pushToken.deleteMany({ where: { userId: testUser.id } });
    await prismaService.device.deleteMany({ where: { userId: testUser.id } });
    await prismaService.user.delete({ where: { id: testUser.id } });
  });

  it('should send to multiple devices', async () => {
    // Create test user
    const testUser = await prismaService.user.create({
      data: {
        email: 'test3@example.com',
        displayName: 'Test User 3',
      },
    });

    // Create multiple test devices
    const devices = await Promise.all([
      prismaService.device.create({
        data: {
          userId: testUser.id,
          deviceFingerprint: 'test-device-ios',
          platform: 'console',
          deviceName: 'iOS Device',
        },
      }),
      prismaService.device.create({
        data: {
          userId: testUser.id,
          deviceFingerprint: 'test-device-windows',
          platform: 'console',
          deviceName: 'Windows Device',
        },
      }),
    ]);

    // Register push tokens
    await Promise.all(
      devices.map((device) =>
        prismaService.pushToken.create({
          data: {
            userId: testUser.id,
            deviceId: device.id,
            platform: 'console',
            token: `console-token-${device.id}`,
            isActive: true,
          },
        })
      )
    );

    // Send push notification to all devices
    const result = await notificationsService.sendPushNotification({
      userId: testUser.id,
      title: 'Multi-Device Test',
      body: 'This should reach all devices',
      category: 'test',
      priority: 'high',
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);

    // Cleanup
    await prismaService.pushToken.deleteMany({ where: { userId: testUser.id } });
    await prismaService.device.deleteMany({ where: { userId: testUser.id } });
    await prismaService.user.delete({ where: { id: testUser.id } });
  });
});

/**
 * Manual Testing Examples
 */

// Example 1: Send test notification to console
async function testConsoleNotification() {
  // Requires: User with console push token registered
  await notificationsService.sendPushNotification({
    userId: 'your-user-id',
    title: 'Test Alert',
    body: 'Testing console push notifications',
    category: 'test',
    priority: 'high',
  });
}

// Example 2: Test APNs with real device token
async function testApnsNotification() {
  // Requires: APNs configured, iOS device token registered
  await notificationsService.sendPushNotification({
    userId: 'your-user-id',
    title: 'iOS Test',
    body: 'Testing APNs push notifications',
    category: 'test',
    priority: 'high',
    sound: 'default',
    badge: 1,
  });
}

// Example 3: Test WNS with real channel URI
async function testWnsNotification() {
  // Requires: WNS configured, Windows channel URI registered
  await notificationsService.sendPushNotification({
    userId: 'your-user-id',
    title: 'Windows Test',
    body: 'Testing WNS push notifications',
    category: 'test',
    priority: 'high',
  });
}

// Example 4: Test time warning notification
async function testTimeWarning() {
  await notificationsService.sendPushNotification({
    userId: 'your-user-id',
    title: 'Time Warning',
    body: 'You have 15 minutes of screen time left today.',
    category: 'time_warning',
    priority: 'high',
    sound: 'default',
  });
}

// Example 5: Test warden notification
async function testWardenNotification() {
  await notificationsService.sendPushNotification({
    userId: 'inmate-user-id',
    title: 'Request Approved',
    body: 'Your request has been approved by your warden.',
    category: 'warden_request',
    priority: 'high',
    sound: 'default',
  });
}

// Example 6: Test break glass alert (to wardens)
async function testBreakGlassAlert() {
  const wardenEmails = ['warden1@example.com', 'warden2@example.com'];
  await notificationsService.sendBreakGlassNotification(
    wardenEmails,
    'John Doe',
    'Emergency situation - need immediate access'
  );
}
