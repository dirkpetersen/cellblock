import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { ApnsProvider } from './push-providers/apns.provider';
import { WnsProvider } from './push-providers/wns.provider';
import { ConsoleProvider } from './push-providers/console.provider';
import { EmailTemplateService } from './email-template.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    NotificationsService,
    ApnsProvider,
    WnsProvider,
    ConsoleProvider,
    EmailTemplateService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
