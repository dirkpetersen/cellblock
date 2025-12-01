import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterDeviceSchema, RemoveDeviceSchema, UpdateDeviceSchema } from '@cellblock/contracts';

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devicesService: DevicesService) {}

  /**
   * Register a new device or update existing
   */
  @Post('register')
  async registerDevice(@Req() req: any, @Body() body: any) {
    const data = RegisterDeviceSchema.parse(body);
    return this.devicesService.registerDevice(req.user.id, data);
  }

  /**
   * Get all user devices
   */
  @Get()
  async getDevices(@Req() req: any) {
    return this.devicesService.getUserDevices(req.user.id);
  }

  /**
   * Get specific device
   */
  @Get(':id')
  async getDevice(@Req() req: any, @Param('id') deviceId: string) {
    return this.devicesService.getDeviceById(deviceId, req.user.id);
  }

  /**
   * Update device name
   */
  @Put(':id')
  async updateDevice(@Req() req: any, @Param('id') deviceId: string, @Body() body: any) {
    const data = UpdateDeviceSchema.parse(body);
    return this.devicesService.updateDeviceName(deviceId, req.user.id, data.deviceName!);
  }

  /**
   * Remove device
   */
  @Delete(':id')
  async removeDevice(@Req() req: any, @Param('id') deviceId: string) {
    return this.devicesService.removeDevice(deviceId, req.user.id);
  }

  /**
   * Register push token for a device
   */
  @Post(':id/push-token')
  async registerPushToken(
    @Req() req: any,
    @Param('id') deviceId: string,
    @Body() body: { platform: string; token: string }
  ) {
    if (!body.platform || !body.token) {
      throw new Error('Platform and token are required');
    }

    return this.devicesService.registerPushToken(
      req.user.id,
      deviceId,
      body.platform,
      body.token
    );
  }

  /**
   * Remove push token for a device
   */
  @Delete(':id/push-token/:platform')
  async removePushToken(
    @Req() req: any,
    @Param('id') deviceId: string,
    @Param('platform') platform: string
  ) {
    return this.devicesService.removePushToken(req.user.id, deviceId, platform);
  }

  /**
   * Get push tokens for a device
   */
  @Get(':id/push-tokens')
  async getDevicePushTokens(@Req() req: any, @Param('id') deviceId: string) {
    return this.devicesService.getDevicePushTokens(req.user.id, deviceId);
  }
}
