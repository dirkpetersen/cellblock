import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
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

      this.logger.log(`New device registered: ${device.id} (${device.platform}) for user ${userId}`);

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
      this.logger.warn(
        `Device offline for 30+ minutes: ${device.id} (user: ${device.user.email})`
      );

      // TODO: Send notification to wardens
    }

    return { offlineDevices: offlineDevices.length };
  }
}
