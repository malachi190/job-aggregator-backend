import { Module } from '@nestjs/common';
import { FeedModule } from 'src/feed/feed.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule,FeedModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
