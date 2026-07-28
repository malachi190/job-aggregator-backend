import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Module({
  providers: [MatchingService]
})
export class MatchingModule {}
