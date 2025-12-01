import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default whitelist items...');

  // Seed iOS utility apps
  const iosUtilityApps = [
    { name: 'Phone', iosBundleId: 'com.apple.mobilephone', category: 'utility' },
    { name: 'Messages', iosBundleId: 'com.apple.MobileSMS', category: 'utility' },
    { name: 'FaceTime', iosBundleId: 'com.apple.facetime', category: 'utility' },
    { name: 'Maps', iosBundleId: 'com.apple.Maps', category: 'utility' },
    { name: 'Calendar', iosBundleId: 'com.apple.mobilecal', category: 'utility' },
    { name: 'Clock', iosBundleId: 'com.apple.mobiletimer', category: 'utility' },
    { name: 'Calculator', iosBundleId: 'com.apple.calculator', category: 'utility' },
    { name: 'Google Maps', iosBundleId: 'com.google.Maps', category: 'utility' },
    { name: 'Waze', iosBundleId: 'com.waze.iphone', category: 'utility' },
    { name: 'Cisco Secure Client', iosBundleId: 'com.cisco.secureclient', category: 'utility' },
    // Banking apps
    { name: 'Chase', iosBundleId: 'com.chase.sig.android', category: 'utility' },
    {
      name: 'Bank of America',
      iosBundleId: 'com.bankofamerica.mobileapps.iphone',
      category: 'utility',
    },
    { name: 'Wells Fargo', iosBundleId: 'com.wf.wellsfargomobile', category: 'utility' },
    { name: 'Citi Mobile', iosBundleId: 'com.citi.citimobile', category: 'utility' },
    {
      name: 'Capital One',
      iosBundleId: 'com.capitalone.enterprisemobilebanking',
      category: 'utility',
    },
    { name: 'US Bank', iosBundleId: 'com.usbank.mobilebanking', category: 'utility' },
    { name: 'PNC Mobile', iosBundleId: 'com.pnc.ecommerce.mobile', category: 'utility' },
    { name: 'TD Bank', iosBundleId: 'com.tdbank.myspend', category: 'utility' },
    { name: 'Schwab Mobile', iosBundleId: 'com.schwab.mobile', category: 'utility' },
    { name: 'Fidelity', iosBundleId: 'com.fidelity.fidelity', category: 'utility' },
    { name: 'Venmo', iosBundleId: 'com.venmo.Venmo', category: 'utility' },
    { name: 'PayPal', iosBundleId: 'com.paypal.android.p2pmobile', category: 'utility' },
    { name: 'Zelle', iosBundleId: 'com.zellepay.zelle', category: 'utility' },
  ];

  // Seed iOS healthy apps
  const iosHealthyApps = [
    { name: 'Spotify', iosBundleId: 'com.spotify.client', category: 'healthy' },
    { name: 'Audible', iosBundleId: 'com.audible.iphone', category: 'healthy' },
    { name: 'Apple Music', iosBundleId: 'com.apple.Music', category: 'healthy' },
    { name: 'Podcasts', iosBundleId: 'com.apple.podcasts', category: 'healthy' },
    { name: 'Kindle', iosBundleId: 'com.amazon.Kindle', category: 'healthy' },
    { name: 'Apple Books', iosBundleId: 'com.apple.iBooks', category: 'healthy' },
    { name: 'Libby', iosBundleId: 'com.overdrive.libby', category: 'healthy' },
  ];

  // Seed Windows utility domains
  const windowsUtilityDomains = [
    { name: 'Google Maps', windowsDomain: 'maps.google.com', category: 'utility' },
    { name: 'Google Maps Alt', windowsDomain: 'www.google.com/maps', category: 'utility' },
    { name: 'Weather', windowsDomain: 'weather.com', category: 'utility' },
    { name: 'Cisco Secure Client', windowsDomain: '*.webex.com', category: 'utility' },
    // Banking domains
    { name: 'Chase', windowsDomain: 'chase.com', category: 'utility' },
    { name: 'Chase Secure', windowsDomain: 'secure.chase.com', category: 'utility' },
    { name: 'Bank of America', windowsDomain: 'bankofamerica.com', category: 'utility' },
    { name: 'Wells Fargo', windowsDomain: 'wellsfargo.com', category: 'utility' },
    { name: 'Citi', windowsDomain: 'citi.com', category: 'utility' },
    { name: 'Capital One', windowsDomain: 'capitalone.com', category: 'utility' },
    { name: 'US Bank', windowsDomain: 'usbank.com', category: 'utility' },
    { name: 'PNC', windowsDomain: 'pnc.com', category: 'utility' },
    { name: 'TD Bank', windowsDomain: 'td.com', category: 'utility' },
    { name: 'Schwab', windowsDomain: 'schwab.com', category: 'utility' },
    { name: 'Fidelity', windowsDomain: 'fidelity.com', category: 'utility' },
    { name: 'Vanguard', windowsDomain: 'vanguard.com', category: 'utility' },
    { name: 'PayPal', windowsDomain: 'paypal.com', category: 'utility' },
    { name: 'Venmo', windowsDomain: 'venmo.com', category: 'utility' },
  ];

  // Seed Windows healthy domains
  const windowsHealthyDomains = [
    { name: 'Spotify', windowsDomain: 'open.spotify.com', category: 'healthy' },
    { name: 'Audible', windowsDomain: 'audible.com', category: 'healthy' },
    { name: 'Kindle', windowsDomain: 'read.amazon.com', category: 'healthy' },
  ];

  // Insert all default items
  for (const item of [
    ...iosUtilityApps,
    ...iosHealthyApps,
    ...windowsUtilityDomains,
    ...windowsHealthyDomains,
  ]) {
    await prisma.defaultWhitelistItem.upsert({
      where: { id: item.iosBundleId || item.windowsDomain || 'dummy' },
      update: {},
      create: item as any,
    });
  }

  console.log(
    `Seeded ${iosUtilityApps.length + iosHealthyApps.length + windowsUtilityDomains.length + windowsHealthyDomains.length} default whitelist items`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
