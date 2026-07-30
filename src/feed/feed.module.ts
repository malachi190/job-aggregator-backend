import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RedisModule, AuthModule],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}