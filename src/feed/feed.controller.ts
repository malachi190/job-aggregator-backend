import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'generated/prisma/client';
import { FeedService } from './feed.service';

@Controller('feed')
@UseGuards(AuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('remote') remoteRaw?: string,
    @Query('seniority') seniorityRaw?: string | string[],
    @Query('location') location?: string,
    @Query('salaryMin') salaryMinRaw?: string,
    @Query('salaryMax') salaryMaxRaw?: string,
  ) {
    const remote =
      remoteRaw === 'true' ? true : remoteRaw === 'false' ? false : undefined;

    let seniority: string[] | undefined;
    if (seniorityRaw) {
      seniority = Array.isArray(seniorityRaw)
        ? seniorityRaw
        : seniorityRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    const salaryMin = salaryMinRaw ? parseInt(salaryMinRaw, 10) : undefined;
    const salaryMax = salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : undefined;

    return this.feedService.getFeed(user.id, page, limit, {
      remote,
      seniority,
      location,
      salaryMin,
      salaryMax,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.feedService.findOne(id);
  }
}
