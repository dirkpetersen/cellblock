/**
 * E2E Test: Warden Invitation and Management Flow
 * Tests warden invitation, acceptance, and inmate management
 */

import { test, expect } from '@playwright/test';

test.describe('Warden Invitation Flow', () => {
  test('should send warden invitation successfully', async ({ page }) => {
    // Login as inmate
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Navigate to settings
    await page.goto('/dashboard/settings');

    // Go to wardens section
    await page.click('text=Wardens');

    // Click invite warden button
    await page.click('button:has-text("Invite Warden")');

    // Fill invitation form
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('textarea[name="message"]', 'Please be my accountability partner!');

    // Set as primary warden
    await page.check('input[name="isPrimary"]');

    await page.click('button:has-text("Send Invitation")');

    // Should show success message
    await expect(page.locator('text=Invitation sent')).toBeVisible();

    // Should see warden in pending list
    await expect(page.locator('text=warden@example.com')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should prevent inviting more than 4 wardens', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/settings/wardens');

    // Assuming user already has 4 wardens
    await page.click('button:has-text("Invite Warden")');

    // Should show error or disabled button
    await expect(page.locator('text=maximum number of wardens')).toBeVisible();
  });

  test('should cancel pending warden invitation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/settings/wardens');

    // Find pending invitation and click cancel
    await page.locator('[data-testid="pending-warden"]').first().hover();
    await page.click('button:has-text("Cancel")');

    // Confirm cancellation
    await page.click('button:has-text("Yes, Cancel")');

    await expect(page.locator('text=Invitation cancelled')).toBeVisible();
  });
});

test.describe('Warden Acceptance Flow', () => {
  test('should accept warden invitation', async ({ page, context }) => {
    // Simulate warden clicking invitation link from email
    const invitationToken = 'test-invitation-token-123';
    await page.goto(`/warden/accept?token=${invitationToken}`);

    // If warden doesn't have account, should show signup form
    await expect(page.locator('text=Accept Warden Invitation')).toBeVisible();

    // Fill signup form (or login if account exists)
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'WardenPassword123!');
    await page.fill('input[name="displayName"]', 'Warden Name');

    await page.click('button:has-text("Accept & Create Account")');

    // Should redirect to warden dashboard
    await expect(page).toHaveURL(/\/warden\/dashboard/);

    // Should see new inmate in list
    await expect(page.locator('text=inmate@example.com')).toBeVisible();
  });

  test('should show error for invalid invitation token', async ({ page }) => {
    await page.goto('/warden/accept?token=invalid-token');

    await expect(page.locator('text=Invalid or expired invitation')).toBeVisible();
  });

  test('should allow existing user to accept invitation', async ({ page }) => {
    const invitationToken = 'test-invitation-token-456';
    await page.goto(`/warden/accept?token=${invitationToken}`);

    // Click to login instead of signup
    await page.click('text=Already have an account? Log in');

    await page.fill('input[name="email"]', 'existing.warden@example.com');
    await page.fill('input[name="password"]', 'ExistingPassword123!');

    await page.click('button[type="submit"]');

    // Should accept invitation and redirect to dashboard
    await expect(page).toHaveURL(/\/warden\/dashboard/);
    await expect(page.locator('text=Invitation accepted')).toBeVisible();
  });
});

test.describe('Warden Dashboard', () => {
  test('should display all inmates', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/dashboard');

    // Should see list of inmates
    await expect(page.locator('[data-testid="inmate-card"]')).toHaveCount(2);

    // Each inmate card should show:
    await expect(page.locator('text=Time Remaining')).toBeVisible();
    await expect(page.locator('text=View Details')).toBeVisible();
  });

  test('should view inmate details', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/dashboard');

    // Click on first inmate
    await page.locator('[data-testid="inmate-card"]').first().click();

    // Should show detailed view
    await expect(page).toHaveURL(/\/warden\/inmate\//);
    await expect(page.locator('text=Usage Stats')).toBeVisible();
    await expect(page.locator('text=Time Budget')).toBeVisible();
    await expect(page.locator('text=Whitelist')).toBeVisible();
    await expect(page.locator('text=Pending Requests')).toBeVisible();
  });

  test('should show pending requests count', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/dashboard');

    // Should show pending requests badge
    await expect(page.locator('[data-testid="pending-requests-badge"]')).toContainText('3');

    // Click to view requests
    await page.click('text=Pending Requests');

    await expect(page).toHaveURL(/\/warden\/requests/);
    await expect(page.locator('[data-testid="request-card"]')).toHaveCount(3);
  });
});

test.describe('Warden Request Approval', () => {
  test('should approve whitelist request', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/requests');

    // Find whitelist request
    const requestCard = page.locator('[data-testid="request-card"]').filter({
      hasText: 'Whitelist Request',
    }).first();

    // View request details
    await requestCard.click();

    // Should show request details
    await expect(page.locator('text=Requested App:')).toBeVisible();
    await expect(page.locator('text=Reason:')).toBeVisible();

    // Approve request
    await page.click('button:has-text("Approve")');

    // Optional: Add comment
    await page.fill('textarea[name="comment"]', 'Approved for work purposes');

    await page.click('button:has-text("Confirm Approval")');

    await expect(page.locator('text=Request approved')).toBeVisible();
  });

  test('should deny budget increase request', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/requests');

    const requestCard = page.locator('[data-testid="request-card"]').filter({
      hasText: 'Budget Increase',
    }).first();

    await requestCard.click();

    // Deny request
    await page.click('button:has-text("Deny")');

    await page.fill('textarea[name="comment"]', 'Not enough time passed since last increase');

    await page.click('button:has-text("Confirm Denial")');

    await expect(page.locator('text=Request denied')).toBeVisible();
  });
});

test.describe('Parole Grant', () => {
  test('should grant time-based parole', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/dashboard');

    // Click on inmate
    await page.locator('[data-testid="inmate-card"]').first().click();

    // Click grant parole button
    await page.click('button:has-text("Grant Parole")');

    // Select parole type: minutes
    await page.click('input[value="minutes"]');

    // Enter minutes
    await page.fill('input[name="minutes"]', '30');

    // Enter reason
    await page.fill('textarea[name="reason"]', 'Work emergency - urgent meeting');

    await page.click('button:has-text("Grant Parole")');

    await expect(page.locator('text=Parole granted')).toBeVisible();

    // Should see active parole indicator
    await expect(page.locator('text=Active Parole')).toBeVisible();
    await expect(page.locator('text=30 minutes')).toBeVisible();
  });

  test('should grant time-until parole', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/inmate/inmate-id-123');

    await page.click('button:has-text("Grant Parole")');

    // Select parole type: until
    await page.click('input[value="until"]');

    // Select date/time
    await page.fill('input[name="validUntil"]', '2024-12-31T23:59');

    await page.fill('textarea[name="reason"]', 'Extended access for project deadline');

    await page.click('button:has-text("Grant Parole")');

    await expect(page.locator('text=Parole granted')).toBeVisible();
  });

  test('should revoke active parole', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/inmate/inmate-id-123');

    // Should see active parole
    await expect(page.locator('text=Active Parole')).toBeVisible();

    // Click revoke button
    await page.click('button:has-text("Revoke Parole")');

    // Confirm revocation
    await page.click('button:has-text("Yes, Revoke")');

    await expect(page.locator('text=Parole revoked')).toBeVisible();
    await expect(page.locator('text=Active Parole')).not.toBeVisible();
  });
});

test.describe('Lockdown Trigger', () => {
  test('should trigger immediate lockdown', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/inmate/inmate-id-123');

    // Click lockdown button
    await page.click('button:has-text("Trigger Lockdown")');

    // Select immediate
    await page.click('input[value="immediate"]');

    await page.fill('textarea[name="reason"]', 'Excessive usage detected');

    await page.click('button:has-text("Confirm Lockdown")');

    await expect(page.locator('text=Lockdown triggered')).toBeVisible();

    // Should see lockdown indicator
    await expect(page.locator('text=Device Locked')).toBeVisible();
  });

  test('should schedule delayed lockdown', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'warden@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/warden/inmate/inmate-id-123');

    await page.click('button:has-text("Trigger Lockdown")');

    // Select delayed
    await page.click('input[value="delayed"]');

    // Set delay
    await page.fill('input[name="delayMinutes"]', '15');

    await page.fill('textarea[name="reason"]', 'Grace period before bedtime');

    await page.click('button:has-text("Schedule Lockdown")');

    await expect(page.locator('text=Lockdown scheduled')).toBeVisible();
    await expect(page.locator('text=in 15 minutes')).toBeVisible();
  });
});
