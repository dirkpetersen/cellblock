import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';
import { TimeModule } from '../time/time.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule, TimeModule, forwardRef(() => NotificationsModule)],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
