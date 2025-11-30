import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getInfo() {
    return {
      name: 'CellBlock API',
      version: '0.1.0',
      description: 'Cross-platform digital wellbeing app with high-accountability enforcement',
      apiVersion: 'v1',
    };
  }
}
