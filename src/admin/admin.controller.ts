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

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly jobSourceService: JobSourceService) {}

  @Get('/job-sources')
  async findAll() {
    const sources = await this.jobSourceService.fetchSources();
    return { status: true, message: 'Job sources retrieved', data: sources };
  }

  @Get('/job-sources/:id')
  async findOne(@Param('id') id: string) {
    const source = await this.jobSourceService.findOne(id);
    return { status: true, message: 'Job source retrieved', data: source };
  }

  @Post('/job-sources')
  async create(@Body() data: SourceData) {
    const source = await this.jobSourceService.create(data);
    return { status: true, message: 'Job source created', data: source };
  }

  @Patch('/job-sources/:id')
  async update(@Param('id') id: string, @Body() data: UpdateSourceData) {
    const source = await this.jobSourceService.update(id, data);
    return { status: true, message: 'Job source updated', data: source };
  }

  @Delete('/job-sources/:id')
  async remove(@Param('id') id: string) {
    await this.jobSourceService.delete(id);
    return { status: true, message: 'Job source deleted', data: null };
  }
}
