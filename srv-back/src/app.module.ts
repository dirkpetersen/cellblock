import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // TODO: Add feature modules here
    // AuthModule,
    // UsersModule,
    // DevicesModule,
    // TimeModule,
    // WhitelistModule,
    // WardenModule,
    // NotificationsModule,
    // WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
