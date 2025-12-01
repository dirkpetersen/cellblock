import { Controller, Get, Post, Delete, Put, Body, Query, UseGuards, Req } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimitGuard, RateLimit } from '../../common/guards/rate-limit.guard';
import {
  AddWhitelistItemSchema,
  RemoveWhitelistItemSchema,
  ToggleHealthyAppSchema,
} from '@cellblock/contracts';

@Controller('whitelist')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class WhitelistController {
  constructor(private whitelistService: WhitelistService) {}

  /**
   * Get all whitelist items
   */
  @Get()
  async getWhitelist(@Req() req: any, @Query('platform') _platform?: string) {
    return this.whitelistService.getUserWhitelist(req.user.id);
  }

  /**
   * Get enabled whitelist items only
   */
  @Get('enabled')
  async getEnabledWhitelist(@Req() req: any, @Query('platform') platform?: string) {
    return this.whitelistService.getEnabledWhitelist(req.user.id, platform);
  }

  /**
   * Request to add whitelist item
   * Rate limited: 10 requests per hour
   */
  @Post()
  @RateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 })
  async addWhitelistItem(@Req() req: any, @Body() body: any) {
    const data = AddWhitelistItemSchema.parse(body);
    return this.whitelistService.requestAddWhitelistItem(req.user.id, data);
  }

  /**
   * Request to remove whitelist item
   * Rate limited: 10 requests per hour
   */
  @Delete()
  @RateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 })
  async removeWhitelistItem(@Req() req: any, @Body() body: any) {
    const data = RemoveWhitelistItemSchema.parse(body);
    return this.whitelistService.requestRemoveWhitelistItem(req.user.id, data);
  }

  /**
   * Toggle healthy app enabled/disabled
   * Rate limited: 10 requests per hour
   */
  @Put('toggle')
  @RateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 })
  async toggleHealthyApp(@Req() req: any, @Body() body: any) {
    const data = ToggleHealthyAppSchema.parse(body);
    return this.whitelistService.toggleHealthyApp(req.user.id, data);
  }

  /**
   * Check if specific app/domain is whitelisted
   */
  @Get('check')
  async checkWhitelisted(
    @Req() req: any,
    @Query('platform') platform: string,
    @Query('identifier') identifier: string
  ) {
    const isWhitelisted = await this.whitelistService.isWhitelisted(
      req.user.id,
      platform,
      identifier
    );
    return { isWhitelisted };
  }
}
