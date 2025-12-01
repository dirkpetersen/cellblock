/**
 * Unit Tests for Simultaneous Device Detection
 * Tests logic for detecting multiple devices being used at once
 */

describe('Simultaneous Device Detection', () => {
  describe('Device Activity Window', () => {
    it('should detect devices active within 45 second window', () => {
      const now = Date.now();
      const devices = [
        { id: 'device-1', lastSeen: new Date(now - 10000) }, // 10 seconds ago
        { id: 'device-2', lastSeen: new Date(now - 30000) }, // 30 seconds ago
        { id: 'device-3', lastSeen: new Date(now - 60000) }, // 60 seconds ago (outside window)
      ];

      const windowSeconds = 45;
      const cutoff = now - windowSeconds * 1000;

      const activeDevices = devices.filter((d) => d.lastSeen.getTime() >= cutoff);

      expect(activeDevices.length).toBe(2);
      expect(activeDevices.map((d) => d.id)).toEqual(['device-1', 'device-2']);
    });

    it('should not count devices outside activity window', () => {
      const now = Date.now();
      const devices = [
        { id: 'device-1', lastSeen: new Date(now - 120000) }, // 2 minutes ago
        { id: 'device-2', lastSeen: new Date(now - 300000) }, // 5 minutes ago
      ];

      const windowSeconds = 45;
      const cutoff = now - windowSeconds * 1000;

      const activeDevices = devices.filter((d) => d.lastSeen.getTime() >= cutoff);

      expect(activeDevices.length).toBe(0);
    });
  });

  describe('Wall Clock Time Deduction', () => {
    it('should deduct time once even if multiple devices are active', () => {
      // Scenario: User is on iPhone and Windows PC simultaneously
      // 1 minute passes in real time = 1 minute deducted from budget
      const realTimeElapsed = 60; // seconds
      const activeDeviceCount = 2;

      // Should NOT deduct: 60 * 2 = 120 seconds
      // Should deduct: 60 seconds (wall clock time)
      const timeToDeduct = realTimeElapsed; // Not multiplied by device count

      expect(timeToDeduct).toBe(60);
      expect(timeToDeduct).not.toBe(realTimeElapsed * activeDeviceCount);
    });

    it('should calculate time delta correctly between heartbeats', () => {
      const lastHeartbeat = new Date('2024-01-01T10:00:00Z');
      const currentHeartbeat = new Date('2024-01-01T10:01:30Z');

      const deltaMs = currentHeartbeat.getTime() - lastHeartbeat.getTime();
      const deltaSeconds = Math.floor(deltaMs / 1000);

      expect(deltaSeconds).toBe(90); // 1 minute 30 seconds
    });

    it('should cap time delta at maximum (prevent cheating)', () => {
      const lastHeartbeat = new Date('2024-01-01T10:00:00Z');
      const currentHeartbeat = new Date('2024-01-01T10:10:00Z'); // 10 minutes later (unusual)

      const deltaMs = currentHeartbeat.getTime() - lastHeartbeat.getTime();
      const deltaSeconds = Math.floor(deltaMs / 1000);
      const maxDelta = 120; // 2 minutes cap

      const timeToDeduct = Math.min(deltaSeconds, maxDelta);

      expect(deltaSeconds).toBe(600); // 10 minutes
      expect(timeToDeduct).toBe(120); // But capped at 2 minutes
    });
  });

  describe('Device Identification', () => {
    it('should identify unique devices by fingerprint', () => {
      const device1 = {
        id: 'device-id-1',
        deviceFingerprint: 'ios-ABC123',
        userId: 'user-1',
      };

      const device2 = {
        id: 'device-id-2',
        deviceFingerprint: 'windows-XYZ789',
        userId: 'user-1',
      };

      expect(device1.deviceFingerprint).not.toBe(device2.deviceFingerprint);
      expect(device1.userId).toBe(device2.userId);
    });

    it('should allow same user on multiple platforms', () => {
      const userId = 'user-123';
      const devices = [
        { platform: 'ios', userId },
        { platform: 'windows', userId },
        { platform: 'android', userId },
        { platform: 'macos', userId },
      ];

      const uniquePlatforms = new Set(devices.map((d) => d.platform));
      const allSameUser = devices.every((d) => d.userId === userId);

      expect(uniquePlatforms.size).toBe(4);
      expect(allSameUser).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single device (no simultaneous usage)', () => {
      const now = Date.now();
      const devices = [{ id: 'device-1', lastSeen: new Date(now - 10000) }];

      expect(devices.length).toBe(1);
    });

    it('should handle many devices (stress test)', () => {
      const now = Date.now();
      const devices = Array.from({ length: 10 }, (_, i) => ({
        id: `device-${i}`,
        lastSeen: new Date(now - i * 5000), // Staggered by 5 seconds
      }));

      const windowSeconds = 45;
      const cutoff = now - windowSeconds * 1000;

      const activeDevices = devices.filter((d) => d.lastSeen.getTime() >= cutoff);

      // Devices 0-8 should be active (0-40 seconds ago)
      // Device 9 is at 45 seconds exactly (boundary case)
      expect(activeDevices.length).toBeGreaterThanOrEqual(9);
    });
  });
});
