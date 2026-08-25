import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  JobSourceService,
  SourceData,
  UpdateSourceData,
} from './services/job-source.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly jobSourceService: JobSourceService) {}

  @Get('/job-sources')
  async findAll() {
    return this.jobSourceService.fetchSources();
  }

  @Get('/job-sources/:id')
  async findOne(@Param('id') id: string) {
    const source = await this.jobSourceService.findOne(id);
    return source;
  }

  @Post('/job-sources')
  async create(@Body() data: SourceData) {
    const source = await this.jobSourceService.create(data);
    return source;
  }

  @Patch('/job-sources/:id')
  async update(@Param('id') id: string, @Body() data: UpdateSourceData) {
    const source = await this.jobSourceService.update(id, data);
    return source;
  }

  @Delete('/job-sources/:id')
  async remove(@Param('id') id: string) {
    await this.jobSourceService.delete(id);
    return null;
  }
}
