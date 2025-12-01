/**
 * Integration Tests for Time Budget API
 * Tests time tracking, heartbeat processing, and budget management
 */

import * as request from 'supertest';
import { cleanDatabase, getTestPrismaClient } from '../utils/test-database';
import { UserFactory, DeviceFactory, TimeBudgetFactory } from '../utils/factories';
import { loginUser, getAuthHeaders } from '../utils/auth-helper';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';

describe('Time Budget API Integration Tests', () => {
  const prisma = getTestPrismaClient();
  let accessToken: string;
  let user: any;
  let device: any;

  beforeEach(async () => {
    await cleanDatabase();

    // Create user with password
    user = await UserFactory.createInmate({
      email: 'timetest@test.com',
      password: 'TestPassword123!',
    });

    device = await DeviceFactory.create({
      userId: user.id,
      platform: 'ios',
    });

    // Create time budget
    await TimeBudgetFactory.createWeekdayWeekend(user.id, 60, 120);

    // Login to get token
    const tokens = await loginUser({
      email: user.email,
      password: 'TestPassword123!',
    });
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /time/heartbeat', () => {
    it('should process heartbeat and return time status', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/time/heartbeat`)
        .set(getAuthHeaders(accessToken))
        .send({
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          isWhitelistedApp: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('remainingSeconds');
      expect(response.body).toHaveProperty('weeklyRemaining');
      expect(response.body).toHaveProperty('dailyLimit');
      expect(response.body).toHaveProperty('weeklyLimit');
      expect(response.body).toHaveProperty('isLocked');
      expect(response.body.isLocked).toBe(false);
    });

    it('should not deduct time for whitelisted app', async () => {
      // First heartbeat - get initial remaining time
      const firstResponse = await request(API_URL)
        .post(`${API_PREFIX}/time/heartbeat`)
        .set(getAuthHeaders(accessToken))
        .send({
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          isWhitelistedApp: false,
        })
        .expect(200);

      const initialRemaining = firstResponse.body.remainingSeconds;

      // Wait a bit (in real scenario)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second heartbeat - whitelisted app (should not deduct more time)
      const secondResponse = await request(API_URL)
        .post(`${API_PREFIX}/time/heartbeat`)
        .set(getAuthHeaders(accessToken))
        .send({
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          isWhitelistedApp: true,
        })
        .expect(200);

      // Time should not decrease much (only from first heartbeat)
      expect(secondResponse.body.remainingSeconds).toBeGreaterThanOrEqual(initialRemaining - 120);
    });

    it('should lock user when time budget is exhausted', async () => {
      // Use up all the time by creating usage logs
      const startTime = new Date();
      await prisma.usageLog.create({
        data: {
          userId: user.id,
          deviceId: device.id,
          startTime: new Date(startTime.getTime() - 3600000), // 1 hour ago
          endTime: startTime,
          secondsUsed: 3600, // Used all 60 minutes
          wasWhitelisted: false,
        },
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/time/heartbeat`)
        .set(getAuthHeaders(accessToken))
        .send({
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          isWhitelistedApp: false,
        })
        .expect(200);

      expect(response.body.remainingSeconds).toBe(0);
      expect(response.body.isLocked).toBe(true);
    });

    it('should require authentication', async () => {
      await request(API_URL)
        .post(`${API_PREFIX}/time/heartbeat`)
        .send({
          deviceId: device.id,
          timestamp: new Date().toISOString(),
          isWhitelistedApp: false,
        })
        .expect(401);
    });
  });

  describe('GET /time/status', () => {
    it('should return current time status', async () => {
      const response = await request(API_URL)
        .get(`${API_PREFIX}/time/status`)
        .set(getAuthHeaders(accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('remainingSeconds');
      expect(response.body).toHaveProperty('weeklyRemaining');
      expect(response.body).toHaveProperty('dailyLimit');
      expect(response.body.dailyLimit).toBe(3600); // 60 minutes for weekday
      expect(response.body.isLocked).toBe(false);
    });

    it('should show active parole in status', async () => {
      // Grant parole
      await prisma.paroleGrant.create({
        data: {
          inmateId: user.id,
          wardenId: user.id, // Self for test
          type: 'minutes',
          minutesGranted: 30,
          expiresAt: new Date(Date.now() + 1800000), // 30 minutes from now
          isActive: true,
        },
      });

      const response = await request(API_URL)
        .get(`${API_PREFIX}/time/status`)
        .set(getAuthHeaders(accessToken))
        .expect(200);

      expect(response.body).toHaveProperty('activeParole');
      expect(response.body.activeParole.type).toBe('minutes');
      expect(response.body.isLocked).toBe(false);
    });
  });

  describe('PUT /time/budget', () => {
    it('should update time budget configuration', async () => {
      const newConfig = {
        mode: 'weekday_weekend',
        weekdayMinutes: 90,
        weekendMinutes: 240,
        weeklyMaxMinutes: 720,
      };

      const response = await request(API_URL)
        .put(`${API_PREFIX}/time/budget`)
        .set(getAuthHeaders(accessToken))
        .send(newConfig)
        .expect(200);

      expect(response.body.message).toContain('updated');

      // Verify budget was updated
      const budgets = await prisma.timeBudget.findMany({
        where: { userId: user.id },
      });

      expect(budgets.length).toBe(2); // Weekday and weekend
      const weekdayBudget = budgets.find((b) => b.isWeekend === false);
      const weekendBudget = budgets.find((b) => b.isWeekend === true);

      expect(weekdayBudget?.minutesAllowed).toBe(90);
      expect(weekendBudget?.minutesAllowed).toBe(240);
    });

    it('should update per-day budget configuration', async () => {
      const newConfig = {
        mode: 'per_day',
        perDayLimits: [
          { dayOfWeek: 0, minutesAllowed: 180 }, // Sunday
          { dayOfWeek: 1, minutesAllowed: 60 }, // Monday
          { dayOfWeek: 2, minutesAllowed: 60 }, // Tuesday
          { dayOfWeek: 3, minutesAllowed: 60 }, // Wednesday
          { dayOfWeek: 4, minutesAllowed: 60 }, // Thursday
          { dayOfWeek: 5, minutesAllowed: 90 }, // Friday
          { dayOfWeek: 6, minutesAllowed: 180 }, // Saturday
        ],
        weeklyMaxMinutes: 600,
      };

      const response = await request(API_URL)
        .put(`${API_PREFIX}/time/budget`)
        .set(getAuthHeaders(accessToken))
        .send(newConfig)
        .expect(200);

      expect(response.body.message).toContain('updated');

      // Verify all 7 days were created
      const budgets = await prisma.timeBudget.findMany({
        where: { userId: user.id },
        orderBy: { dayOfWeek: 'asc' },
      });

      expect(budgets.length).toBe(7);
      expect(budgets[0].dayOfWeek).toBe(0);
      expect(budgets[0].minutesAllowed).toBe(180);
    });
  });

  describe('GET /time/usage', () => {
    beforeEach(async () => {
      // Create some usage logs
      const now = new Date();
      await prisma.usageLog.createMany({
        data: [
          {
            userId: user.id,
            deviceId: device.id,
            startTime: new Date(now.getTime() - 3600000),
            endTime: new Date(now.getTime() - 3000000),
            secondsUsed: 600,
            wasWhitelisted: false,
          },
          {
            userId: user.id,
            deviceId: device.id,
            startTime: new Date(now.getTime() - 2400000),
            endTime: new Date(now.getTime() - 1800000),
            secondsUsed: 600,
            wasWhitelisted: false,
          },
          {
            userId: user.id,
            deviceId: device.id,
            startTime: new Date(now.getTime() - 1200000),
            endTime: new Date(now.getTime() - 600000),
            secondsUsed: 600,
            wasWhitelisted: true,
          },
        ],
      });
    });

    it('should return usage logs with pagination', async () => {
      const response = await request(API_URL)
        .get(`${API_PREFIX}/time/usage`)
        .set(getAuthHeaders(accessToken))
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBe(3);
    });

    it('should filter usage logs by device', async () => {
      const response = await request(API_URL)
        .get(`${API_PREFIX}/time/usage`)
        .set(getAuthHeaders(accessToken))
        .query({ deviceId: device.id })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((log: any) => log.deviceId === device.id)).toBe(true);
    });

    it('should filter usage logs by date range', async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 7200000).toISOString(); // 2 hours ago
      const endDate = now.toISOString();

      const response = await request(API_URL)
        .get(`${API_PREFIX}/time/usage`)
        .set(getAuthHeaders(accessToken))
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
