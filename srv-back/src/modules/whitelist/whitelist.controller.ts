import { Controller, Get, Post, Delete, Put, Body, Query, UseGuards, Req } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AddWhitelistItemSchema,
  RemoveWhitelistItemSchema,
  ToggleHealthyAppSchema,
} from '@cellblock/contracts';

@Controller('whitelist')
@UseGuards(JwtAuthGuard)
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
   */
  @Post()
  async addWhitelistItem(@Req() req: any, @Body() body: any) {
    const data = AddWhitelistItemSchema.parse(body);
    return this.whitelistService.requestAddWhitelistItem(req.user.id, data);
  }

  /**
   * Request to remove whitelist item
   */
  @Delete()
  async removeWhitelistItem(@Req() req: any, @Body() body: any) {
    const data = RemoveWhitelistItemSchema.parse(body);
    return this.whitelistService.requestRemoveWhitelistItem(req.user.id, data);
  }

  /**
   * Toggle healthy app enabled/disabled
   */
  @Put('toggle')
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
