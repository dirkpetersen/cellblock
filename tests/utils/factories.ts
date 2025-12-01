/**
 * Test Data Factories
 * Generates test data with realistic values using Faker
 */

import { faker } from '@faker-js/faker';
import { PrismaClient, User, Device, TimeBudget, WhitelistItem } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export interface CreateUserOptions {
  email?: string;
  password?: string;
  displayName?: string;
  timezone?: string;
  isEmailVerified?: boolean;
  oauthProvider?: string;
  oauthProviderId?: string;
}

export interface CreateDeviceOptions {
  userId: string;
  deviceFingerprint?: string;
  platform?: 'ios' | 'windows' | 'android' | 'macos';
  deviceName?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface CreateTimeBudgetOptions {
  userId: string;
  dayOfWeek?: number;
  isWeekend?: boolean;
  minutesAllowed?: number;
  weeklyMaxMinutes?: number;
}

export interface CreateWhitelistItemOptions {
  userId: string;
  name?: string;
  iosBundleId?: string;
  windowsDomain?: string;
  androidPackageName?: string;
  category?: 'essential' | 'healthy' | 'custom';
  isEnabled?: boolean;
}

/**
 * User Factory
 */
export class UserFactory {
  /**
   * Create a test user (inmate or warden)
   */
  static async create(options: CreateUserOptions = {}): Promise<User> {
    const hashedPassword = options.password
      ? await bcrypt.hash(options.password, 10)
      : await bcrypt.hash('TestPassword123!', 10);

    return prisma.user.create({
      data: {
        email: options.email || faker.internet.email().toLowerCase(),
        hashedPassword: options.oauthProvider ? null : hashedPassword,
        displayName: options.displayName || faker.person.fullName(),
        timezone: options.timezone || 'America/Los_Angeles',
        isEmailVerified: options.isEmailVerified ?? false,
        oauthProvider: options.oauthProvider,
        oauthProviderId: options.oauthProviderId,
      },
    });
  }

  /**
   * Create multiple test users
   */
  static async createMany(count: number, options: CreateUserOptions = {}): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(options));
    }
    return users;
  }

  /**
   * Create a verified inmate user with default setup
   */
  static async createInmate(options: CreateUserOptions = {}): Promise<User> {
    return this.create({
      isEmailVerified: true,
      ...options,
    });
  }

  /**
   * Create a verified warden user
   */
  static async createWarden(options: CreateUserOptions = {}): Promise<User> {
    return this.create({
      isEmailVerified: true,
      displayName: options.displayName || `Warden ${faker.person.firstName()}`,
      ...options,
    });
  }
}

/**
 * Device Factory
 */
export class DeviceFactory {
  /**
   * Create a test device
   */
  static async create(options: CreateDeviceOptions): Promise<Device> {
    const platform = options.platform || faker.helpers.arrayElement(['ios', 'windows', 'android', 'macos']);

    return prisma.device.create({
      data: {
        userId: options.userId,
        deviceFingerprint: options.deviceFingerprint || faker.string.uuid(),
        platform,
        deviceName: options.deviceName || `${platform}-${faker.string.alphanumeric(6)}`,
        osVersion: options.osVersion || this.generateOsVersion(platform),
        appVersion: options.appVersion || '0.1.0',
      },
    });
  }

  /**
   * Create multiple devices for a user
   */
  static async createMany(userId: string, count: number): Promise<Device[]> {
    const devices: Device[] = [];
    const platforms = ['ios', 'windows', 'android', 'macos'] as const;

    for (let i = 0; i < count; i++) {
      devices.push(
        await this.create({
          userId,
          platform: platforms[i % platforms.length],
        })
      );
    }
    return devices;
  }

  private static generateOsVersion(platform: string): string {
    switch (platform) {
      case 'ios':
        return `iOS ${faker.number.int({ min: 16, max: 17 })}.${faker.number.int({ min: 0, max: 5 })}`;
      case 'windows':
        return `Windows ${faker.helpers.arrayElement(['10', '11'])}`;
      case 'android':
        return `Android ${faker.number.int({ min: 12, max: 14 })}`;
      case 'macos':
        return `macOS ${faker.number.int({ min: 13, max: 14 })}.${faker.number.int({ min: 0, max: 5 })}`;
      default:
        return 'Unknown';
    }
  }
}

/**
 * Time Budget Factory
 */
export class TimeBudgetFactory {
  /**
   * Create a time budget for a specific day
   */
  static async create(options: CreateTimeBudgetOptions): Promise<TimeBudget> {
    return prisma.timeBudget.create({
      data: {
        userId: options.userId,
        dayOfWeek: options.dayOfWeek,
        isWeekend: options.isWeekend,
        minutesAllowed: options.minutesAllowed || 60,
        weeklyMaxMinutes: options.weeklyMaxMinutes,
      },
    });
  }

  /**
   * Create a full week of time budgets (Monday-Sunday)
   */
  static async createWeek(userId: string, minutesAllowed: number = 60): Promise<TimeBudget[]> {
    const budgets: TimeBudget[] = [];

    for (let day = 0; day < 7; day++) {
      const isWeekend = day === 0 || day === 6; // Sunday or Saturday
      budgets.push(
        await this.create({
          userId,
          dayOfWeek: day,
          minutesAllowed: isWeekend ? minutesAllowed * 2 : minutesAllowed,
        })
      );
    }

    return budgets;
  }

  /**
   * Create weekday/weekend budgets
   */
  static async createWeekdayWeekend(
    userId: string,
    weekdayMinutes: number = 60,
    weekendMinutes: number = 120
  ): Promise<TimeBudget[]> {
    return Promise.all([
      this.create({
        userId,
        isWeekend: false,
        minutesAllowed: weekdayMinutes,
      }),
      this.create({
        userId,
        isWeekend: true,
        minutesAllowed: weekendMinutes,
      }),
    ]);
  }
}

/**
 * Whitelist Item Factory
 */
export class WhitelistItemFactory {
  /**
   * Create a whitelist item
   */
  static async create(options: CreateWhitelistItemOptions): Promise<WhitelistItem> {
    const category = options.category || 'custom';

    return prisma.whitelistItem.create({
      data: {
        userId: options.userId,
        name: options.name || faker.company.name(),
        iosBundleId: options.iosBundleId,
        windowsDomain: options.windowsDomain,
        androidPackageName: options.androidPackageName,
        category,
        isEnabled: options.isEnabled ?? true,
      },
    });
  }

  /**
   * Create essential whitelist items (Maps, Banking, etc.)
   */
  static async createEssentials(userId: string): Promise<WhitelistItem[]> {
    const essentials = [
      {
        name: 'Google Maps',
        iosBundleId: 'com.google.Maps',
        windowsDomain: 'maps.google.com',
        androidPackageName: 'com.google.android.apps.maps',
        category: 'essential' as const,
      },
      {
        name: 'Banking App',
        iosBundleId: 'com.chase.mobile',
        windowsDomain: 'chase.com',
        androidPackageName: 'com.chase.mobile',
        category: 'essential' as const,
      },
      {
        name: 'Calculator',
        iosBundleId: 'com.apple.calculator',
        windowsDomain: 'calculator.windows.com',
        androidPackageName: 'com.android.calculator2',
        category: 'essential' as const,
      },
    ];

    return Promise.all(
      essentials.map((item) =>
        this.create({
          userId,
          ...item,
        })
      )
    );
  }

  /**
   * Create healthy apps (Spotify, Audible, etc.)
   */
  static async createHealthyApps(userId: string): Promise<WhitelistItem[]> {
    const healthyApps = [
      {
        name: 'Spotify',
        iosBundleId: 'com.spotify.client',
        windowsDomain: 'spotify.com',
        androidPackageName: 'com.spotify.music',
        category: 'healthy' as const,
      },
      {
        name: 'Audible',
        iosBundleId: 'com.audible.iphone',
        windowsDomain: 'audible.com',
        androidPackageName: 'com.audible.application',
        category: 'healthy' as const,
      },
    ];

    return Promise.all(
      healthyApps.map((item) =>
        this.create({
          userId,
          ...item,
        })
      )
    );
  }
}

/**
 * Warden Relationship Factory
 */
export class WardenRelationshipFactory {
  /**
   * Create a warden relationship
   */
  static async create(inmateId: string, wardenId: string, status: 'pending' | 'active' | 'cancelled' = 'active') {
    return prisma.wardenRelationship.create({
      data: {
        inmateId,
        wardenId,
        status,
        isPrimary: true,
        invitationToken: status === 'pending' ? faker.string.alphanumeric(32) : null,
        acceptedAt: status === 'active' ? new Date() : null,
      },
    });
  }

  /**
   * Create a pending invitation
   */
  static async createPendingInvitation(inmateId: string, wardenEmail: string) {
    // First check if warden exists, otherwise create
    let warden = await prisma.user.findUnique({ where: { email: wardenEmail } });
    if (!warden) {
      warden = await UserFactory.createWarden({ email: wardenEmail });
    }

    return this.create(inmateId, warden.id, 'pending');
  }
}

/**
 * Usage Log Factory
 */
export class UsageLogFactory {
  /**
   * Create a usage log entry
   */
  static async create(userId: string, deviceId: string, secondsUsed: number = 60, wasWhitelisted: boolean = false) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - secondsUsed * 1000);

    return prisma.usageLog.create({
      data: {
        userId,
        deviceId,
        startTime,
        endTime,
        secondsUsed,
        wasWhitelisted,
      },
    });
  }

  /**
   * Create multiple usage log entries for a user
   */
  static async createMany(userId: string, deviceId: string, count: number) {
    const logs = [];
    for (let i = 0; i < count; i++) {
      logs.push(
        await this.create(
          userId,
          deviceId,
          faker.number.int({ min: 30, max: 300 }),
          faker.datatype.boolean()
        )
      );
    }
    return logs;
  }
}
