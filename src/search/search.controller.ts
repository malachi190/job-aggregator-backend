import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SearchQuery, SearchService } from './search.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'generated/prisma/client';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser() user: User,
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('remote') remoteRaw?: string,
    @Query('seniority') seniorityRaw?: string | string[],
    @Query('location') location?: string,
    @Query('salaryMin') salaryMinRaw?: string,
    @Query('salaryMax') salaryMaxRaw?: string,
  ) {
    if (!query || query.trim().length === 0) {
      return {
        items: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const queryData: SearchQuery = {
      userId: user.id,
      query,
      page,
      limit,
      remote:
        remoteRaw === 'true' ? true : remoteRaw === 'false' ? false : undefined,
      seniority: seniorityRaw
        ? (Array.isArray(seniorityRaw) ? seniorityRaw : seniorityRaw.split(','))
            .map((value) => value.trim())
            .filter(Boolean)
        : undefined,
      location,
      salaryMin: salaryMinRaw ? parseInt(salaryMinRaw, 10) : undefined,
      salaryMax: salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : undefined,
    };

    const result = await this.searchService.search(queryData);
    return result;
  }
}
