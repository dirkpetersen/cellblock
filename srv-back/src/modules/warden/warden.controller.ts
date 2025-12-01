import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WardenService } from './warden.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  InviteWardenSchema,
  AcceptWardenInviteSchema,
  ApproveRequestSchema,
  GrantParoleSchema,
  TriggerLockdownSchema,
  ResignWardenSchema,
} from '@cellblock/contracts';

@Controller('warden')
@UseGuards(JwtAuthGuard)
export class WardenController {
  constructor(private wardenService: WardenService) {}

  /**
   * Invite a warden (inmate action)
   */
  @Post('invite')
  async inviteWarden(@Req() req: any, @Body() body: any) {
    const data = InviteWardenSchema.parse(body);
    return this.wardenService.inviteWarden(req.user.id, data);
  }

  /**
   * Accept warden invitation
   */
  @Post('accept')
  async acceptInvitation(@Req() req: any, @Body() body: any) {
    const data = AcceptWardenInviteSchema.parse(body);
    return this.wardenService.acceptInvitation(req.user.id, data.token);
  }

  /**
   * Get all inmates (for warden dashboard)
   */
  @Get('inmates')
  async getInmates(@Req() req: any) {
    return this.wardenService.getInmates(req.user.id);
  }

  /**
   * Get all wardens (for inmate)
   */
  @Get('my-wardens')
  async getMyWardens(@Req() req: any) {
    return this.wardenService.getWardens(req.user.id);
  }

  /**
   * Get pending requests (for warden)
   */
  @Get('requests/pending')
  async getPendingRequests(@Req() req: any) {
    return this.wardenService.getPendingRequests(req.user.id);
  }

  /**
   * Get request history for specific inmate
   */
  @Get('inmates/:inmateId/requests')
  async getInmateRequests(@Req() req: any, @Param('inmateId') inmateId: string) {
    return this.wardenService.getInmateRequests(req.user.id, inmateId);
  }

  /**
   * Approve or deny a request
   */
  @Post('approve')
  async approveRequest(@Req() req: any, @Body() body: any) {
    const data = ApproveRequestSchema.parse(body);
    return this.wardenService.approveRequest(req.user.id, data);
  }

  /**
   * Grant parole (emergency time)
   */
  @Post('parole')
  async grantParole(@Req() req: any, @Body() body: any) {
    const data = GrantParoleSchema.parse(body);
    return this.wardenService.grantParole(req.user.id, data);
  }

  /**
   * Trigger lockdown
   */
  @Post('lockdown')
  async triggerLockdown(@Req() req: any, @Body() body: any) {
    const data = TriggerLockdownSchema.parse(body);
    return this.wardenService.triggerLockdown(req.user.id, data);
  }

  /**
   * Resign from supervising an inmate
   */
  @Post('resign')
  async resign(@Req() req: any, @Body() body: any) {
    const data = ResignWardenSchema.parse(body);
    return this.wardenService.resign(req.user.id, data.inmateId);
  }
}
