import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { CrawlerModule } from './crawler/crawler.module';
import { ApplicationsModule } from './applications/applications.module';
import { BillingModule } from './billing/billing.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { BullModule } from '@nestjs/bullmq';
import { EnvService } from './config/env.service';
import { ScheduleModule } from '@nestjs/schedule';
import { FeedModule } from './feed/feed.module';
import { RedisModule } from './redis/redis.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { BaseCvsModule } from './base_cvs/base_cvs.module';
import { AiModule } from './ai/ai.module';
import { TailoringModule } from './tailoring/tailoring.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    ProfilesModule,
    RedisModule,
    ApplicationsModule,
    BillingModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (env: EnvService) => ({
        connection: {
          url: env.redisUrl,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      }),
      inject: [EnvService],
    }),

    ScheduleModule.forRoot(),
    // ThrottlerModule.forRoot({
    //   throttlers: [
    //     { name: 'default', limit: 500, ttl: 60_000 },
    //     { name: 'auth', limit: 5, ttl: 900_000 },
    //     { name: 'tailoring', limit: 10, ttl: 3_600_000 },
    //     { name: 'upload', limit: 10, ttl: 3_600_000 },
    //   ],
    // }),
    CrawlerModule,
    FeedModule,
    SearchModule,
    StorageModule,
    BaseCvsModule,
    AiModule,
    TailoringModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
