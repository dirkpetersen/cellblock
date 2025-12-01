import { Module } from '@nestjs/common';
import { WardenService } from './warden.service';
import { WardenController } from './warden.controller';

@Module({
  controllers: [WardenController],
  providers: [WardenService],
  exports: [WardenService],
})
export class WardenModule {}
