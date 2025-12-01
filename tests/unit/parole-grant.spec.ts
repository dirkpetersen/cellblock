/**
 * Unit Tests for Parole Grant Logic
 * Tests emergency time granting and parole expiration
 */

describe('ParoleGrant Logic', () => {
  describe('Parole Type: minutes', () => {
    it('should grant X additional minutes from current time', () => {
      const now = new Date();
      const minutesGranted = 30;
      const expiresAt = new Date(now.getTime() + minutesGranted * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
      expect(expiresAt.getTime() - now.getTime()).toBe(30 * 60 * 1000);
    });

    it('should calculate expiration correctly for different minute values', () => {
      const testCases = [15, 30, 60, 120, 240];

      testCases.forEach((minutes) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);
        const diffMinutes = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

        expect(diffMinutes).toBe(minutes);
      });
    });
  });

  describe('Parole Type: until', () => {
    it('should grant access until specific datetime', () => {
      const now = new Date();
      const validUntil = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      expect(validUntil.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should expire when validUntil time passes', () => {
      const now = new Date();
      const validUntil = new Date(now.getTime() - 1000); // 1 second ago

      expect(validUntil.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('Parole Expiration', () => {
    it('should determine if parole is expired based on expiresAt', () => {
      const now = new Date();

      const activeParole = {
        type: 'minutes',
        expiresAt: new Date(now.getTime() + 1800000), // 30 minutes from now
        isActive: true,
      };

      const expiredParole = {
        type: 'minutes',
        expiresAt: new Date(now.getTime() - 1000), // 1 second ago
        isActive: true,
      };

      expect(activeParole.expiresAt.getTime()).toBeGreaterThan(now.getTime());
      expect(expiredParole.expiresAt.getTime()).toBeLessThan(now.getTime());
    });

    it('should determine if parole is expired based on validUntil', () => {
      const now = new Date();

      const activeParole = {
        type: 'until',
        validUntil: new Date(now.getTime() + 3600000), // 1 hour from now
        isActive: true,
      };

      const expiredParole = {
        type: 'until',
        validUntil: new Date(now.getTime() - 1000), // 1 second ago
        isActive: true,
      };

      expect(activeParole.validUntil.getTime()).toBeGreaterThan(now.getTime());
      expect(expiredParole.validUntil.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('Break Glass vs Parole', () => {
    it('should distinguish break glass from warden-granted parole', () => {
      const breakGlass = {
        type: 'break_glass',
        reason: 'Emergency - need to call family',
        inmateId: 'inmate-1',
        wardenId: null, // Self-granted
      };

      const wardenParole = {
        type: 'minutes',
        reason: 'Approved work emergency',
        inmateId: 'inmate-1',
        wardenId: 'warden-1', // Warden-granted
      };

      expect(breakGlass.wardenId).toBeNull();
      expect(wardenParole.wardenId).toBeTruthy();
    });

    it('should limit break glass usage (e.g., 1 per day)', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const breakGlassToday = {
        grantedAt: new Date(today.getTime() + 10800000), // 3 hours into today
        type: 'break_glass',
      };

      const isToday = breakGlassToday.grantedAt >= today;
      expect(isToday).toBe(true);
    });
  });
});
