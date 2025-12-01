/**
 * Test Database Seed Script
 * Seeds the test database with initial data for integration/E2E tests
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import usersFixture from '../fixtures/users.json';
import whitelistFixture from '../fixtures/whitelist-items.json';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting test database seed...');

  // Create test inmates
  const inmates = [];
  for (const inmateData of usersFixture.inmates) {
    const hashedPassword = await bcrypt.hash(inmateData.password, 10);
    const inmate = await prisma.user.create({
      data: {
        email: inmateData.email,
        hashedPassword,
        displayName: inmateData.displayName,
        timezone: inmateData.timezone,
        isEmailVerified: inmateData.isEmailVerified,
      },
    });
    inmates.push(inmate);
    console.log(`Created inmate: ${inmate.email}`);
  }

  // Create test wardens
  const wardens = [];
  for (const wardenData of usersFixture.wardens) {
    const hashedPassword = await bcrypt.hash(wardenData.password, 10);
    const warden = await prisma.user.create({
      data: {
        email: wardenData.email,
        hashedPassword,
        displayName: wardenData.displayName,
        timezone: wardenData.timezone,
        isEmailVerified: wardenData.isEmailVerified,
      },
    });
    wardens.push(warden);
    console.log(`Created warden: ${warden.email}`);
  }

  // Create warden relationships
  if (inmates.length > 0 && wardens.length > 0) {
    await prisma.wardenRelationship.create({
      data: {
        inmateId: inmates[0].id,
        wardenId: wardens[0].id,
        status: 'active',
        isPrimary: true,
        acceptedAt: new Date(),
      },
    });
    console.log(`Created warden relationship: ${inmates[0].email} <-> ${wardens[0].email}`);
  }

  // Create devices for inmates
  for (const inmate of inmates.slice(0, 2)) {
    const iosDevice = await prisma.device.create({
      data: {
        userId: inmate.id,
        deviceFingerprint: `ios-${inmate.id}-fingerprint`,
        platform: 'ios',
        deviceName: 'iPhone 13 Pro',
        osVersion: 'iOS 17.2',
        appVersion: '0.1.0',
      },
    });
    console.log(`Created iOS device for ${inmate.email}`);

    const windowsDevice = await prisma.device.create({
      data: {
        userId: inmate.id,
        deviceFingerprint: `windows-${inmate.id}-fingerprint`,
        platform: 'windows',
        deviceName: 'Windows Desktop',
        osVersion: 'Windows 11',
        appVersion: '0.1.0',
      },
    });
    console.log(`Created Windows device for ${inmate.email}`);

    // Create time budgets
    await prisma.timeBudget.create({
      data: {
        userId: inmate.id,
        isWeekend: false,
        minutesAllowed: 60,
      },
    });

    await prisma.timeBudget.create({
      data: {
        userId: inmate.id,
        isWeekend: true,
        minutesAllowed: 120,
      },
    });
    console.log(`Created time budgets for ${inmate.email}`);

    // Create whitelist items
    for (const item of whitelistFixture.essentials.slice(0, 4)) {
      await prisma.whitelistItem.create({
        data: {
          userId: inmate.id,
          name: item.name,
          iosBundleId: item.iosBundleId,
          windowsDomain: item.windowsDomain,
          androidPackageName: item.androidPackageName,
          category: item.category,
          isEnabled: true,
        },
      });
    }
    console.log(`Created whitelist items for ${inmate.email}`);

    // Create some usage logs
    const now = new Date();
    await prisma.usageLog.create({
      data: {
        userId: inmate.id,
        deviceId: iosDevice.id,
        startTime: new Date(now.getTime() - 600000), // 10 minutes ago
        endTime: new Date(now.getTime() - 300000), // 5 minutes ago
        secondsUsed: 300, // 5 minutes
        wasWhitelisted: false,
      },
    });
    console.log(`Created usage log for ${inmate.email}`);
  }

  // Create default whitelist items
  const allWhitelistItems = [
    ...whitelistFixture.essentials,
    ...whitelistFixture.healthy,
    ...whitelistFixture.work,
  ];

  for (const item of allWhitelistItems) {
    await prisma.defaultWhitelistItem.create({
      data: {
        name: item.name,
        iosBundleId: item.iosBundleId,
        windowsDomain: item.windowsDomain,
        androidPackageName: item.androidPackageName,
        category: item.category,
      },
    });
  }
  console.log(`Created ${allWhitelistItems.length} default whitelist items`);

  console.log('Test database seed completed!');
}

seed()
  .catch((e) => {
    console.error('Error seeding test database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
