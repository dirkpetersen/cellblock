import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HeartbeatInput, TimeBudgetConfigInput } from '@cellblock/contracts';

export interface TimeStatus {
  remainingSeconds: number;
  weeklyRemaining: number;
  dailyLimit: number;
  weeklyLimit: number;
  isLocked: boolean;
  activeParole?: {
    type: string;
    expiresAt?: Date;
  };
}

@Injectable()
export class TimeService {
  private readonly logger = new Logger(TimeService.name);

  // Track last heartbeat timestamp per user to calculate time deltas
  private lastHeartbeats: Map<string, Date> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Process heartbeat and update time budget
   * This is called every 30-60 seconds from clients
   */
  async processHeartbeat(userId: string, deviceId: string, heartbeat: HeartbeatInput): Promise<TimeStatus> {
    // If whitelisted app, don't deduct time
    if (heartbeat.isWhitelistedApp) {
      const status = await this.getTimeStatus(userId);
      this.lastHeartbeats.set(userId, new Date());
      return status;
    }

    // Check if there's an active parole grant
    const activeParole = await this.getActiveParole(userId);
    if (activeParole) {
      // User is on parole - allow access but still count toward weekly budget
      const status = await this.getTimeStatus(userId);

      // Still log usage for parole time
      await this.logUsage(userId, deviceId, 60, false); // Assume 60 seconds between heartbeats

      this.lastHeartbeats.set(userId, new Date());
      return status;
    }

    // Calculate time since last heartbeat
    const now = new Date();
    const lastHeartbeat = this.lastHeartbeats.get(userId);

    let secondsToDeduct = 60; // Default: assume 60 seconds between heartbeats

    if (lastHeartbeat) {
      const deltaMs = now.getTime() - lastHeartbeat.getTime();
      secondsToDeduct = Math.min(Math.floor(deltaMs / 1000), 120); // Cap at 2 minutes
    }

    this.lastHeartbeats.set(userId, now);

    // Check for simultaneous device usage
    const recentDeviceIds = await this.getRecentActiveDevices(userId, 45); // 45 second window

    if (recentDeviceIds.length > 1) {
      // Multiple devices active - use wall clock time (already calculated)
      this.logger.log(`Simultaneous devices detected for user ${userId}: ${recentDeviceIds.length} devices`);
    }

    // Get user's timezone for daily budget calculation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    // Get current day's budget
    const dayOfWeek = this.getDayOfWeek(user?.timezone || 'UTC');
    const timeBudget = await this.getDailyBudget(userId, dayOfWeek);

    if (!timeBudget) {
      throw new BadRequestException('Time budget not configured');
    }

    // Calculate remaining time for today
    const todayStart = this.getStartOfDay(user?.timezone || 'UTC');
    const todayUsage = await this.getTodayUsage(userId, todayStart);
    const dailyRemaining = Math.max(0, timeBudget.minutesAllowed * 60 - todayUsage);

    // Calculate remaining time for this week
    const weekStart = this.getStartOfWeek(user?.timezone || 'UTC');
    const weekUsage = await this.getWeekUsage(userId, weekStart);
    const weeklyRemaining = Math.max(
      0,
      (timeBudget.weeklyMaxMinutes || 840) * 60 - weekUsage
    );

    // Deduct time if budget available
    if (dailyRemaining > 0 && weeklyRemaining > 0) {
      await this.logUsage(userId, deviceId, secondsToDeduct, false);
    }

    // Update device last seen
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { lastSeen: now },
    });

    const status = await this.getTimeStatus(userId);

    // Check if user should be locked
    if (status.remainingSeconds <= 0 || status.weeklyRemaining <= 0) {
      status.isLocked = true;
    }

    return status;
  }

  /**
   * Get current time status for user
   */
  async getTimeStatus(userId: string): Promise<TimeStatus> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    const timezone = user?.timezone || 'UTC';
    const dayOfWeek = this.getDayOfWeek(timezone);
    const timeBudget = await this.getDailyBudget(userId, dayOfWeek);

    if (!timeBudget) {
      throw new BadRequestException('Time budget not configured');
    }

    // Calculate today's remaining time
    const todayStart = this.getStartOfDay(timezone);
    const todayUsage = await this.getTodayUsage(userId, todayStart);
    const dailyRemaining = Math.max(0, timeBudget.minutesAllowed * 60 - todayUsage);

    // Calculate this week's remaining time
    const weekStart = this.getStartOfWeek(timezone);
    const weekUsage = await this.getWeekUsage(userId, weekStart);
    const weeklyRemaining = Math.max(
      0,
      (timeBudget.weeklyMaxMinutes || 840) * 60 - weekUsage
    );

    // Check for active parole
    const activeParole = await this.getActiveParole(userId);

    const status: TimeStatus = {
      remainingSeconds: dailyRemaining,
      weeklyRemaining,
      dailyLimit: timeBudget.minutesAllowed * 60,
      weeklyLimit: (timeBudget.weeklyMaxMinutes || 840) * 60,
      isLocked: dailyRemaining <= 0 || weeklyRemaining <= 0,
    };

    if (activeParole) {
      status.activeParole = {
        type: activeParole.type,
        expiresAt: activeParole.expiresAt || activeParole.validUntil || undefined,
      };
      status.isLocked = false; // Parole overrides lock
    }

    return status;
  }

  /**
   * Update time budget configuration
   */
  async updateTimeBudget(userId: string, config: TimeBudgetConfigInput) {
    // Delete existing budgets
    await this.prisma.timeBudget.deleteMany({
      where: { userId },
    });

    // Create new budgets based on mode
    if (config.mode === 'per_day' && config.perDayLimits) {
      // Per-day mode: Different limit for each day
      await this.prisma.timeBudget.createMany({
        data: config.perDayLimits.map((limit) => ({
          userId,
          dayOfWeek: limit.dayOfWeek,
          minutesAllowed: limit.minutesAllowed,
          weeklyMaxMinutes: config.weeklyMaxMinutes,
        })),
      });
    } else if (config.mode === 'weekday_weekend') {
      // Weekday/weekend mode
      await this.prisma.timeBudget.createMany({
        data: [
          {
            userId,
            isWeekend: false,
            minutesAllowed: config.weekdayMinutes || 120,
            weeklyMaxMinutes: config.weeklyMaxMinutes,
          },
          {
            userId,
            isWeekend: true,
            minutesAllowed: config.weekendMinutes || 120,
            weeklyMaxMinutes: config.weeklyMaxMinutes,
          },
        ],
      });
    }

    this.logger.log(`Time budget updated for user ${userId}`);

    return { message: 'Time budget updated successfully' };
  }

  /**
   * Get usage logs for a user
   */
  async getUsageLogs(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    deviceId?: string,
    page = 1,
    limit = 20
  ) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    if (deviceId) {
      where.deviceId = deviceId;
    }

    const [logs, total] = await Promise.all([
      this.prisma.usageLog.findMany({
        where,
        include: {
          device: {
            select: {
              deviceName: true,
              platform: true,
            },
          },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.usageLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Log usage to database
   */
  private async logUsage(
    userId: string,
    deviceId: string,
    secondsUsed: number,
    wasWhitelisted: boolean
  ) {
    const now = new Date();
    const startTime = new Date(now.getTime() - secondsUsed * 1000);

    await this.prisma.usageLog.create({
      data: {
        userId,
        deviceId,
        startTime,
        endTime: now,
        secondsUsed,
        wasWhitelisted,
      },
    });
  }

  /**
   * Get daily budget for a specific day
   */
  private async getDailyBudget(userId: string, dayOfWeek: number) {
    // Try to find per-day budget first
    let budget = await this.prisma.timeBudget.findFirst({
      where: {
        userId,
        dayOfWeek,
      },
    });

    if (budget) {
      return budget;
    }

    // Fall back to weekday/weekend budget
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

    budget = await this.prisma.timeBudget.findFirst({
      where: {
        userId,
        isWeekend,
      },
    });

    return budget;
  }

  /**
   * Get total usage for today (in seconds)
   */
  private async getTodayUsage(userId: string, todayStart: Date): Promise<number> {
    const result = await this.prisma.usageLog.aggregate({
      where: {
        userId,
        startTime: {
          gte: todayStart,
        },
        wasWhitelisted: false, // Only count non-whitelisted usage
      },
      _sum: {
        secondsUsed: true,
      },
    });

    return result._sum.secondsUsed || 0;
  }

  /**
   * Get total usage for this week (in seconds)
   */
  private async getWeekUsage(userId: string, weekStart: Date): Promise<number> {
    const result = await this.prisma.usageLog.aggregate({
      where: {
        userId,
        startTime: {
          gte: weekStart,
        },
        wasWhitelisted: false,
      },
      _sum: {
        secondsUsed: true,
      },
    });

    return result._sum.secondsUsed || 0;
  }

  /**
   * Get devices that sent heartbeats recently (for simultaneous detection)
   */
  private async getRecentActiveDevices(userId: string, withinSeconds: number): Promise<string[]> {
    const since = new Date(Date.now() - withinSeconds * 1000);

    const devices = await this.prisma.device.findMany({
      where: {
        userId,
        lastSeen: {
          gte: since,
        },
      },
      select: { id: true },
    });

    return devices.map((d) => d.id);
  }

  /**
   * Get active parole grant for user
   */
  private async getActiveParole(userId: string) {
    const now = new Date();

    const parole = await this.prisma.paroleGrant.findFirst({
      where: {
        inmateId: userId,
        isActive: true,
        OR: [
          // Type 'until' - check validUntil
          {
            type: 'until',
            validUntil: {
              gte: now,
            },
          },
          // Type 'minutes' - check expiresAt
          {
            type: 'minutes',
            expiresAt: {
              gte: now,
            },
          },
        ],
      },
      orderBy: {
        grantedAt: 'desc',
      },
    });

    return parole;
  }

  /**
   * Get day of week (0=Sunday, 6=Saturday) in user's timezone
   */
  private getDayOfWeek(timezone: string): number {
    const now = new Date();
    // TODO: Use proper timezone library (date-fns-tz or luxon)
    // For now, use UTC
    return now.getUTCDay();
  }

  /**
   * Get start of day in user's timezone
   */
  private getStartOfDay(timezone: string): Date {
    const now = new Date();
    // TODO: Use proper timezone library
    // For now, use UTC midnight
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  }

  /**
   * Get start of week (Sunday 00:00) in user's timezone
   */
  private getStartOfWeek(timezone: string): Date {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = dayOfWeek; // Days since Sunday

    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    return weekStart;
  }
}
