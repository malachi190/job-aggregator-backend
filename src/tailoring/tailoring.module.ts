import { Module } from '@nestjs/common';
import { TailoringController } from './tailoring.controller';
import { AiModule } from 'src/ai/ai.module';
import { StorageModule } from 'src/storage/storage.module';
import { RedisModule } from 'src/redis/redis.module';
import { DocxGeneratorService } from './services/docx-generator.service';
import { TailoringService } from './services/tailoring.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, AiModule, StorageModule, RedisModule],
  controllers: [TailoringController],
  providers: [TailoringService, DocxGeneratorService],
})
export class TailoringModule {}
