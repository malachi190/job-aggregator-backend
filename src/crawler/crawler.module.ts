import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { CrawlerProcessor } from './crawler.processor';
import { JobSourceRegistry } from './registry/job-source.registry';
import { RemotiveAdapter } from './adapters/remotive.adapter';
import { JobbermanAdapter } from './adapters/jobberman.adapter';
import { MyJobMagAdapter } from './adapters/myjobmag.adapter';
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
    RemotiveAdapter,
    JobbermanAdapter,
    MyJobMagAdapter,
  ],
})
export class CrawlerModule {}
