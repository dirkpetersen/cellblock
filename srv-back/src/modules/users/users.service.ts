import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserInput } from '@cellblock/contracts';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: data.displayName,
        timezone: data.timezone,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string) {
    // Soft delete - data retained for 30 days
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
      },
    });

    // TODO: Notify all wardens about account deletion

    return { message: 'Account deleted successfully' };
  }
}
