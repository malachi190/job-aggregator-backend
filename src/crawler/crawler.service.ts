import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CrawlJobPayload } from './dto/crawl-job.payload';
import { JobSourceRegistry } from './registry/job-source.registry';

@Injectable()
export class CrawlerService {
  constructor(
    @InjectQueue('crawler')
    private readonly crawlerQueue: Queue<CrawlJobPayload>,
    private readonly prisma: PrismaService,
    private readonly registry: JobSourceRegistry,
  ) {}

  async enqueueCrawl(sourceId: string): Promise<void> {
    await this.crawlerQueue.add('crawl', { sourceId });
  }

  async enqueueAllSources(): Promise<void> {
    const sources = await this.prisma.jobSource.findMany();
    for (const source of sources) {
      if (!this.registry.hasAdapter(source.name)) continue;
      await this.crawlerQueue.add('crawl', { sourceId: source.id });
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async scheduledCrawl(): Promise<void> {
    await this.enqueueAllSources();
  }
}
