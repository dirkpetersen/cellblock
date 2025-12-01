/**
 * Unit Tests for Time Calculation Logic
 * Tests the core time budget calculation and enforcement
 */

import { TimeService } from '../../srv-back/src/modules/time/time.service';
import { PrismaService } from '../../srv-back/src/modules/common/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('TimeService - Time Calculation', () => {
  let timeService: TimeService;
  let prismaService: PrismaService;

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
      timeBudget: {
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      usageLog: {
        aggregate: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      device: {
        update: jest.fn(),
        findMany: jest.fn(),
      },
      paroleGrant: {
        findFirst: jest.fn(),
      },
    } as any;

    timeService = new TimeService(prismaService);
  });

  describe('processHeartbeat', () => {
    const userId = 'user-123';
    const deviceId = 'device-456';

    it('should not deduct time for whitelisted app usage', async () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        isWhitelistedApp: true,
      };

      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      (prismaService.usageLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { secondsUsed: 0 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await timeService.processHeartbeat(userId, deviceId, heartbeat);

      expect(result.remainingSeconds).toBe(3600); // 60 minutes
      expect(result.isLocked).toBe(false);
      expect(prismaService.usageLog.create).not.toHaveBeenCalled();
    });

    it('should deduct time for non-whitelisted app usage', async () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        isWhitelistedApp: false,
      };

      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      (prismaService.usageLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { secondsUsed: 0 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.device.update as jest.Mock).mockResolvedValue({});
      (prismaService.usageLog.create as jest.Mock).mockResolvedValue({});
      (prismaService.device.findMany as jest.Mock).mockResolvedValue([{ id: deviceId }]);

      const result = await timeService.processHeartbeat(userId, deviceId, heartbeat);

      expect(result.remainingSeconds).toBeGreaterThan(0);
      expect(prismaService.usageLog.create).toHaveBeenCalled();
      expect(prismaService.device.update).toHaveBeenCalledWith({
        where: { id: deviceId },
        data: { lastSeen: expect.any(Date) },
      });
    });

    it('should lock user when daily budget is exhausted', async () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        isWhitelistedApp: false,
      };

      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      // User has already used 60 minutes today
      (prismaService.usageLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { secondsUsed: 3600 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.device.update as jest.Mock).mockResolvedValue({});
      (prismaService.device.findMany as jest.Mock).mockResolvedValue([{ id: deviceId }]);

      const result = await timeService.processHeartbeat(userId, deviceId, heartbeat);

      expect(result.remainingSeconds).toBe(0);
      expect(result.isLocked).toBe(true);
    });

    it('should allow access when user has active parole', async () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        isWhitelistedApp: false,
      };

      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockParole = {
        id: 'parole-1',
        inmateId: userId,
        wardenId: 'warden-1',
        type: 'minutes',
        minutesGranted: 30,
        validUntil: null,
        reason: 'Emergency',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
        isActive: true,
        createdAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      // User has exhausted daily budget
      (prismaService.usageLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { secondsUsed: 3600 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(mockParole);
      (prismaService.usageLog.create as jest.Mock).mockResolvedValue({});
      (prismaService.device.update as jest.Mock).mockResolvedValue({});
      (prismaService.device.findMany as jest.Mock).mockResolvedValue([{ id: deviceId }]);

      const result = await timeService.processHeartbeat(userId, deviceId, heartbeat);

      expect(result.isLocked).toBe(false);
      expect(result.activeParole).toBeDefined();
      expect(result.activeParole?.type).toBe('minutes');
    });

    it('should detect simultaneous device usage', async () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        isWhitelistedApp: false,
      };

      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      (prismaService.usageLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { secondsUsed: 0 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.device.update as jest.Mock).mockResolvedValue({});
      (prismaService.usageLog.create as jest.Mock).mockResolvedValue({});
      // Mock multiple devices active simultaneously
      (prismaService.device.findMany as jest.Mock).mockResolvedValue([
        { id: deviceId },
        { id: 'device-789' },
      ]);

      const result = await timeService.processHeartbeat(userId, deviceId, heartbeat);

      // Should still deduct time (wall clock time, not per-device)
      expect(prismaService.usageLog.create).toHaveBeenCalled();
    });

    it('should throw error when time budget not configured', async () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        isWhitelistedApp: false,
      };

      const mockUser = { timezone: 'America/Los_Angeles' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.device.findMany as jest.Mock).mockResolvedValue([{ id: deviceId }]);

      await expect(timeService.processHeartbeat(userId, deviceId, heartbeat)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getTimeStatus', () => {
    const userId = 'user-123';

    it('should return correct time status with remaining time', async () => {
      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 120,
        weeklyMaxMinutes: 840,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      // User has used 30 minutes today
      (prismaService.usageLog.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { secondsUsed: 1800 } }) // Today
        .mockResolvedValueOnce({ _sum: { secondsUsed: 7200 } }); // This week (2 hours)
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await timeService.getTimeStatus(userId);

      expect(result.remainingSeconds).toBe(5400); // 90 minutes remaining
      expect(result.weeklyRemaining).toBe(43200); // 12 hours remaining
      expect(result.dailyLimit).toBe(7200); // 2 hours
      expect(result.weeklyLimit).toBe(50400); // 14 hours
      expect(result.isLocked).toBe(false);
    });

    it('should mark user as locked when budget exhausted', async () => {
      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      // User has used all time today
      (prismaService.usageLog.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { secondsUsed: 3600 } })
        .mockResolvedValueOnce({ _sum: { secondsUsed: 10800 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await timeService.getTimeStatus(userId);

      expect(result.remainingSeconds).toBe(0);
      expect(result.isLocked).toBe(true);
    });

    it('should override lock when user has active parole', async () => {
      const mockUser = { timezone: 'America/Los_Angeles' };
      const mockBudget = {
        id: 'budget-1',
        userId,
        dayOfWeek: 0,
        isWeekend: false,
        minutesAllowed: 60,
        weeklyMaxMinutes: 420,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockParole = {
        id: 'parole-1',
        inmateId: userId,
        wardenId: 'warden-1',
        type: 'until',
        minutesGranted: null,
        validUntil: new Date(Date.now() + 3600000), // 1 hour from now
        reason: 'Work emergency',
        grantedAt: new Date(),
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.timeBudget.findFirst as jest.Mock).mockResolvedValue(mockBudget);
      // User has used all time
      (prismaService.usageLog.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: { secondsUsed: 3600 } })
        .mockResolvedValueOnce({ _sum: { secondsUsed: 10800 } });
      (prismaService.paroleGrant.findFirst as jest.Mock).mockResolvedValue(mockParole);

      const result = await timeService.getTimeStatus(userId);

      expect(result.remainingSeconds).toBe(0);
      expect(result.isLocked).toBe(false); // Parole overrides lock
      expect(result.activeParole).toBeDefined();
      expect(result.activeParole?.type).toBe('until');
    });
  });

  describe('updateTimeBudget', () => {
    const userId = 'user-123';

    it('should create per-day budgets', async () => {
      const config = {
        mode: 'per_day' as const,
        perDayLimits: [
          { dayOfWeek: 0, minutesAllowed: 120 }, // Sunday
          { dayOfWeek: 1, minutesAllowed: 60 }, // Monday
          { dayOfWeek: 2, minutesAllowed: 60 }, // Tuesday
          { dayOfWeek: 3, minutesAllowed: 60 }, // Wednesday
          { dayOfWeek: 4, minutesAllowed: 60 }, // Thursday
          { dayOfWeek: 5, minutesAllowed: 90 }, // Friday
          { dayOfWeek: 6, minutesAllowed: 120 }, // Saturday
        ],
        weeklyMaxMinutes: 540,
      };

      (prismaService.timeBudget.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.timeBudget.createMany as jest.Mock).mockResolvedValue({ count: 7 });

      const result = await timeService.updateTimeBudget(userId, config);

      expect(result.message).toBe('Time budget updated successfully');
      expect(prismaService.timeBudget.deleteMany).toHaveBeenCalledWith({ where: { userId } });
      expect(prismaService.timeBudget.createMany).toHaveBeenCalled();
    });

    it('should create weekday/weekend budgets', async () => {
      const config = {
        mode: 'weekday_weekend' as const,
        weekdayMinutes: 60,
        weekendMinutes: 180,
        weeklyMaxMinutes: 540,
      };

      (prismaService.timeBudget.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.timeBudget.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await timeService.updateTimeBudget(userId, config);

      expect(result.message).toBe('Time budget updated successfully');
      expect(prismaService.timeBudget.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId,
            isWeekend: false,
            minutesAllowed: 60,
            weeklyMaxMinutes: 540,
          },
          {
            userId,
            isWeekend: true,
            minutesAllowed: 180,
            weeklyMaxMinutes: 540,
          },
        ],
      });
    });
  });

  describe('getUsageLogs', () => {
    const userId = 'user-123';

    it('should retrieve usage logs with pagination', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId,
          deviceId: 'device-1',
          startTime: new Date(),
          endTime: new Date(),
          secondsUsed: 300,
          wasWhitelisted: false,
          device: { deviceName: 'iPhone', platform: 'ios' },
        },
      ];

      (prismaService.usageLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prismaService.usageLog.count as jest.Mock).mockResolvedValue(1);

      const result = await timeService.getUsageLogs(userId, undefined, undefined, undefined, 1, 20);

      expect(result.data).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should filter usage logs by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      (prismaService.usageLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.usageLog.count as jest.Mock).mockResolvedValue(0);

      await timeService.getUsageLogs(userId, startDate, endDate);

      expect(prismaService.usageLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should filter usage logs by device', async () => {
      const deviceId = 'device-123';

      (prismaService.usageLog.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.usageLog.count as jest.Mock).mockResolvedValue(0);

      await timeService.getUsageLogs(userId, undefined, undefined, deviceId);

      expect(prismaService.usageLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deviceId,
          }),
        })
      );
    });
  });
});
