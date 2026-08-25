import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { AdminModule } from './admin/admin.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { RateLimitMiddleware } from './rate-limit/rate-limit.middleware';
import { ErrorLoggerService } from './common/logging/error-logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SavedJobsModule } from './saved-jobs/saved-jobs.module';

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
    CrawlerModule,
    FeedModule,
    SearchModule,
    StorageModule,
    BaseCvsModule,
    AiModule,
    TailoringModule,
    AdminModule,
    SavedJobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RequestLoggerMiddleware,
    RateLimitMiddleware,
    ErrorLoggerService,
    HttpExceptionFilter,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}
