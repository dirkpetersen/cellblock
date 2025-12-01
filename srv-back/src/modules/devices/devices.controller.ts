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
}
