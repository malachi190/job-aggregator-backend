import {
  Global,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule } from 'src/config/config.module';
import { EnvService } from 'src/config/env.service';

@Injectable()
class RedisLifecycleService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status === 'end') return;
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (env: EnvService) => new Redis(env.redisUrl),
      inject: [EnvService],
    },
    RedisLifecycleService,
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
