import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import {
  SignupSchema,
  LoginSchema,
  PasswordResetRequestSchema,
  PasswordResetSchema,
  EmailVerificationSchema,
} from '@cellblock/contracts';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Sign up with email and password
   */
  @Post('signup')
  async signup(@Body() body: any) {
    const data = SignupSchema.parse(body);
    return this.authService.signup(data);
  }

  /**
   * Login with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const data = LoginSchema.parse(body);
    const result = await this.authService.login(data);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  /**
   * Google OAuth login
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * Google OAuth callback
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  /**
   * Verify email
   */
  @Post('verify-email')
  async verifyEmail(@Body() body: any) {
    const data = EmailVerificationSchema.parse(body);
    return this.authService.verifyEmail(data.token);
  }

  /**
   * Request password reset
   */
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() body: any) {
    const data = PasswordResetRequestSchema.parse(body);
    return this.authService.requestPasswordReset(data.email);
  }

  /**
   * Reset password with token
   */
  @Post('password-reset/confirm')
  async resetPassword(@Body() body: any) {
    const data = PasswordResetSchema.parse(body);
    return this.authService.resetPassword(data.token, data.password);
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    const userId = req.user.id;

    if (refreshToken) {
      await this.authService.logout(userId, refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    return { user };
  }

  // Import PrismaService reference
  private get prisma() {
    return this.authService['prisma'];
  }
}
