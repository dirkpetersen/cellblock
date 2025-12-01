import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AddWhitelistItemInput,
  RemoveWhitelistItemInput,
  ToggleHealthyAppInput,
} from '@cellblock/contracts';

@Injectable()
export class WhitelistService {
  private readonly logger = new Logger(WhitelistService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all whitelist items for a user
   */
  async getUserWhitelist(userId: string) {
    return this.prisma.whitelistItem.findMany({
      where: { userId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get enabled whitelist items only
   */
  async getEnabledWhitelist(userId: string, platform?: string) {
    const where: any = {
      userId,
      isEnabled: true,
    };

    // Filter by platform if specified
    if (platform === 'ios') {
      where.iosBundleId = { not: null };
    } else if (platform === 'windows') {
      where.windowsDomain = { not: null };
    }

    return this.prisma.whitelistItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Request to add whitelist item
   * If user has active warden, creates a pending request
   * If no warden, adds directly
   */
  async requestAddWhitelistItem(userId: string, data: AddWhitelistItemInput) {
    // Check if user has active warden
    const hasActiveWarden = await this.hasActiveWarden(userId);

    if (hasActiveWarden) {
      // Create pending request
      const request = await this.prisma.request.create({
        data: {
          requesterId: userId,
          type: 'whitelist_add',
          status: 'pending',
          requestData: data,
          requesterComment: data.comment,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        },
      });

      this.logger.log(`Whitelist add request created: ${request.id} for user ${userId}`);

      // TODO: Notify wardens

      return {
        message: 'Whitelist request sent to your warden for approval',
        requestId: request.id,
      };
    } else {
      // No warden - add directly
      const item = await this.addWhitelistItem(userId, data);

      return {
        message: 'Whitelist item added successfully',
        item,
      };
    }
  }

  /**
   * Request to remove whitelist item
   */
  async requestRemoveWhitelistItem(userId: string, data: RemoveWhitelistItemInput) {
    const item = await this.prisma.whitelistItem.findFirst({
      where: {
        id: data.itemId,
        userId,
      },
    });

    if (!item) {
      throw new NotFoundException('Whitelist item not found');
    }

    // Utility apps cannot be removed
    if (item.category === 'utility') {
      throw new ForbiddenException('Utility apps cannot be removed');
    }

    const hasActiveWarden = await this.hasActiveWarden(userId);

    if (hasActiveWarden) {
      // Create pending request
      const request = await this.prisma.request.create({
        data: {
          requesterId: userId,
          type: 'whitelist_remove',
          status: 'pending',
          requestData: { itemId: data.itemId, itemName: item.name },
          requesterComment: data.comment,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      this.logger.log(`Whitelist remove request created: ${request.id} for user ${userId}`);

      // TODO: Notify wardens

      return {
        message: 'Removal request sent to your warden for approval',
        requestId: request.id,
      };
    } else {
      // No warden - remove directly
      await this.removeWhitelistItem(data.itemId, userId);

      return { message: 'Whitelist item removed successfully' };
    }
  }

  /**
   * Toggle healthy app enabled/disabled
   * Requires warden approval if warden is active
   */
  async toggleHealthyApp(userId: string, data: ToggleHealthyAppInput) {
    const item = await this.prisma.whitelistItem.findFirst({
      where: {
        id: data.itemId,
        userId,
      },
    });

    if (!item) {
      throw new NotFoundException('Whitelist item not found');
    }

    if (item.category === 'utility') {
      throw new ForbiddenException('Utility apps cannot be disabled');
    }

    if (item.category !== 'healthy') {
      throw new BadRequestException('Only healthy apps can be toggled');
    }

    const hasActiveWarden = await this.hasActiveWarden(userId);

    if (hasActiveWarden) {
      // Create pending request
      const request = await this.prisma.request.create({
        data: {
          requesterId: userId,
          type: data.enabled ? 'whitelist_add' : 'whitelist_remove',
          status: 'pending',
          requestData: { itemId: data.itemId, itemName: item.name, toggle: true, enabled: data.enabled },
          requesterComment: data.comment,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      });

      this.logger.log(`Healthy app toggle request created: ${request.id} for user ${userId}`);

      // TODO: Notify wardens

      return {
        message: 'Toggle request sent to your warden for approval',
        requestId: request.id,
      };
    } else {
      // No warden - toggle directly
      await this.prisma.whitelistItem.update({
        where: { id: item.id },
        data: { isEnabled: data.enabled },
      });

      this.logger.log(`Healthy app toggled: ${item.id} (${data.enabled ? 'enabled' : 'disabled'})`);

      return { message: 'Healthy app toggled successfully' };
    }
  }

  /**
   * Check if app/domain is whitelisted for user
   */
  async isWhitelisted(userId: string, platform: string, identifier: string): Promise<boolean> {
    const where: any = {
      userId,
      isEnabled: true,
    };

    if (platform === 'ios') {
      where.iosBundleId = identifier;
    } else if (platform === 'windows') {
      where.windowsDomain = identifier;
    } else {
      where.androidPackageName = identifier;
    }

    const item = await this.prisma.whitelistItem.findFirst({ where });

    return !!item;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Add whitelist item directly (called after approval or if no warden)
   */
  private async addWhitelistItem(userId: string, data: AddWhitelistItemInput) {
    const item = await this.prisma.whitelistItem.create({
      data: {
        userId,
        name: data.name,
        iosBundleId: data.iosBundleId,
        windowsDomain: data.windowsDomain,
        androidPackageName: data.androidPackageName,
        category: 'custom',
        isEnabled: true,
      },
    });

    // Log event
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'whitelist_added',
        eventData: {
          itemId: item.id,
          itemName: item.name,
        },
      },
    });

    this.logger.log(`Whitelist item added: ${item.id} for user ${userId}`);

    return item;
  }

  /**
   * Remove whitelist item directly
   */
  private async removeWhitelistItem(itemId: string, userId: string) {
    const item = await this.prisma.whitelistItem.findFirst({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Whitelist item not found');
    }

    await this.prisma.whitelistItem.delete({
      where: { id: itemId },
    });

    // Log event
    await this.prisma.event.create({
      data: {
        userId,
        eventType: 'whitelist_removed',
        eventData: {
          itemId,
          itemName: item.name,
        },
      },
    });

    this.logger.log(`Whitelist item removed: ${itemId} for user ${userId}`);
  }

  /**
   * Check if user has an active warden
   */
  private async hasActiveWarden(userId: string): Promise<boolean> {
    const activeWarden = await this.prisma.wardenRelationship.findFirst({
      where: {
        inmateId: userId,
        status: 'active',
      },
    });

    return !!activeWarden;
  }
}
