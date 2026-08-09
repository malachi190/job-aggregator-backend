import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JobSourceService } from './services/job-source.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AdminService, JobSourceService],
  controllers: [AdminController]
})
export class AdminModule {}
