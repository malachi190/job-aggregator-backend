import { Module } from '@nestjs/common';
import { BaseCvsService } from './base_cvs.service';
import { BaseCvsController } from './base_cvs.controller';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [AuthModule],
  providers: [BaseCvsService],
  controllers: [BaseCvsController]
})
export class BaseCvsModule {}
