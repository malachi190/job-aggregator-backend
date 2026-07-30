import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { JobsModule } from './jobs/jobs.module';
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

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    ProfilesModule,
    JobsModule,
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
    CrawlerModule,
    FeedModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
