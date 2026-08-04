import { Module } from '@nestjs/common';
import { BaseCvsService } from './base_cvs.service';
import { BaseCvsController } from './base_cvs.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CvParserService } from './services/cv-parser.service';

@Module({
  imports: [AuthModule],
  controllers: [BaseCvsController],
  providers: [BaseCvsService, CvParserService],
})
export class BaseCvsModule {}
