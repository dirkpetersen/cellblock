import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  InviteWardenInput,
  ApproveRequestInput,
  GrantParoleInput,
  TriggerLockdownInput,
} from '@cellblock/contracts';
import { randomBytes } from 'crypto';

@Injectable()
export class WardenService {
  private readonly logger = new Logger(WardenService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService
  ) {}

  /**
   * Invite a warden (send email invitation)
   */
  async inviteWarden(inmateId: string, data: InviteWardenInput) {
    // Check warden limit (max 4)
    const wardenCount = await this.prisma.wardenRelationship.count({
      where: {
        inmateId,
        status: { in: ['pending', 'active'] },
      },
    });

    if (wardenCount >= 4) {
      throw new BadRequestException('Maximum 4 wardens per user exceeded');
    }

    // Check if warden user exists
    let wardenUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Create warden user if doesn't exist (they'll complete signup when accepting invite)
    if (!wardenUser) {
      wardenUser = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          isEmailVerified: false,
        },
      });
    }

    // Check if relationship already exists
    const existing = await this.prisma.wardenRelationship.findFirst({
      where: {
        inmateId,
        wardenId: wardenUser.id,
      },
    });

    if (existing && existing.status !== 'cancelled') {
      throw new BadRequestException('Warden relationship already exists');
    }

    // Generate invitation token
    const invitationToken = randomBytes(32).toString('hex');

    // Create relationship
    const relationship = await this.prisma.wardenRelationship.create({
      data: {
        inmateId,
        wardenId: wardenUser.id,
        status: 'pending',
        isPrimary: data.isPrimary,
        invitationToken,
      },
    });

    this.logger.log(`Warden invitation sent: ${relationship.id} to ${data.email}`);

    // Send invitation email
    const inmate = await this.prisma.user.findUnique({
      where: { id: inmateId },
      select: { displayName: true },
    });
    await this.notificationsService.sendWardenInvitation(
      data.email,
      inmate?.displayName || 'A CellBlock user',
      invitationToken
    );

    // Log event
    await this.prisma.event.create({
      data: {
        userId: inmateId,
        actorId: inmateId,
        eventType: 'warden_invited',
        eventData: {
          wardenEmail: data.email,
          relationshipId: relationship.id,
        },
      },
    });

    return {
      message: 'Warden invitation sent successfully',
      relationshipId: relationship.id,
    };
  }

  /**
   * Accept warden invitation
   */
  async acceptInvitation(wardenId: string, token: string) {
    const relationship = await this.prisma.wardenRelationship.findFirst({
      where: {
        wardenId,
        invitationToken: token,
        status: 'pending',
      },
      include: {
        inmate: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!relationship) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    // Accept invitation
    await this.prisma.wardenRelationship.update({
      where: { id: relationship.id },
      data: {
        status: 'active',
        acceptedAt: new Date(),
      },
    });

    this.logger.log(`Warden accepted invitation: ${relationship.id}`);

    // Log event
    await this.prisma.event.create({
      data: {
        userId: relationship.inmateId,
        actorId: wardenId,
        eventType: 'warden_accepted',
        eventData: {
          relationshipId: relationship.id,
        },
      },
    });

    return {
      message: 'Warden invitation accepted',
      inmate: relationship.inmate,
    };
  }

  /**
   * Get all inmates for a warden
   */
  async getInmates(wardenId: string) {
    const relationships = await this.prisma.wardenRelationship.findMany({
      where: {
        wardenId,
        status: 'active',
      },
      include: {
        inmate: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        isPrimary: 'desc', // Primary relationships first
      },
    });

    return relationships.map((rel) => ({
      relationshipId: rel.id,
      inmate: rel.inmate,
      isPrimary: rel.isPrimary,
      since: rel.acceptedAt,
    }));
  }

  /**
   * Get all wardens for an inmate
   */
  async getWardens(inmateId: string) {
    const relationships = await this.prisma.wardenRelationship.findMany({
      where: {
        inmateId,
        status: { in: ['pending', 'active'] },
      },
      include: {
        warden: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        isPrimary: 'desc',
      },
    });

    return relationships;
  }

  /**
   * Approve or deny a request
   */
  async approveRequest(wardenId: string, data: ApproveRequestInput) {
    const request = await this.prisma.request.findFirst({
      where: {
        id: data.requestId,
        status: 'pending',
      },
      include: {
        requester: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found or already processed');
    }

    // Verify warden has authority over requester
    const isWarden = await this.isWardenOf(wardenId, request.requesterId);
    if (!isWarden) {
      throw new ForbiddenException('You are not a warden of this user');
    }

    // Update request
    await this.prisma.request.update({
      where: { id: request.id },
      data: {
        status: data.approved ? 'approved' : 'denied',
        approverId: wardenId,
        approverComment: data.comment,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Request ${request.id} ${data.approved ? 'approved' : 'denied'} by warden ${wardenId}`
    );

    // If approved, execute the request
    if (data.approved) {
      await this.executeRequest(request);
    }

    // Send push notification to inmate
    await this.notificationsService.sendPushNotification({
      userId: request.requesterId,
      title: data.approved ? 'Request Approved' : 'Request Denied',
      body: data.approved
        ? 'Your request has been approved by your warden.'
        : `Your request was denied. ${data.comment || ''}`,
      category: 'warden_request',
      priority: 'high',
    });

    return {
      message: `Request ${data.approved ? 'approved' : 'denied'} successfully`,
    };
  }

  /**
   * Grant parole (emergency time)
   */
  async grantParole(wardenId: string, data: GrantParoleInput) {
    // Verify warden relationship
    const isWarden = await this.isWardenOf(wardenId, data.inmateId);
    if (!isWarden) {
      throw new ForbiddenException('You are not a warden of this user');
    }

    // Deactivate any existing active parole (last one replaces previous)
    await this.prisma.paroleGrant.updateMany({
      where: {
        inmateId: data.inmateId,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Calculate expiration
    let expiresAt: Date | undefined;
    let validUntil: Date | undefined;

    if (data.type === 'minutes') {
      expiresAt = new Date(Date.now() + (data.value as number) * 60 * 1000);
    } else {
      validUntil = new Date(data.value as string);
    }

    // Create parole grant
    const parole = await this.prisma.paroleGrant.create({
      data: {
        inmateId: data.inmateId,
        wardenId,
        type: data.type,
        minutesGranted: data.type === 'minutes' ? (data.value as number) : undefined,
        validUntil,
        expiresAt,
        reason: data.reason,
        isActive: true,
      },
    });

    this.logger.log(
      `Parole granted: ${parole.id} by warden ${wardenId} to inmate ${data.inmateId}`
    );

    // Log event
    await this.prisma.event.create({
      data: {
        userId: data.inmateId,
        actorId: wardenId,
        eventType: 'parole_granted',
        eventData: {
          paroleId: parole.id,
          type: data.type,
          value: data.value,
        },
      },
    });

    // Send push notification to inmate
    const paroleMessage =
      data.type === 'minutes'
        ? `You have been granted ${data.value} minutes of emergency time.`
        : `You have been granted time until ${new Date(data.value as string).toLocaleString()}.`;

    await this.notificationsService.sendPushNotification({
      userId: data.inmateId,
      title: 'Parole Granted',
      body: paroleMessage + (data.reason ? ` Reason: ${data.reason}` : ''),
      category: 'parole_granted',
      priority: 'high',
    });

    // TODO: Send WebSocket unlock command to inmate

    return {
      message: 'Emergency time granted successfully',
      parole,
    };
  }

  /**
   * Trigger lockdown (set time to 0 immediately or with grace period)
   */
  async triggerLockdown(wardenId: string, data: TriggerLockdownInput) {
    // Verify warden relationship
    const isWarden = await this.isWardenOf(wardenId, data.inmateId);
    if (!isWarden) {
      throw new ForbiddenException('You are not a warden of this user');
    }

    // Deactivate any active parole grants
    await this.prisma.paroleGrant.updateMany({
      where: {
        inmateId: data.inmateId,
        isActive: true,
      },
      data: { isActive: false },
    });

    this.logger.log(`Lockdown triggered by warden ${wardenId} for inmate ${data.inmateId}`);

    // Log event
    await this.prisma.event.create({
      data: {
        userId: data.inmateId,
        actorId: wardenId,
        eventType: 'lockdown',
        eventData: {
          gracePeriodMinutes: data.gracePeriodMinutes,
          reason: data.reason,
        },
      },
    });

    // If grace period, schedule the lockdown
    if (data.gracePeriodMinutes && data.gracePeriodMinutes > 0) {
      // Send warning notification with grace period timer
      await this.notificationsService.sendPushNotification({
        userId: data.inmateId,
        title: 'Lockdown Warning',
        body: `Your warden has initiated a lockdown. You have ${data.gracePeriodMinutes} minutes remaining.${data.reason ? ` Reason: ${data.reason}` : ''}`,
        category: 'lockdown',
        priority: 'high',
      });

      // TODO: Schedule lock command after grace period

      return {
        message: `Lockdown will occur in ${data.gracePeriodMinutes} minutes`,
        gracePeriodMinutes: data.gracePeriodMinutes,
      };
    } else {
      // Immediate lockdown
      await this.notificationsService.sendPushNotification({
        userId: data.inmateId,
        title: 'Lockdown',
        body: `Your warden has initiated an immediate lockdown.${data.reason ? ` Reason: ${data.reason}` : ''}`,
        category: 'lockdown',
        priority: 'high',
      });

      // TODO: Send WebSocket lock command

      return {
        message: 'Immediate lockdown executed',
      };
    }
  }

  /**
   * Warden resigns from supervising an inmate
   */
  async resign(wardenId: string, inmateId: string) {
    const relationship = await this.prisma.wardenRelationship.findFirst({
      where: {
        inmateId,
        wardenId,
        status: 'active',
      },
    });

    if (!relationship) {
      throw new NotFoundException('Warden relationship not found');
    }

    await this.prisma.wardenRelationship.update({
      where: { id: relationship.id },
      data: {
        status: 'resigned',
        cancelledAt: new Date(),
      },
    });

    this.logger.log(`Warden resigned: ${wardenId} from inmate ${inmateId}`);

    // TODO: Notify inmate to promote backup warden

    // Log event
    await this.prisma.event.create({
      data: {
        userId: inmateId,
        actorId: wardenId,
        eventType: 'warden_resigned',
        eventData: {
          relationshipId: relationship.id,
        },
      },
    });

    return { message: 'Resigned successfully' };
  }

  /**
   * Get pending requests for warden to review
   */
  async getPendingRequests(wardenId: string) {
    // Get all inmates supervised by this warden
    const relationships = await this.prisma.wardenRelationship.findMany({
      where: {
        wardenId,
        status: 'active',
      },
      select: { inmateId: true },
    });

    const inmateIds = relationships.map((r) => r.inmateId);

    // Get pending requests from all inmates
    const requests = await this.prisma.request.findMany({
      where: {
        requesterId: { in: inmateIds },
        status: 'pending',
      },
      include: {
        requester: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  /**
   * Get all requests for an inmate (for warden to view history)
   */
  async getInmateRequests(wardenId: string, inmateId: string) {
    // Verify warden relationship
    const isWarden = await this.isWardenOf(wardenId, inmateId);
    if (!isWarden) {
      throw new ForbiddenException('You are not a warden of this user');
    }

    return this.prisma.request.findMany({
      where: { requesterId: inmateId },
      include: {
        approver: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Check if wardenId is an active warden of inmateId
   */
  private async isWardenOf(wardenId: string, inmateId: string): Promise<boolean> {
    const relationship = await this.prisma.wardenRelationship.findFirst({
      where: {
        inmateId,
        wardenId,
        status: 'active',
      },
    });

    return !!relationship;
  }

  /**
   * Execute an approved request
   */
  private async executeRequest(request: any) {
    try {
      if (request.type === 'whitelist_add') {
        // Add whitelist item
        await this.prisma.whitelistItem.create({
          data: {
            userId: request.requesterId,
            name: request.requestData.name,
            iosBundleId: request.requestData.iosBundleId,
            windowsDomain: request.requestData.windowsDomain,
            androidPackageName: request.requestData.androidPackageName,
            category: 'custom',
            isEnabled: true,
          },
        });

        this.logger.log(`Whitelist item added via approved request: ${request.id}`);
      } else if (request.type === 'whitelist_remove') {
        // Remove whitelist item
        await this.prisma.whitelistItem.delete({
          where: { id: request.requestData.itemId },
        });

        this.logger.log(`Whitelist item removed via approved request: ${request.id}`);
      } else if (request.type === 'budget_change') {
        // Update time budget
        // TODO: Implement budget change logic
        this.logger.log(`Budget changed via approved request: ${request.id}`);
      }

      // TODO: Send WebSocket config update to user
    } catch (error) {
      this.logger.error(`Failed to execute request ${request.id}: ${(error as Error).message}`);
    }
  }
}
