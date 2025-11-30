import { Controller, Get, Put, Body, Query, UseGuards, Req } from '@nestjs/common';
import { TimeService } from './time.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimeBudgetConfigSchema, GetUsageLogsSchema } from '@cellblock/contracts';

@Controller('time')
@UseGuards(JwtAuthGuard)
export class TimeController {
  constructor(private timeService: TimeService) {}

  /**
   * Get current time status
   */
  @Get('status')
  async getStatus(@Req() req: any) {
    return this.timeService.getTimeStatus(req.user.id);
  }

  /**
   * Update time budget configuration
   */
  @Put('budget')
  async updateBudget(@Req() req: any, @Body() body: any) {
    const data = TimeBudgetConfigSchema.parse(body);
    return this.timeService.updateTimeBudget(req.user.id, data);
  }

  /**
   * Get usage logs with pagination
   */
  @Get('usage')
  async getUsage(@Req() req: any, @Query() query: any) {
    const params = GetUsageLogsSchema.parse(query);
    return this.timeService.getUsageLogs(
      req.user.id,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined,
      params.deviceId,
      params.page,
      params.limit
    );
  }
}
