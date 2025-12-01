import { Controller, Get, Put, Delete, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserSchema, DeleteAccountSchema, BreakGlassSchema } from '@cellblock/contracts';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  /**
   * Update current user profile
   */
  @Put('me')
  async updateProfile(@Req() req: any, @Body() body: any) {
    const data = UpdateUserSchema.parse(body);
    return this.usersService.updateProfile(req.user.id, data);
  }

  /**
   * Delete current user account
   */
  @Delete('me')
  async deleteAccount(@Req() req: any, @Body() body: any) {
    const data = DeleteAccountSchema.parse(body);
    // TODO: Verify password before deletion
    return this.usersService.deleteAccount(req.user.id);
  }

  /**
   * Trigger break glass (emergency unlock)
   */
  @Post('break-glass')
  async breakGlass(@Req() req: any, @Body() body: any) {
    const data = BreakGlassSchema.parse(body);
    return this.usersService.breakGlass(req.user.id, data.comment);
  }
}
