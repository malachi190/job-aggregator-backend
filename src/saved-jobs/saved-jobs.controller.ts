import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'generated/prisma/client';
import { SavedJobsService } from './saved-jobs.service';

@Controller('saved-jobs')
@UseGuards(AuthGuard)
export class SavedJobsController {
  constructor(private readonly savedJobs: SavedJobsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.savedJobs.findAll(user.id);
  }

  @Post(':jobId')
  save(@CurrentUser() user: User, @Param('jobId') jobId: string) {
    return this.savedJobs.save(user.id, jobId);
  }

  @Delete(':jobId')
  remove(@CurrentUser() user: User, @Param('jobId') jobId: string) {
    return this.savedJobs.remove(user.id, jobId);
  }
}
