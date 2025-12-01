import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserInput } from '@cellblock/contracts';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        timezone: data.timezone,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string) {
    // Soft delete - data retained for 30 days
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
      },
    });

    // TODO: Notify all wardens about account deletion

    return { message: 'Account deleted successfully' };
  }

  /**
   * Break glass - emergency unlock that terminates all warden relationships
   */
  async breakGlass(userId: string, comment?: string) {
    // Get all active wardens
    const wardens = await this.prisma.wardenRelationship.findMany({
      where: {
        inmateId: userId,
        status: 'active',
      },
      include: {
        warden: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Cancel all warden relationships
    await this.prisma.wardenRelationship.updateMany({
      where: {
        inmateId: userId,
        status: 'active',
      },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    // Cancel all pending requests
    await this.prisma.request.updateMany({
      where: {
        requesterId: userId,
        status: 'pending',
      },
      data: {
        status: 'expired',
        updatedAt: new Date(),
      },
    });

    // Deactivate all parole grants
    await this.prisma.paroleGrant.updateMany({
      where: {
        inmateId: userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    this.logger.warn(`Break glass activated by user ${userId}`);

    // Log event
    await this.prisma.event.create({
      data: {
        userId,
        actorId: userId,
        eventType: 'break_glass',
        eventData: {
          comment,
          wardensNotified: wardens.length,
        },
      },
    });

    // Send notifications to all wardens
    const user = await this.findById(userId);
    const wardenEmails = wardens.map((w) => w.warden.email);
    await this.notificationsService.sendBreakGlassNotification(
      wardenEmails,
      user.displayName || user.email,
      comment
    );

    return {
      message: 'Break glass activated. All warden relationships have been terminated.',
      wardensNotified: wardens.length,
    };
  }
}
