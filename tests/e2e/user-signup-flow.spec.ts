/**
 * E2E Test: User Signup and Email Verification Flow
 * Tests the complete user journey from signup to email verification to login
 */

import { test, expect } from '@playwright/test';

test.describe('User Signup Flow', () => {
  test('should complete full signup and verification flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');

    // Fill signup form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('input[name="displayName"]', 'Test User');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Check your email')).toBeVisible();

    // In a real test, we would:
    // 1. Check test email inbox for verification email
    // 2. Extract verification token from email
    // 3. Visit verification URL
    // For now, we'll simulate this

    // Should redirect to verification pending page
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator('text=Verify your email')).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/signup');

    // Try to sign up with existing email
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.fill('input[name="displayName"]', 'Duplicate User');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=already exists')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="email"]', 'weakpass@example.com');
    await page.fill('input[name="password"]', '123'); // Weak password

    // Should show password strength indicator
    await expect(page.locator('text=Password must be')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="email"]', 'mismatch@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    // Should show mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=Forgot password?');

    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Email Verification', () => {
  test('should verify email with valid token', async ({ page }) => {
    // Navigate directly to verification URL with token
    const verificationToken = 'test-token-123';
    await page.goto(`/verify-email?token=${verificationToken}`);

    // Should show success message
    await expect(page.locator('text=Email verified successfully')).toBeVisible();

    // Should have button to go to dashboard
    await page.click('text=Go to Dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error for invalid token', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token');

    await expect(page.locator('text=Invalid or expired verification link')).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    await page.goto('/verify-email');

    await page.click('text=Resend verification email');

    await expect(page.locator('text=Verification email sent')).toBeVisible();
  });
});

test.describe('Password Reset Flow', () => {
  test('should complete password reset flow', async ({ page }) => {
    // Request password reset
    await page.goto('/forgot-password');

    await page.fill('input[name="email"]', 'reset@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Check your email')).toBeVisible();

    // In real test, would get reset token from email
    // Simulate visiting reset link
    const resetToken = 'test-reset-token';
    await page.goto(`/reset-password?token=${resetToken}`);

    // Enter new password
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password reset successfully')).toBeVisible();

    // Should be able to login with new password
    await page.goto('/login');
    await page.fill('input[name="email"]', 'reset@example.com');
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should reject expired reset token', async ({ page }) => {
    const expiredToken = 'expired-reset-token';
    await page.goto(`/reset-password?token=${expiredToken}`);

    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=expired or invalid')).toBeVisible();
  });
});
