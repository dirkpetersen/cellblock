/**
 * Integration Tests for Authentication API
 * Tests the complete auth flow including registration, login, email verification
 */

import * as request from 'supertest';
import { cleanDatabase, getTestPrismaClient } from '../utils/test-database';
import { UserFactory } from '../utils/factories';

const API_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';

describe('Auth API Integration Tests', () => {
  const prisma = getTestPrismaClient();

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'StrongPassword123!',
        displayName: 'Test User',
      };

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/register`)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(userData.email);
      expect(response.body.displayName).toBe(userData.displayName);
      expect(response.body.isEmailVerified).toBe(false);
      expect(response.body).not.toHaveProperty('hashedPassword');
    });

    it('should reject registration with existing email', async () => {
      const email = 'duplicate@test.com';
      await UserFactory.create({ email, password: 'Password123!' });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/register`)
        .send({
          email,
          password: 'NewPassword123!',
          displayName: 'Duplicate User',
        })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject weak passwords', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/register`)
        .send({
          email: 'weakpass@test.com',
          password: '123', // Too weak
          displayName: 'Weak Pass User',
        })
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('should reject invalid email format', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/register`)
        .send({
          email: 'not-an-email',
          password: 'StrongPassword123!',
          displayName: 'Invalid Email User',
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'TestPassword123!';
      const user = await UserFactory.create({
        email: 'login@test.com',
        password,
        isEmailVerified: true,
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(user.id);
    });

    it('should reject login with wrong password', async () => {
      const user = await UserFactory.create({
        email: 'wrongpass@test.com',
        password: 'CorrectPassword123!',
        isEmailVerified: true,
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should allow login even if email not verified', async () => {
      const password = 'TestPassword123!';
      const user = await UserFactory.create({
        email: 'unverified@test.com',
        password,
        isEmailVerified: false,
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.isEmailVerified).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const password = 'TestPassword123!';
      const user = await UserFactory.create({
        email: 'refresh@test.com',
        password,
        isEmailVerified: true,
      });

      // Login to get tokens
      const loginResponse = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      const { refreshToken } = loginResponse.body;

      // Refresh the token
      const refreshResponse = await request(API_URL)
        .post(`${API_PREFIX}/auth/refresh`)
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');
      expect(refreshResponse.body.accessToken).not.toBe(loginResponse.body.accessToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/refresh`)
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      const password = 'TestPassword123!';
      const user = await UserFactory.create({
        email: 'me@test.com',
        password,
        displayName: 'Current User',
        isEmailVerified: true,
      });

      // Login
      const loginResponse = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      const { accessToken } = loginResponse.body;

      // Get profile
      const response = await request(API_URL)
        .get(`${API_PREFIX}/auth/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(user.id);
      expect(response.body.email).toBe(user.email);
      expect(response.body.displayName).toBe(user.displayName);
      expect(response.body).not.toHaveProperty('hashedPassword');
    });

    it('should reject request without auth token', async () => {
      const response = await request(API_URL).get(`${API_PREFIX}/auth/me`).expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(API_URL)
        .get(`${API_PREFIX}/auth/me`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and invalidate tokens', async () => {
      const password = 'TestPassword123!';
      const user = await UserFactory.create({
        email: 'logout@test.com',
        password,
        isEmailVerified: true,
      });

      // Login
      const loginResponse = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password,
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body;

      // Logout
      await request(API_URL)
        .post(`${API_PREFIX}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use refresh token (should fail)
      await request(API_URL).post(`${API_PREFIX}/auth/refresh`).send({ refreshToken }).expect(401);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const user = await UserFactory.create({
        email: 'verify@test.com',
        password: 'TestPassword123!',
        isEmailVerified: false,
      });

      // Generate verification token (this would normally be done by the backend)
      const verificationToken = 'test-verification-token';
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: verificationToken },
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/verify-email`)
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toContain('verified');

      // Check user is now verified
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.isEmailVerified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/verify-email`)
        .send({ token: 'invalid-token' })
        .expect(404);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      const user = await UserFactory.create({
        email: 'forgot@test.com',
        password: 'OldPassword123!',
        isEmailVerified: true,
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/forgot-password`)
        .send({ email: user.email })
        .expect(200);

      expect(response.body.message).toContain('sent');

      // Check reset token was created
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.passwordResetToken).toBeTruthy();
      expect(updatedUser?.passwordResetExpires).toBeTruthy();
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/forgot-password`)
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      // Should still return success to prevent email enumeration
      expect(response.body.message).toContain('sent');
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await UserFactory.create({
        email: 'reset@test.com',
        password: 'OldPassword123!',
        isEmailVerified: true,
      });

      // Generate reset token
      const resetToken = 'test-reset-token';
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      const newPassword = 'NewPassword123!';
      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/reset-password`)
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.message).toContain('reset');

      // Try to login with new password
      const loginResponse = await request(API_URL)
        .post(`${API_PREFIX}/auth/login`)
        .send({
          email: user.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should reject expired reset token', async () => {
      const user = await UserFactory.create({
        email: 'expired@test.com',
        password: 'OldPassword123!',
        isEmailVerified: true,
      });

      // Generate expired reset token
      const resetToken = 'expired-reset-token';
      const resetExpires = new Date(Date.now() - 1000); // Expired 1 second ago
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      const response = await request(API_URL)
        .post(`${API_PREFIX}/auth/reset-password`)
        .send({
          token: resetToken,
          password: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.message).toContain('expired');
    });
  });
});
