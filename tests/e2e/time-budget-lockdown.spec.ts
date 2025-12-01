/**
 * E2E Test: Time Budget Countdown and Lockdown Flow
 * Tests the complete flow of time running out and device lockdown
 */

import { test, expect } from '@playwright/test';

test.describe('Time Budget Flow', () => {
  test('should display remaining time on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Should show time remaining
    await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible();
    await expect(page.locator('text=minutes remaining today')).toBeVisible();

    // Should show progress bar
    await expect(page.locator('[data-testid="time-progress-bar"]')).toBeVisible();
  });

  test('should show 15-minute warning notification', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Wait for WebSocket connection
    await page.waitForTimeout(1000);

    // Simulate 15 minutes remaining (in real scenario, would manipulate time budget)
    // Should show warning notification
    await expect(page.locator('text=15 minutes remaining')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="warning-notification"]')).toHaveClass(/warning/);
  });

  test('should show 5-minute critical warning', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    await page.waitForTimeout(1000);

    // Should show critical warning
    await expect(page.locator('text=5 minutes remaining')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="warning-notification"]')).toHaveClass(/critical/);

    // Should show suggestion to request more time
    await expect(page.locator('text=Request more time')).toBeVisible();
  });

  test('should trigger lockdown when time expires', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Wait for time to expire (simulated)
    await page.waitForTimeout(2000);

    // Should show lockdown screen
    await expect(page.locator("text=Time's Up!")).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Your daily time limit has been reached')).toBeVisible();

    // Should show options
    await expect(page.locator('button:has-text("Request More Time")')).toBeVisible();
    await expect(page.locator('button:has-text("Break Glass Emergency")')).toBeVisible();

    // Should still allow access to whitelisted apps
    await expect(page.locator('text=Whitelisted Apps Available')).toBeVisible();
  });

  test('should display weekly limit status', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Should show weekly stats
    await expect(page.locator('[data-testid="weekly-usage"]')).toBeVisible();
    await expect(page.locator('text=This Week')).toBeVisible();

    // Should show progress toward weekly limit
    const weeklyBar = page.locator('[data-testid="weekly-progress-bar"]');
    await expect(weeklyBar).toBeVisible();
  });

  test('should enforce weekly limit even if daily budget available', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'weekly-limit@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // User has daily time left but weekly limit reached
    await expect(page.locator('text=Weekly limit reached')).toBeVisible();
    await expect(page.locator('[data-testid="lockdown-screen"]')).toBeVisible();

    // Should explain weekly limit
    await expect(page.locator('text=exceeded your weekly allowance')).toBeVisible();
  });
});

test.describe('Break Glass Emergency', () => {
  test('should activate break glass with reason', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Wait for lockdown (time expired)
    await expect(page.locator('button:has-text("Break Glass Emergency")')).toBeVisible({
      timeout: 10000,
    });

    // Click break glass
    await page.click('button:has-text("Break Glass Emergency")');

    // Should show warning modal
    await expect(page.locator('text=Use with Caution')).toBeVisible();
    await expect(page.locator('text=Your warden will be notified')).toBeVisible();

    // Enter reason
    await page.fill('textarea[name="reason"]', 'Family emergency - need to contact hospital');

    // Confirm break glass
    await page.click('button:has-text("Activate Break Glass")');

    // Should unlock temporarily
    await expect(page.locator('text=Break Glass Active')).toBeVisible();
    await expect(page.locator('[data-testid="break-glass-indicator"]')).toBeVisible();

    // Should show time limit on break glass
    await expect(page.locator('text=30 minutes granted')).toBeVisible();
  });

  test('should limit break glass usage per day', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'break-glass-used@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Try to use break glass (already used today)
    await page.click('button:has-text("Break Glass Emergency")');

    // Should show error
    await expect(page.locator('text=already used today')).toBeVisible();
    await expect(page.locator('text=Contact your warden')).toBeVisible();
  });

  test('should notify warden of break glass usage', async ({ page, context }) => {
    // Login as inmate and use break glass
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');
    await page.click('button:has-text("Break Glass Emergency")');
    await page.fill('textarea[name="reason"]', 'Emergency');
    await page.click('button:has-text("Activate Break Glass")');

    // Open new tab as warden
    const wardenPage = await context.newPage();
    await wardenPage.goto('/login');
    await wardenPage.fill('input[name="email"]', 'warden@example.com');
    await wardenPage.fill('input[name="password"]', 'TestPassword123!');
    await wardenPage.click('button[type="submit"]');

    await wardenPage.goto('/warden/dashboard');

    // Should see notification about break glass
    await expect(wardenPage.locator('text=Break Glass Used')).toBeVisible();
    await expect(wardenPage.locator('[data-testid="alert-notification"]')).toBeVisible();
  });
});

test.describe('Time Budget Configuration', () => {
  test('should update time budget settings', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/settings/time-budget');

    // Select weekday/weekend mode
    await page.click('input[value="weekday_weekend"]');

    // Set weekday minutes
    await page.fill('input[name="weekdayMinutes"]', '90');

    // Set weekend minutes
    await page.fill('input[name="weekendMinutes"]', '180');

    // Set weekly max
    await page.fill('input[name="weeklyMaxMinutes"]', '600');

    // Submit (should require warden approval)
    await page.click('button:has-text("Request Changes")');

    // Should show request sent message
    await expect(page.locator('text=Request sent to warden')).toBeVisible();

    // Should still show old settings until approved
    await expect(page.locator('[data-testid="current-weekday-budget"]')).toContainText('60');
  });

  test('should show per-day budget configuration', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/settings/time-budget');

    // Select per-day mode
    await page.click('input[value="per_day"]');

    // Should show all 7 days
    await expect(page.locator('text=Sunday')).toBeVisible();
    await expect(page.locator('text=Monday')).toBeVisible();
    await expect(page.locator('text=Tuesday')).toBeVisible();
    await expect(page.locator('text=Wednesday')).toBeVisible();
    await expect(page.locator('text=Thursday')).toBeVisible();
    await expect(page.locator('text=Friday')).toBeVisible();
    await expect(page.locator('text=Saturday')).toBeVisible();

    // Configure each day
    await page.fill('input[name="sunday"]', '120');
    await page.fill('input[name="monday"]', '60');
    await page.fill('input[name="tuesday"]', '60');
    await page.fill('input[name="wednesday"]', '60');
    await page.fill('input[name="thursday"]', '60');
    await page.fill('input[name="friday"]', '90');
    await page.fill('input[name="saturday"]', '120');

    await page.click('button:has-text("Request Changes")');

    await expect(page.locator('text=Request sent')).toBeVisible();
  });

  test('should display usage analytics', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard/analytics');

    // Should show usage chart
    await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();

    // Should show stats
    await expect(page.locator('text=Daily Average')).toBeVisible();
    await expect(page.locator('text=This Week')).toBeVisible();
    await expect(page.locator('text=Last Week')).toBeVisible();

    // Should show device breakdown
    await expect(page.locator('text=By Device')).toBeVisible();
    await expect(page.locator('text=iPhone')).toBeVisible();
    await expect(page.locator('text=Windows PC')).toBeVisible();
  });
});

test.describe('Real-time Updates', () => {
  test('should update time in real-time via WebSocket', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/dashboard');

    // Get initial time
    const initialTime = await page.locator('[data-testid="time-remaining"]').textContent();

    // Wait for update (heartbeat every 30-60 seconds)
    await page.waitForTimeout(65000);

    // Time should have decreased
    const updatedTime = await page.locator('[data-testid="time-remaining"]').textContent();

    expect(updatedTime).not.toBe(initialTime);
  });

  test('should sync time across multiple tabs', async ({ page, context }) => {
    // Login in first tab
    await page.goto('/login');
    await page.fill('input[name="email"]', 'inmate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.goto('/dashboard');

    const tab1Time = await page.locator('[data-testid="time-remaining"]').textContent();

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/dashboard'); // Should already be logged in

    const tab2Time = await page2.locator('[data-testid="time-remaining"]').textContent();

    // Should show same time
    expect(tab1Time).toBe(tab2Time);

    // Wait for time to decrease
    await page.waitForTimeout(65000);

    // Both tabs should show updated time
    const tab1Updated = await page.locator('[data-testid="time-remaining"]').textContent();
    const tab2Updated = await page2.locator('[data-testid="time-remaining"]').textContent();

    expect(tab1Updated).toBe(tab2Updated);
    expect(tab1Updated).not.toBe(tab1Time);
  });
});
