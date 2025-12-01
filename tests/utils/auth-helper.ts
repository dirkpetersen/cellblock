/**
 * Authentication Helper for Tests
 * Provides utilities to authenticate users and manage JWT tokens
 */

import { User } from '@prisma/client';
import * as request from 'supertest';

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login a user and return JWT tokens
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthTokens> {
  const response = await request(API_BASE_URL)
    .post('/api/v1/auth/login')
    .send(credentials)
    .expect(200);

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
}

/**
 * Register a new user and return the created user
 */
export async function registerUser(
  credentials: LoginCredentials & { displayName?: string }
): Promise<User> {
  const response = await request(API_BASE_URL)
    .post('/api/v1/auth/register')
    .send({
      email: credentials.email,
      password: credentials.password,
      displayName: credentials.displayName || 'Test User',
    })
    .expect(201);

  return response.body;
}

/**
 * Get authentication headers for making authenticated requests
 */
export function getAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Verify email for a user (for testing)
 */
export async function verifyUserEmail(userId: string, token: string): Promise<void> {
  await request(API_BASE_URL).post('/api/v1/auth/verify-email').send({ token }).expect(200);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await request(API_BASE_URL).post('/api/v1/auth/forgot-password').send({ email }).expect(200);
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await request(API_BASE_URL)
    .post('/api/v1/auth/reset-password')
    .send({ token, password: newPassword })
    .expect(200);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  const response = await request(API_BASE_URL)
    .post('/api/v1/auth/refresh')
    .send({ refreshToken })
    .expect(200);

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
}

/**
 * Logout user (invalidate tokens)
 */
export async function logoutUser(accessToken: string): Promise<void> {
  await request(API_BASE_URL)
    .post('/api/v1/auth/logout')
    .set(getAuthHeaders(accessToken))
    .expect(200);
}

/**
 * Get current authenticated user profile
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  const response = await request(API_BASE_URL)
    .get('/api/v1/auth/me')
    .set(getAuthHeaders(accessToken))
    .expect(200);

  return response.body;
}

/**
 * Helper to create and login a user in one step
 */
export async function createAndLoginUser(
  email: string = 'test@example.com',
  password: string = 'TestPassword123!',
  displayName: string = 'Test User'
): Promise<{ user: User; tokens: AuthTokens }> {
  const user = await registerUser({ email, password, displayName });
  const tokens = await loginUser({ email, password });

  return { user, tokens };
}
