import { Module, forwardRef } from '@nestjs/common';
import { WardenService } from './warden.service';
import { WardenController } from './warden.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [forwardRef(() => NotificationsModule)],
  controllers: [WardenController],
  providers: [WardenService],
  exports: [WardenService],
})
export class WardenModule {}
