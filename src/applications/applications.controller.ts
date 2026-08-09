import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, ApplicationStatus } from 'generated/prisma/client';
import { ApplicationsService } from './applications.service';

@Controller('applications')
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.applicationsService.findAllByUserId(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.applicationsService.findOne(user.id, id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body('jobId') jobId: string) {
    return this.applicationsService.create(user.id, jobId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body('status') status: ApplicationStatus,
  ) {
    return this.applicationsService.updateStatus(user.id, id, status);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.applicationsService.delete(user.id, id);
  }
}
