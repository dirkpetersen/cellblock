import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SignupInput, LoginInput } from '@cellblock/contracts';
import { randomBytes } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService
  ) {}

  /**
   * Register a new user with email and password
   */
  async signup(signupData: SignupInput) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupData.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupData.password, 12);

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: signupData.email.toLowerCase(),
        hashedPassword,
        displayName: signupData.displayName,
        emailVerificationToken,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        isEmailVerified: true,
        timezone: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    // Send verification email
    await this.notificationsService.sendVerificationEmail(user.email, emailVerificationToken);

    // Initialize default time budget (2 hours daily, 14 hours weekly)
    await this.createDefaultTimeBudget(user.id);

    // Copy default whitelist items (utility and healthy apps)
    await this.copyDefaultWhitelist(user.id);

    return {
      user,
      message: 'Account created successfully. Please check your email to verify your account.',
    };
  }

  /**
   * Login with email and password
   */
  async login(loginData: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginData.email.toLowerCase() },
    });

    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('This account has been deleted');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.hashedPassword);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
      },
      ...tokens,
    };
  }

  /**
   * Google OAuth login/signup
   */
  async googleLogin(googleUser: any) {
    const email = googleUser.email.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user from Google
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: googleUser.displayName || googleUser.name,
          oauthProvider: 'google',
          oauthProviderId: googleUser.id,
          isEmailVerified: true, // Google emails are pre-verified
        },
      });

      this.logger.log(`New user via Google OAuth: ${user.email}`);

      // Initialize defaults
      await this.createDefaultTimeBudget(user.id);
      await this.copyDefaultWhitelist(user.id);
    } else if (!user.oauthProvider) {
      // Link existing email/password account with Google
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: 'google',
          oauthProviderId: googleUser.id,
          isEmailVerified: true,
        },
      });
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('This account has been deleted');
    }

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
      },
      ...tokens,
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });

    this.logger.log(`Email verified: ${user.email}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt,
      },
    });

    this.logger.log(`Password reset requested: ${user.email}`);

    // Send reset email
    await this.notificationsService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    this.logger.log(`Password reset completed: ${user.email}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const session = await this.prisma.session.findFirst({
        where: {
          userId: payload.sub,
          refreshToken,
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken(payload.sub);

      // Update session last activity
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout (invalidate session)
   */
  async logout(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        refreshToken,
      },
    });

    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(userId: string) {
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    // Store refresh token in sessions table
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Generate access token (short-lived)
   */
  private async generateAccessToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId },
      {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRY') || '15m',
      }
    );
  }

  /**
   * Generate refresh token (long-lived)
   */
  private async generateRefreshToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRY') || '7d',
      }
    );
  }

  /**
   * Create default time budget (2 hours daily, 14 hours weekly)
   */
  private async createDefaultTimeBudget(userId: string) {
    // Create weekday/weekend budget
    await this.prisma.timeBudget.createMany({
      data: [
        {
          userId,
          isWeekend: false,
          minutesAllowed: 120, // 2 hours
          weeklyMaxMinutes: 840, // 14 hours
        },
        {
          userId,
          isWeekend: true,
          minutesAllowed: 120, // 2 hours
          weeklyMaxMinutes: 840, // 14 hours
        },
      ],
    });

    this.logger.log(`Created default time budget for user: ${userId}`);
  }

  /**
   * Copy default whitelist items to new user
   */
  private async copyDefaultWhitelist(userId: string) {
    const defaultItems = await this.prisma.defaultWhitelistItem.findMany();

    const whitelistItems = defaultItems.map((item) => ({
      userId,
      name: item.name,
      iosBundleId: item.iosBundleId,
      windowsDomain: item.windowsDomain,
      androidPackageName: item.androidPackageName,
      category: item.category,
      isEnabled: true,
    }));

    await this.prisma.whitelistItem.createMany({
      data: whitelistItems,
    });

    this.logger.log(`Copied ${whitelistItems.length} default whitelist items for user: ${userId}`);
  }
}
