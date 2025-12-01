import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDeviceInput } from '@cellblock/contracts';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register or update a device (auto-register on first heartbeat)
   */
  async registerDevice(userId: string, deviceData: RegisterDeviceInput) {
    // Check if device already exists
    let device = await this.prisma.device.findUnique({
      where: { deviceFingerprint: deviceData.deviceFingerprint },
    });

    if (device) {
      // Update existing device
      device = await this.prisma.device.update({
        where: { id: device.id },
        data: {
          deviceName: deviceData.deviceName || device.deviceName,
          osVersion: deviceData.osVersion,
          appVersion: deviceData.appVersion,
          lastSeen: new Date(),
          isActive: true,
        },
      });

      this.logger.log(`Device updated: ${device.id} (${device.platform})`);
    } else {
      // Check device limit (max 12 per user)
      const deviceCount = await this.prisma.device.count({
        where: {
          userId,
          isActive: true,
        },
      });

      if (deviceCount >= 12) {
        throw new BadRequestException('Maximum 12 devices per user exceeded');
      }

      // Create new device
      device = await this.prisma.device.create({
        data: {
          userId,
          deviceFingerprint: deviceData.deviceFingerprint,
          platform: deviceData.platform,
          deviceName: deviceData.deviceName || `${deviceData.platform} device`,
          osVersion: deviceData.osVersion,
          appVersion: deviceData.appVersion,
        },
      });

      this.logger.log(
        `New device registered: ${device.id} (${device.platform}) for user ${userId}`
      );

      // Log event
      await this.prisma.event.create({
        data: {
          userId,
          eventType: 'device_registered',
          eventData: {
            deviceId: device.id,
            platform: device.platform,
            deviceName: device.deviceName,
          },
        },
      });
    }

    return device;
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastSeen: 'desc',
      },
    });
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return device;
  }

  /**
   * Update device last seen timestamp
   */
  async updateLastSeen(deviceId: string) {
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { lastSeen: new Date() },
    });
  }

  /**
   * Remove device (soft delete by setting isActive = false)
   */
  async removeDevice(deviceId: string, userId: string) {
    const device = await this.getDeviceById(deviceId, userId);

    await this.prisma.device.update({
      where: { id: device.id },
      data: { isActive: false },
    });

    this.logger.log(`Device removed: ${device.id} for user ${userId}`);

    return { message: 'Device removed successfully' };
  }

  /**
   * Update device name
   */
  async updateDeviceName(deviceId: string, userId: string, deviceName: string) {
    const device = await this.getDeviceById(deviceId, userId);

    return this.prisma.device.update({
      where: { id: device.id },
      data: { deviceName },
    });
  }

  /**
   * Check for offline devices and notify wardens
   * Run this periodically (every 30 minutes)
   */
  async checkOfflineDevices() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const offlineDevices = await this.prisma.device.findMany({
      where: {
        isActive: true,
        lastSeen: {
          lt: thirtyMinutesAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    for (const device of offlineDevices) {
      this.logger.warn(`Device offline for 30+ minutes: ${device.id} (user: ${device.user.email})`);

      // TODO: Send notification to wardens
    }

    return { offlineDevices: offlineDevices.length };
  }

  /**
   * Register or update push token for a device
   */
  async registerPushToken(userId: string, deviceId: string, platform: string, token: string) {
    // Verify device belongs to user
    const device = await this.getDeviceById(deviceId, userId);

    // Check if token already exists for this device
    const existingToken = await this.prisma.pushToken.findUnique({
      where: {
        deviceId_platform: {
          deviceId: device.id,
          platform,
        },
      },
    });

    if (existingToken) {
      // Update existing token
      const updated = await this.prisma.pushToken.update({
        where: { id: existingToken.id },
        data: {
          token,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Push token updated for device ${deviceId} (${platform})`);
      return updated;
    } else {
      // Create new token
      const newToken = await this.prisma.pushToken.create({
        data: {
          userId,
          deviceId: device.id,
          platform,
          token,
          isActive: true,
        },
      });

      this.logger.log(`Push token registered for device ${deviceId} (${platform})`);

      // Log event
      await this.prisma.event.create({
        data: {
          userId,
          eventType: 'push_token_registered',
          eventData: {
            deviceId,
            platform,
          },
        },
      });

      return newToken;
    }
  }

  /**
   * Remove push token for a device
   */
  async removePushToken(userId: string, deviceId: string, platform: string) {
    // Verify device belongs to user
    await this.getDeviceById(deviceId, userId);

    const token = await this.prisma.pushToken.findUnique({
      where: {
        deviceId_platform: {
          deviceId,
          platform,
        },
      },
    });

    if (!token) {
      throw new NotFoundException('Push token not found');
    }

    // Soft delete by setting isActive to false
    await this.prisma.pushToken.update({
      where: { id: token.id },
      data: { isActive: false },
    });

    this.logger.log(`Push token removed for device ${deviceId} (${platform})`);

    return { message: 'Push token removed successfully' };
  }

  /**
   * Get all push tokens for a device
   */
  async getDevicePushTokens(userId: string, deviceId: string) {
    // Verify device belongs to user
    await this.getDeviceById(deviceId, userId);

    return this.prisma.pushToken.findMany({
      where: {
        deviceId,
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        createdAt: true,
        updatedAt: true,
        // Don't return the actual token for security
      },
    });
  }

  /**
   * Clean up expired push tokens
   * Run this periodically (daily)
   */
  async cleanupExpiredPushTokens() {
    // Remove tokens that haven't been updated in 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.pushToken.updateMany({
      where: {
        isActive: true,
        updatedAt: {
          lt: ninetyDaysAgo,
        },
      },
      data: { isActive: false },
    });

    this.logger.log(`Cleaned up ${result.count} expired push token(s)`);

    return { cleaned: result.count };
  }
}
