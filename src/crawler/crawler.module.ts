import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { JobSourceRegistry } from './registry/job-source.registry';
import { RemoteOkAdapter } from './adapters/remoteok.adapter';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'crawler',
    }),
  ],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    CrawlerProcessor,
    JobSourceRegistry,
    RemoteOkAdapter,
  ],
})
export class CrawlerModule {}