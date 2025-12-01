/**
 * Test Database Utilities
 * Provides database setup, teardown, and cleanup utilities for tests
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

/**
 * Get or create Prisma test client
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

/**
 * Clean up all database tables (except migrations)
 * Runs before/after tests to ensure clean state
 */
export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrismaClient();

  // Delete in order to respect foreign key constraints
  await prisma.pushToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.event.deleteMany();
  await prisma.request.deleteMany();
  await prisma.paroleGrant.deleteMany();
  await prisma.usageLog.deleteMany();
  await prisma.whitelistItem.deleteMany();
  await prisma.timeBudget.deleteMany();
  await prisma.wardenRelationship.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnect from database
 * Should be called after all tests complete
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

/**
 * Reset database to initial state
 * Useful for integration tests that need a fresh database
 */
export async function resetDatabase(): Promise<void> {
  await cleanDatabase();
  // Could add seeding of default data here if needed
}

/**
 * Execute raw SQL (useful for testing edge cases)
 */
export async function executeRawSql(sql: string, params: any[] = []): Promise<any> {
  const prisma = getTestPrismaClient();
  return prisma.$queryRawUnsafe(sql, ...params);
}
