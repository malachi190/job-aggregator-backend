import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CrawlerService } from './crawler.service';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('crawler')
@UseGuards(AuthGuard)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('trigger/:sourceId')
  @ResponseMessage('Crawl enqueued')
  async triggerSource(@Param('sourceId') sourceId: string) {
    await this.crawlerService.enqueueCrawl(sourceId);
    return { data: { sourceId } };
  }

  @Post('trigger-all')
  @ResponseMessage('All source crawls enqueued')
  async triggerAll() {
    await this.crawlerService.enqueueAllSources();
    return { data: null };
  }
}
