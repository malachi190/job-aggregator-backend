import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule } from 'src/config/config.module';
import { EnvService } from 'src/config/env.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (env: EnvService) => new Redis(env.redisUrl),
      inject: [EnvService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
